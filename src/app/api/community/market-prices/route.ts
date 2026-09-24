import { NextResponse } from "next/server";
import { getLatestPrices } from "@/lib/price-fetcher";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prices = await getLatestPrices();
    return NextResponse.json({ prices, count: prices.length, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب الأسعار", prices: [], count: 0 }, { status: 500 });
  }
}
