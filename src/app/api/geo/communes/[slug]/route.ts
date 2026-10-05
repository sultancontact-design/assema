// ===================================================================
//  GET /api/geo/communes/[slug]
//  يعيد تفاصيل جماعة واحدة + الإقليم + الجهة + الجماعات الشقيقة
//  (sister communes = جماعات أخرى في نفس الإقليم)
//
//  v70.0 note: uses $queryRawUnsafe because the long-running dev server's
//  PrismaClient was loaded before the Commune model was generated.
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
  isActive: number;
  createdAt: string;
  provinceName: string | null;
  provinceNameAr: string | null;
  provinceNameFr: string | null;
  provinceSlug: string | null;
  regionName: string | null;
  regionNameAr: string | null;
  regionNameFr: string | null;
  regionSlug: string | null;
};

type SisterRow = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string | null;
  slug: string;
  type: string;
  population: number | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const rows = (await db.$queryRawUnsafe(
      `SELECT
         c.id, c.name, c.nameAr, c.nameFr, c.slug, c.type, c.code,
         c.provinceId, c.regionId, c.population, c.latitude, c.longitude,
         c.isActive, c.createdAt,
         p.name   AS provinceName,
         p.nameAr AS provinceNameAr,
         p.nameFr AS provinceNameFr,
         p.slug   AS provinceSlug,
         r.name   AS regionName,
         r.nameAr AS regionNameAr,
         r.nameFr AS regionNameFr,
         r.slug   AS regionSlug
       FROM Commune c
       LEFT JOIN Province p ON c.provinceId = p.id
       LEFT JOIN Region   r ON c.regionId   = r.id
       WHERE c.slug = ?
       LIMIT 1`,
      slug
    )) as CommuneRow[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Commune not found", slug },
        { status: 404 }
      );
    }

    const c = rows[0];

    const sisters = (await db.$queryRawUnsafe(
      `SELECT id, name, nameAr, nameFr, slug, type, population
       FROM Commune
       WHERE provinceId = ? AND isActive = 1 AND id != ?
       ORDER BY type ASC, nameAr ASC
       LIMIT 50`,
      c.provinceId, c.id
    )) as SisterRow[];

    return NextResponse.json({
      commune: {
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        slug: c.slug,
        type: c.type,
        code: c.code,
        population: c.population,
        latitude: c.latitude,
        longitude: c.longitude,
        isActive: Boolean(c.isActive),
        createdAt: c.createdAt,
        province: c.provinceSlug
          ? {
              id: c.provinceId,
              name: c.provinceName!,
              nameAr: c.provinceNameAr!,
              nameFr: c.provinceNameFr,
              slug: c.provinceSlug!,
              region: c.regionSlug
                ? {
                    id: c.regionId!,
                    name: c.regionName!,
                    nameAr: c.regionNameAr!,
                    nameFr: c.regionNameFr,
                    slug: c.regionSlug!,
                  }
                : null,
            }
          : null,
        region: c.regionSlug
          ? {
              id: c.regionId!,
              name: c.regionName!,
              nameAr: c.regionNameAr!,
              nameFr: c.regionNameFr,
              slug: c.regionSlug!,
            }
          : null,
      },
      sisterCommunes: sisters.map((s) => ({
        id: s.id,
        name: s.name,
        nameAr: s.nameAr,
        nameFr: s.nameFr,
        slug: s.slug,
        type: s.type,
        population: s.population,
      })),
    });
  } catch (error) {
    console.error("[geo/communes/[slug]] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commune" },
      { status: 500 }
    );
  }
}
