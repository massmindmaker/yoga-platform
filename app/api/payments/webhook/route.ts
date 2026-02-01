import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/tbank";

// POST /api/payments/webhook - webhook от T-Bank
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("T-Bank webhook received:", data);

    const result = await handlePaymentWebhook(data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error handling payment webhook:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
