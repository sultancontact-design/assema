// GET: public feature flags (no auth)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const flags = await db.featureFlag.findMany({
    where: { status: { in: ["ACTIVE", "HIDDEN", "MAINTENANCE", "COMING_SOON"] } },
    select: { key: true, nameAr: true, category: true, status: true, message: true, startsAt: true, endsAt: true },
  });
  return NextResponse.json({ flags, count: flags.length });
}
