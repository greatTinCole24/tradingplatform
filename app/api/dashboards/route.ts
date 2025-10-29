import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboards = await prisma.dashboard.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        apiConnection: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, query, chartConfig, apiConnectionId } = body;

    if (!title || !query || !chartConfig) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        title,
        query,
        chartConfig,
        apiConnectionId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error("Failed to create dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}

