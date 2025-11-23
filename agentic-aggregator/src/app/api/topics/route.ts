import { NextResponse } from "next/server";
import { collectAndAggregate } from "@/lib/collect";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await collectAndAggregate();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to collect topics", error);
    return NextResponse.json({ error: "Failed to collect topics" }, { status: 500 });
  }
}
