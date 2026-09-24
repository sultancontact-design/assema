import { NextResponse } from "next/server";
import { fetchPrices } from "@/lib/price-fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
    const result = await fetchPrices();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "unknown" }, { status: 500 });
  }
}
