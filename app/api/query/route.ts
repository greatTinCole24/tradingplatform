import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import {
  tools,
  executeFetchApiData,
  executeBuildChart,
  generateMockData,
} from "@/lib/llm/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Missing query" },
        { status: 400 }
      );
    }

    // Get user's API connections
    const connections = await prisma.apiConnection.findMany({
      where: {
        userId: session.user.id,
      },
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { error: "No API connections found" },
        { status: 400 }
      );
    }

    // For demo purposes, we'll use mock data
    // In production, you'd use the actual API connections
    const systemPrompt = `You are a financial data analyst assistant. You help users query and visualize financial data.

Available APIs: ${connections.map((c) => c.name).join(", ")}

When a user asks for data:
1. First, fetch the data using fetch_api_data (for demo, use mock data)
2. Then, create a visualization using build_chart

Be helpful and interpret the user's natural language query to determine:
- What symbols/tickers they're interested in
- What time period
- What type of chart would be best (line for time series, bar for comparisons)

For this demo, use mock data generation instead of actual API calls.`;

    let chartConfig: any = null;
    let rawData: any[] = [];
    let messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ];

    // Run LLM with tools
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
      });

      const message = response.choices[0].message;
      messages.push(message);

      // If no tool calls, we're done
      if (!message.tool_calls || message.tool_calls.length === 0) {
        break;
      }

      // Execute tool calls
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result: any;

        try {
          if (functionName === "fetch_api_data") {
            // For demo, generate mock data based on the query
            // Extract symbols from query
            const symbolMatch = query.match(
              /\b([A-Z]{1,5})\b/g
            );
            const symbols = symbolMatch || ["AAPL", "SPY"];

            // Determine time period
            let days = 180;
            if (query.includes("week")) days = 7;
            else if (query.includes("month")) days = 30;
            else if (query.includes("year")) days = 365;

            // Generate data for each symbol
            const allData = symbols.flatMap((symbol) =>
              generateMockData(symbol, days)
            );

            rawData = allData;
            result = { success: true, data: allData };
          } else if (functionName === "build_chart") {
            chartConfig = executeBuildChart(
              functionArgs.type,
              functionArgs.title,
              functionArgs.xKey,
              functionArgs.yKeys,
              rawData
            );
            result = { success: true, chart: chartConfig };
          } else {
            result = { error: "Unknown function" };
          }
        } catch (error: any) {
          result = { error: error.message };
        }

        // Add tool result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Create a dashboard title from the query
    const title = query.length > 50 ? query.substring(0, 47) + "..." : query;

    // Save dashboard if we have a chart config
    if (chartConfig) {
      await prisma.dashboard.create({
        data: {
          title,
          query,
          chartConfig,
          userId: session.user.id,
          apiConnectionId: connections[0].id,
        },
      });
    }

    return NextResponse.json({
      rawData,
      chartConfig,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error: any) {
    console.error("Query execution failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute query" },
      { status: 500 }
    );
  }
}

