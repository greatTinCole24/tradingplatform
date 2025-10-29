import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { baseUrl, apiKey } = body;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Attempt a simple GET request to test the API
    // This is a generic test - in production, you'd want to be more sophisticated
    try {
      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
        timeout: 5000,
      });

      return NextResponse.json({
        success: true,
        status: response.status,
        data: response.data,
      });
    } catch (axiosError: any) {
      // API might be working but returned an error response
      if (axiosError.response) {
        return NextResponse.json({
          success: false,
          status: axiosError.response.status,
          error: axiosError.response.data,
        });
      }
      throw axiosError;
    }
  } catch (error: any) {
    console.error("API test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to API",
      },
      { status: 500 }
    );
  }
}

