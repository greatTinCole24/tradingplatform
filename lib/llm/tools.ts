import axios from "axios";
import { z } from "zod";

// Tool schemas for OpenAI function calling
export const tools = [
  {
    type: "function" as const,
    function: {
      name: "fetch_api_data",
      description:
        "Fetch data from a connected API endpoint. Use this to retrieve financial data like stock prices, market data, etc.",
      parameters: {
        type: "object",
        properties: {
          endpoint: {
            type: "string",
            description:
              "The API endpoint path (e.g., '/quote/AAPL', '/timeseries/daily')",
          },
          params: {
            type: "object",
            description:
              "Query parameters to send with the request (e.g., {symbol: 'AAPL', interval: '1day'})",
          },
        },
        required: ["endpoint"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "build_chart",
      description:
        "Create a chart visualization from data. Call this after fetching data to visualize it.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["line", "bar"],
            description: "The type of chart to create",
          },
          title: {
            type: "string",
            description: "The title for the chart",
          },
          xKey: {
            type: "string",
            description:
              "The key in the data to use for the X axis (e.g., 'date', 'time')",
          },
          yKeys: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "Array of keys in the data to plot on the Y axis (e.g., ['price', 'volume'])",
          },
        },
        required: ["type", "title", "xKey", "yKeys"],
      },
    },
  },
];

// Tool execution functions
export async function executeFetchApiData(
  endpoint: string,
  params: Record<string, any> | undefined,
  apiConnection: { baseUrl: string; apiKey: string }
): Promise<any> {
  try {
    const url = `${apiConnection.baseUrl}${endpoint}`;
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${apiConnection.apiKey}`,
        "X-API-Key": apiConnection.apiKey,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    console.error("API fetch error:", error);
    throw new Error(
      `Failed to fetch data: ${error.response?.data?.error || error.message}`
    );
  }
}

export function executeBuildChart(
  type: "line" | "bar",
  title: string,
  xKey: string,
  yKeys: string[],
  data: any[]
): any {
  // Validate that the keys exist in the data
  if (data.length === 0) {
    throw new Error("No data available to build chart");
  }

  const firstItem = data[0];
  if (!firstItem[xKey]) {
    throw new Error(`X key '${xKey}' not found in data`);
  }

  for (const yKey of yKeys) {
    if (!firstItem[yKey]) {
      throw new Error(`Y key '${yKey}' not found in data`);
    }
  }

  return {
    type,
    title,
    xKey,
    yKeys,
    data,
  };
}

// Mock data generator for demo purposes
export function generateMockData(symbol: string, days: number = 180): any[] {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const basePrice = symbol === "AAPL" ? 150 : symbol === "SPY" ? 400 : 100;
    const volatility = 0.02;
    const trend = (days - i) * 0.05;
    const randomWalk = Math.random() * volatility * basePrice;

    data.push({
      date: date.toISOString().split("T")[0],
      price: Number(
        (basePrice + trend + randomWalk + Math.sin(i / 10) * 5).toFixed(2)
      ),
      volume: Math.floor(Math.random() * 1000000 + 500000),
      symbol,
    });
  }

  return data;
}

