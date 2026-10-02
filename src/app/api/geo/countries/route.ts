import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const countries = await db.country.findMany({
      include: { diasporaCities: { orderBy: { nameAr: "asc" } } },
      orderBy: { nameAr: "asc" },
    });
    return NextResponse.json({ countries });
  } catch (error) {
    console.error("[geo/countries] error:", error);
    return NextResponse.json({ countries: [] });
  }
}
