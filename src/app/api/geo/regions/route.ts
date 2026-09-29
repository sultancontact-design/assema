import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const regions = await db.region.findMany({
      include: { cities: { where: { isActive: true }, orderBy: { nameAr: "asc" } } },
      orderBy: { nameAr: "asc" },
    });
    return NextResponse.json({ regions });
  } catch (error) {
    console.error("[geo/regions] error:", error);
    return NextResponse.json({ regions: [] });
  }
}
