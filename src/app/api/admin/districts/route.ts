// ===================================================================
//  POST /api/admin/districts — إنشاء حي جديد
//  - يتطلّب صلاحية district.create (SUPER_ADMIN فقط)
//  - إذا isDefault=true يُزيل isDefault من باقي الأحياء
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (!hasPermission(user.role, "district.create")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية إنشاء حي" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          name?: string;
          slug?: string;
          city?: string;
          region?: string;
          description?: string | null;
          boundarySvg?: string | null;
          isActive?: boolean;
          isDefault?: boolean;
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "اسم الحي مطلوب" }, { status: 400 });
    }
    if (!body.slug || !body.slug.trim()) {
      return NextResponse.json({ error: "المعرّف (slug) مطلوب" }, { status: 400 });
    }

    // تحقّق من فرادة الـslug والاسم
    const existing = await db.district.findFirst({
      where: {
        OR: [{ slug: body.slug.trim() }, { name: body.name.trim() }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "اسم الحي أو المعرّف مُستعمل بالفعل" },
        { status: 409 }
      );
    }

    const isDefault = body.isDefault ?? false;

    // إذا isDefault=true نُزيل isDefault من باقي الأحياء
    if (isDefault) {
      await db.district.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const district = await db.district.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
        city: body.city?.trim() || "مراكش",
        region: body.region?.trim() || "مراكش آسفي",
        description: body.description?.trim() || null,
        boundarySvg: body.boundarySvg?.trim() || null,
        isActive: body.isActive ?? true,
        isDefault,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "district.created",
        entity: "District",
        entityId: district.id,
        severity: "info",
        metadata: JSON.stringify({
          name: district.name,
          slug: district.slug,
          isDefault,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json(
      { success: true, district: { id: district.id, name: district.name, slug: district.slug } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/districts]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحي" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  GET /api/admin/districts — قائمة الأحياء (للاستخدام في client side)
// ===================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "district.view")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const districts = await db.district.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        region: true,
        isDefault: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ districts });
  } catch (err) {
    console.error("[GET /api/admin/districts]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الأحياء" },
      { status: 500 }
    );
  }
}
