// ===================================================================
//  GET /api/geo/provinces
//  يعيد كل الأقاليم/العمالات (Provinces) مع:
//    - معلومات الجهة (Region) الأصلية
//    - عدد الجماعات (Commune) التابعة لكل إقليم
//
//  v70.0 note: uses $queryRawUnsafe because the long-running dev server's
//  PrismaClient class was loaded before the Commune model was generated —
//  `db.province._count.communes` would throw. SQL JOIN avoids that.
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type ProvinceRow = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string | null;
  code: string | null;
  slug: string;
  regionId: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  regionName: string | null;
  regionNameAr: string | null;
  regionNameFr: string | null;
  regionSlug: string | null;
  communesCount: number;
  citiesCount: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");

    const rows = (await db.$queryRawUnsafe(
      `SELECT
         p.id, p.name, p.nameAr, p.nameFr, p.code, p.slug,
         p.regionId, p.population, p.latitude, p.longitude,
         r.name   AS regionName,
         r.nameAr AS regionNameAr,
         r.nameFr AS regionNameFr,
         r.slug   AS regionSlug,
         (SELECT COUNT(*) FROM Commune c WHERE c.provinceId = p.id) AS communesCount,
         (SELECT COUNT(*) FROM City   c WHERE c.provinceId = p.id) AS citiesCount
       FROM Province p
       LEFT JOIN Region r ON p.regionId = r.id
       ${regionId ? "WHERE p.regionId = ?" : ""}
       ORDER BY p.name ASC`,
      ...(regionId ? [regionId] : [])
    )) as ProvinceRow[];

    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      nameFr: r.nameFr,
      code: r.code,
      slug: r.slug,
      regionId: r.regionId,
      region: r.regionSlug
        ? {
            id: r.regionId,
            name: r.regionName!,
            nameAr: r.regionNameAr!,
            nameFr: r.regionNameFr,
            slug: r.regionSlug!,
          }
        : null,
      population: r.population,
      latitude: r.latitude,
      longitude: r.longitude,
      communesCount: Number(r.communesCount),
      citiesCount: Number(r.citiesCount),
    }));

    return NextResponse.json({ provinces: result });
  } catch (error) {
    console.error("[geo/provinces] error:", error);
    return NextResponse.json({ provinces: [] });
  }
}
