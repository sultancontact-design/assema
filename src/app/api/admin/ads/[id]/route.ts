// ===================================================================
//  PATCH/DELETE /api/admin/ads/[id]
//  - PATCH: تحديث حقول الحملة (ad.edit)
//  - DELETE: حذف نهائي (ad.delete) — لا يوجد soft delete على نموذج Ad
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { AD_PACKAGE_LABELS, AD_PLACEMENT_LABELS } from "@/lib/constants";
import type { AdPackage } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_PACKAGES = Object.keys(AD_PACKAGE_LABELS) as AdPackage[];
const VALID_PLACEMENTS = Object.keys(AD_PLACEMENT_LABELS);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.edit")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتعديل الإعلان" },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    // بناء كائن التحديث ديناميكياً
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.advertiserName === "string" && body.advertiserName.trim()) {
      data.advertiserName = body.advertiserName.trim();
    }
    if (typeof body.advertiserEmail === "string") {
      data.advertiserEmail = body.advertiserEmail.trim() || null;
    }
    if (typeof body.advertiserPhone === "string") {
      data.advertiserPhone = body.advertiserPhone.trim() || null;
    }
    if (typeof body.package === "string") {
      if (!VALID_PACKAGES.includes(body.package as AdPackage)) {
        return NextResponse.json({ error: "الباقة غير صالحة" }, { status: 400 });
      }
      data.package = body.package;
    }
    if (typeof body.placement === "string") {
      if (!VALID_PLACEMENTS.includes(body.placement)) {
        return NextResponse.json({ error: "المكان غير صالح" }, { status: 400 });
      }
      data.placement = body.placement;
    }
    if (typeof body.imageUrl === "string") {
      data.imageUrl = body.imageUrl.trim() || null;
    }
    if (typeof body.targetUrl === "string") {
      data.targetUrl = body.targetUrl.trim() || null;
    }
    if (body.startDate !== undefined) {
      const d = new Date(body.startDate as string);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "صيغة تاريخ البداية غير صحيحة" }, { status: 400 });
      }
      data.startDate = d;
    }
    if (body.endDate !== undefined) {
      const d = new Date(body.endDate as string);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "صيغة تاريخ النهاية غير صحيحة" }, { status: 400 });
      }
      data.endDate = d;
    }
    if (body.amountPaid !== undefined) {
      const v = Number(body.amountPaid);
      if (isNaN(v) || v < 0) {
        return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
      }
      data.amountPaid = v;
    }
    if (typeof body.status === "string") {
      const validStatuses = ["DRAFT", "PENDING", "ACTIVE", "PAUSED", "EXPIRED", "REJECTED"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
      }
      data.status = body.status;
    }

    // تحقّق من ترتيب التواريخ بعد التحديث
    const newStart = (data.startDate as Date | undefined) ?? existing.startDate;
    const newEnd = (data.endDate as Date | undefined) ?? existing.endDate;
    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" },
        { status: 400 }
      );
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "لا توجد حقول لتحديثها" },
        { status: 400 }
      );
    }

    const updated = await db.ad.update({
      where: { id },
      data,
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ad.updated",
        entity: "Ad",
        entityId: updated.id,
        severity: "info",
        metadata: JSON.stringify({ fields: Object.keys(data) }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      ad: { id: updated.id, title: updated.title, status: updated.status },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/ads/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الإعلان" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.delete")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لحذف الإعلان" },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    await db.ad.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ad.deleted",
        entity: "Ad",
        entityId: id,
        severity: "warning",
        metadata: JSON.stringify({
          title: existing.title,
          advertiser: existing.advertiserName,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/ads/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الإعلان" },
      { status: 500 }
    );
  }
}
