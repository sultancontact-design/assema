// ===================================================================
//  POST /api/community/districts/join — انضمام العضو لحيّ آخر (self-service)
//  - Body: { targetDistrictSlug: string }
//  - يتطلّب مصادقة فقط (Member يحقّ له تغيير حيّه)
//  - يُحدّث user.districtId و user.familyId (إن لم تكن العائلة في الحي الجديد)
//  - يمنع النقل إذا العضو أمين صندوق/مشرف حي (يحتاج إشرافاً)
//  - يكتب AuditLog + يُبطل cache إحصاءات الحي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateFundStats } from "@/lib/fund-stats";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للانضمام إلى حيّ" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { targetDistrictSlug?: string }
      | null;

    if (!body || !body.targetDistrictSlug) {
      return NextResponse.json(
        { error: "slug الحي الهدف مطلوب" },
        { status: 400 }
      );
    }

    const targetDistrict = await db.district.findUnique({
      where: { slug: body.targetDistrictSlug },
      select: { id: true, name: true, isActive: true, deletedAt: true },
    });
    if (!targetDistrict || targetDistrict.deletedAt) {
      return NextResponse.json(
        { error: "الحي الهدف غير موجود" },
        { status: 404 }
      );
    }
    if (!targetDistrict.isActive) {
      return NextResponse.json(
        { error: "الحي الهدف غير نشط حالياً" },
        { status: 400 }
      );
    }

    // منع الموظفين المُقيّدين بحيّ من الانتقال الذاتي (مشرف حيّ / أمين صندوق)
    const staffRoles = [
      "DISTRICT_MOD",
      "TREASURER",
      "ETHICS_COMMITTEE",
      "SUPER_ADMIN",
      "ADS_MANAGER",
      "GROUP_LEADER",
    ];
    if (staffRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error:
            "بصفتك موظفاً في الحي الحالي، لا يمكنك الانتقال ذاتياً. تواصل مع مشرف عام.",
        },
        { status: 403 }
      );
    }

    // العضو ينتقل: نُفرّغ familyId لو لم تكن العائلة في الحي الجديد
    const targetUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, districtId: true, familyId: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "تعذّر العثور على العضو" },
        { status: 404 }
      );
    }
    if (targetUser.districtId === targetDistrict.id) {
      return NextResponse.json(
        { error: "أنت عضو بالفعل في هذا الحي" },
        { status: 409 }
      );
    }

    let newFamilyId: string | null = targetUser.familyId;
    let familyCleared = false;
    if (targetUser.familyId) {
      const family = await db.family.findUnique({
        where: { id: targetUser.familyId },
        select: { districtId: true },
      });
      if (!family || family.districtId !== targetDistrict.id) {
        newFamilyId = null;
        familyCleared = true;
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        districtId: targetDistrict.id,
        familyId: newFamilyId,
      },
    });

    // تحديث إحصاءات الأحياء القديمة والجديدة
    const oldDistrictId = targetUser.districtId;
    await Promise.all([
      updateDistrictStats(oldDistrictId),
      updateDistrictStats(targetDistrict.id),
    ]);
    await invalidateFundStats();

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "district.user_joined",
        entity: "User",
        entityId: user.id,
        severity: "info",
        metadata: JSON.stringify({
          userId: user.id,
          fromDistrictId: oldDistrictId,
          toDistrictId: targetDistrict.id,
          toDistrictName: targetDistrict.name,
          familyIdCleared: familyCleared,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم الانضمام إلى حيّ «${targetDistrict.name}»`,
      districtId: targetDistrict.id,
      familyIdCleared: familyCleared,
    });
  } catch (err) {
    console.error("[POST /api/community/districts/join]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الانضمام إلى الحي" },
      { status: 500 }
    );
  }
}

/** إعادة حساب أعضاء/أسر/مساهمات الحي بعد تغيير العضوية */
async function updateDistrictStats(districtId: string) {
  try {
    const [members, familiesCount, contribAgg] = await Promise.all([
      db.user.count({
        where: { districtId, deletedAt: null, status: "ACTIVE" },
      }),
      db.family.count({
        where: { districtId, deletedAt: null, isActive: true },
      }),
      db.contribution.aggregate({
        where: { districtId, status: "CONFIRMED" },
        _sum: { amount: true },
      }),
    ]);
    await db.district.update({
      where: { id: districtId },
      data: {
        members,
        familiesCount,
        contributions: Math.round(contribAgg._sum?.amount ?? 0),
      },
    });
  } catch {
    // تجاهل: التحديث غير حاسم
  }
}
