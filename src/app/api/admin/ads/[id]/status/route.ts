// ===================================================================
//  PATCH /api/admin/ads/[id]/status — تغيير حالة الإعلان
//  - يستعمل للتفعيل/الإيقاف/الرفض/الموافقة
//  - يتطلّب صلاحية ad.approve (للحالات ACTIVE/PAUSED/REJECTED)
//    أو ad.edit (للحالات الأخرى)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["DRAFT", "PENDING", "ACTIVE", "PAUSED", "EXPIRED", "REJECTED"] as const;
type TargetStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | { status?: string; reason?: string }
      | null;

    if (!body?.status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(body.status as TargetStatus)) {
      return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
    }

    const targetStatus = body.status as TargetStatus;

    // الموافقة/الرفض يتطلّب صلاحية ad.approve
    // الإيقاف/التفعيل (PAUSED ↔ ACTIVE) يتطلّب ad.edit
    const requiresApprove = ["ACTIVE", "REJECTED"].includes(targetStatus);
    const permission = requiresApprove ? "ad.approve" : "ad.edit";
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        { error: `ليس لديك صلاحية: ${permission}` },
        { status: 403 }
      );
    }

    const existing = await db.ad.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }
    if (existing.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "الإعلان خارج نطاق حيّك" },
        { status: 403 }
      );
    }

    const updated = await db.ad.update({
      where: { id },
      data: { status: targetStatus, managerId: user.id },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ad.status_changed",
        entity: "Ad",
        entityId: updated.id,
        severity: targetStatus === "REJECTED" ? "warning" : "info",
        metadata: JSON.stringify({
          from: existing.status,
          to: targetStatus,
          reason: body.reason ?? null,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      ad: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/ads/[id]/status]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الحالة" },
      { status: 500 }
    );
  }
}
