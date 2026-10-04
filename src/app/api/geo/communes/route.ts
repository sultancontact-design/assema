// ===================================================================
//  GET /api/geo/communes?provinceId=...&regionId=...&type=...
//  يعيد قائمة الجماعات (Communes) مع إمكانية التصفية حسب:
//    - provinceId (الإقليم)
//    - regionId    (الجهة)
//    - type        (rural | urban | arrondissement)
//
//  v70.0 note: uses $queryRawUnsafe because the long-running dev server's
//  PrismaClient was loaded before the Commune model was generated. SQL
//  JOIN keeps the response shape compatible with the typed-client version.
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type CommuneRow = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string | null;
  slug: string;
  type: string;
  code: string | null;
  provinceId: string;
  regionId: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  provinceName: string | null;
  provinceNameAr: string | null;
  provinceSlug: string | null;
  regionName: string | null;
  regionNameAr: string | null;
  regionSlug: string | null;
};

const VALID_TYPES = new Set(["rural", "urban", "arrondissement"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get("provinceId");
    const regionId = searchParams.get("regionId");
    const type = searchParams.get("type");

    const conditions: string[] = ["c.isActive = 1"];
    const params: (string | number)[] = [];

    if (provinceId) {
      conditions.push("c.provinceId = ?");
      params.push(provinceId);
    }
    if (regionId) {
      conditions.push("c.regionId = ?");
      params.push(regionId);
    }
    if (type && VALID_TYPES.has(type)) {
      conditions.push("c.type = ?");
      params.push(type);
    }

    const rows = (await db.$queryRawUnsafe(
      `SELECT
         c.id, c.name, c.nameAr, c.nameFr, c.slug, c.type, c.code,
         c.provinceId, c.regionId, c.population, c.latitude, c.longitude,
         p.name   AS provinceName,
         p.nameAr AS provinceNameAr,
         p.slug   AS provinceSlug,
         r.name   AS regionName,
         r.nameAr AS regionNameAr,
         r.slug   AS regionSlug
       FROM Commune c
       LEFT JOIN Province p ON c.provinceId = p.id
       LEFT JOIN Region   r ON c.regionId   = r.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY c.type ASC, c.nameAr ASC`,
      ...params
    )) as CommuneRow[];

    const communes = rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      nameFr: r.nameFr,
      slug: r.slug,
      type: r.type,
      code: r.code,
      provinceId: r.provinceId,
      regionId: r.regionId,
      population: r.population,
      latitude: r.latitude,
      longitude: r.longitude,
      province: r.provinceSlug
        ? {
            id: r.provinceId,
            name: r.provinceName!,
            nameAr: r.provinceNameAr!,
            slug: r.provinceSlug!,
          }
        : null,
      region: r.regionSlug
        ? {
            id: r.regionId!,
            name: r.regionName!,
            nameAr: r.regionNameAr!,
            slug: r.regionSlug!,
          }
        : null,
    }));

    return NextResponse.json({
      communes,
      count: communes.length,
      filters: {
        provinceId: provinceId || null,
        regionId: regionId || null,
        type: type && VALID_TYPES.has(type) ? type : null,
      },
    });
  } catch (error) {
    console.error("[geo/communes] error:", error);
    return NextResponse.json({ communes: [], count: 0 });
  }
}
