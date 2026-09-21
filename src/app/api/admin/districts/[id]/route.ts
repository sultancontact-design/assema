// ===================================================================
//  PATCH /api/admin/districts/[id] — تحديث حي موجود
//  - يتطلّب صلاحية district.edit (SUPER_ADMIN)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (!hasPermission(user.role, "district.edit")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية تعديل حي" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.district.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "الحي غير موجود" }, { status: 404 });
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

    // تحقّق من فرادة الـslug/الاسم (إن تغيّرا)
    if (body.slug && body.slug.trim() !== existing.slug) {
      const conflict = await db.district.findFirst({
        where: { slug: body.slug.trim(), NOT: { id }, deletedAt: null },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "المعرّف (slug) مُستعمل بالفعل" },
          { status: 409 }
        );
      }
    }
    if (body.name && body.name.trim() !== existing.name) {
      const conflict = await db.district.findFirst({
        where: { name: body.name.trim(), NOT: { id }, deletedAt: null },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "اسم الحي مُستعمل بالفعل" },
          { status: 409 }
        );
      }
    }

    // إذا isDefault=true نُزيل isDefault من باقي الأحياء
    if (body.isDefault === true && !existing.isDefault) {
      await db.district.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const data: {
      name?: string;
      slug?: string;
      city?: string;
      region?: string;
      description?: string | null;
      boundarySvg?: string | null;
      isActive?: boolean;
      isDefault?: boolean;
    } = {};

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.slug !== undefined) data.slug = body.slug.trim();
    if (body.city !== undefined) data.city = body.city.trim();
    if (body.region !== undefined) data.region = body.region.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.boundarySvg !== undefined) data.boundarySvg = body.boundarySvg?.trim() || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.isDefault !== undefined) data.isDefault = body.isDefault;

    const updated = await db.district.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, isActive: true, isDefault: true },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "district.updated",
        entity: "District",
        entityId: id,
        severity: "info",
        metadata: JSON.stringify({
          name: updated.name,
          slug: updated.slug,
          changes: Object.keys(data),
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ success: true, district: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/districts/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الحي" },
      { status: 500 }
    );
  }
}
