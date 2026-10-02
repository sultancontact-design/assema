import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");
    const cities = await db.city.findMany({
      where: { isActive: true, ...(regionId ? { regionId } : {}) },
      orderBy: { nameAr: "asc" },
      select: { id: true, nameAr: true, name: true, slug: true, regionId: true },
    });
    return NextResponse.json({ cities });
  } catch (error) {
    console.error("[geo/cities] error:", error);
    return NextResponse.json({ cities: [] });
  }
}
