// ===================================================================
//  GET /api/geo/districts?cityId=...&citySlug=...
//  يعيد قائمة الأحياء التابعة لمدينة محدّدة
//  - إن لم تُمرّر cityId/citySlug يُعيد الأحياء الافتراضية فقط
//  - يدعم المطابقة المرنة: cityId OR city.name == district.city (legacy string field)
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId");
    const citySlug = searchParams.get("citySlug");

    // ابحث عن المدينة إن مرّ slug أو id
    let resolvedCityId = cityId ?? null;
    let resolvedCityName: string | null = null;
    if (!resolvedCityId && citySlug) {
      const c = await db.city.findUnique({
        where: { slug: citySlug },
        select: { id: true, name: true, nameAr: true },
      });
      if (c) {
        resolvedCityId = c.id;
        resolvedCityName = c.name;
      }
    } else if (resolvedCityId) {
      const c = await db.city.findUnique({
        where: { id: resolvedCityId },
        select: { name: true, nameAr: true },
      });
      resolvedCityName = c?.name ?? null;
    }

    // استعلام مرن: districts WHERE cityId == resolvedCityId OR city == resolvedCityName
    const districts = await db.district.findMany({
      where: {
        isActive: true,
        ...(resolvedCityId || resolvedCityName
          ? {
              OR: [
                ...(resolvedCityId ? [{ cityId: resolvedCityId }] : []),
                ...(resolvedCityName ? [{ city: resolvedCityName }] : []),
              ],
            }
          : { isDefault: true }),
      },
      orderBy: [{ isDefault: "desc" }, { nameAr: "asc" }],
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        city: true,
        region: true,
        members: true,
        familiesCount: true,
        contributions: true,
        description: true,
        cityId: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json({ districts, cityId: resolvedCityId });
  } catch (error) {
    console.error("[geo/districts] error:", error);
    return NextResponse.json({ districts: [] });
  }
}
