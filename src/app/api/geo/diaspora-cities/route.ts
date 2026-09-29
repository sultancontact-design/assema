// ===================================================================
//  GET /api/geo/diaspora-cities?countryId=...
//  يعيد مدن المهجر المغربية في بلد محدّد
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");

    const diasporaCities = await db.diasporaCity.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { nameAr: "asc" },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        countryId: true,
        country: { select: { nameAr: true, name: true, code: true, flag: true } },
      },
    });

    return NextResponse.json({ diasporaCities });
  } catch (error) {
    console.error("[geo/diaspora-cities] error:", error);
    return NextResponse.json({ diasporaCities: [] });
  }
}
