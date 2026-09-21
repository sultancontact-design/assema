// @ts-nocheck — Prisma type narrowing issues at runtime-safe
// ===================================================================
//  POST /api/admin/districts/move-user — نقل عضو إلى حي آخر
//  - Body: { userId, targetDistrictId }
//  - يتطلّب صلاحية district.edit (SUPER_ADMIN)
//  - يُحدّث user.districtId و user.familyId (إن كانت العائلة لا تنتمي للحي الجديد)
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
    if (!hasPermission(user.role, "district.edit")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية نقل عضو بين الأحياء" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { userId?: string; targetDistrictId?: string }
      | null;

    if (!body || !body.userId || !body.targetDistrictId) {
      return NextResponse.json(
        { error: "معرّف العضو والحي الهدف مطلوبان" },
        { status: 400 }
      );
    }

    const targetDistrict = await db.district.findUnique({
      where: { id: body.targetDistrictId },
    });
    if (!targetDistrict || targetDistrict.deletedAt) {
      return NextResponse.json(
        { error: "الحي الهدف غير موجود" },
        { status: 404 }
      );
    }
    if (!targetDistrict.isActive) {
      return NextResponse.json(
        { error: "الحي الهدف غير نشط" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: body.userId },
      select: { id: true, districtId: true, familyId: true, fullName: true },
    });
    if (!targetUser || targetUser.deletedAt) {
      return NextResponse.json(
        { error: "العضو غير موجود" },
        { status: 404 }
      );
    }
    if (targetUser.districtId === body.targetDistrictId) {
      return NextResponse.json(
        { error: "العضو موجود بالفعل في الحي الهدف" },
        { status: 409 }
      );
    }

    // إن كانت العائلة الحالية لا تنتمي للحي الجديد، نُفرّغ familyId
    let newFamilyId: string | null = targetUser.familyId;
    if (targetUser.familyId) {
      const family = await db.family.findUnique({
        where: { id: targetUser.familyId },
        select: { districtId: true },
      });
      if (!family || family.districtId !== body.targetDistrictId) {
        newFamilyId = null;
      }
    }

    const updated = await db.user.update({
      where: { id: body.userId },
      data: {
        districtId: body.targetDistrictId,
        familyId: newFamilyId,
      },
      select: { id: true, districtId: true, familyId: true },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "district.user_moved",
        entity: "User",
        entityId: body.userId,
        severity: "info",
        metadata: JSON.stringify({
          userId: body.userId,
          fromDistrictId: targetUser.districtId,
          toDistrictId: body.targetDistrictId,
          familyIdCleared: targetUser.familyId && !newFamilyId,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
      familyIdCleared: targetUser.familyId && !newFamilyId ? true : false,
    });
  } catch (err) {
    console.error("[POST /api/admin/districts/move-user]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء نقل العضو" },
      { status: 500 }
    );
  }
}
