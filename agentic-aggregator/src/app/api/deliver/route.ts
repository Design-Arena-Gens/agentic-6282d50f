import { NextRequest, NextResponse } from "next/server";
import { collectAndAggregate } from "@/lib/collect";
import { deliverAggregation } from "@/lib/deliver";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const deliveryOptions = body.delivery ?? {
      telegram: { enabled: true },
      email: { enabled: true },
    };

    const aggregation = await collectAndAggregate();
    const delivery = await deliverAggregation(aggregation, deliveryOptions);

    return NextResponse.json({
      aggregation,
      delivery,
    });
  } catch (error) {
    console.error("Failed to deliver aggregation", error);
    return NextResponse.json({ error: "Failed to deliver aggregation" }, { status: 500 });
  }
}
