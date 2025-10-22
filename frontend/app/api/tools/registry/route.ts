import { NextResponse } from "next/server";

import { getRegistryPayload } from "@/lib/mock-backend";

export function GET() {
  return NextResponse.json(getRegistryPayload());
}
