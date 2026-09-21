// ===================================================================
//  API: /api/admin/events/[id]
//  PATCH — تحديث فعالية (event.edit)
//  DELETE — حذف فعّال (soft delete) — event.delete
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";
import type { EventType, EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: EventType[] = [
  "MONTHLY",
  "SEASONAL",
  "SPECIAL",
  "SOLIDARITY",
  "CULTURAL",
];

const ALLOWED_STATUSES: EventStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "event.edit")) {
      return NextResponse.json(
        {
          error:
            "هذا الإجراء يتطلب صلاحية تعديل الفعاليات (مشرف حي أو مشرف عام)",
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string | null;
      location?: string;
      maxAttendees?: number | null;
      isRegistrationOpen?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم مطلوب" }, { status: 400 });
    }

    // 3) العثور على الفعالية
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, districtId: true, deletedAt: true },
    });
    if (!event || event.deletedAt) {
      return NextResponse.json(
        { error: "الفعالية غير موجودة" },
        { status: 404 }
      );
    }
    if (event.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية الوصول لهذه الفعالية" },
        { status: 403 }
      );
    }

    // 4) بناء بيانات التحديث (فقط الحقول المُقدَّمة)
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: "العنوان لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      data.title = title;
    }
    if (body.description !== undefined) {
      const description = body.description.trim();
      if (!description) {
        return NextResponse.json({ error: "الوصف لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      data.description = description;
    }
    if (body.type !== undefined) {
      if (!ALLOWED_TYPES.includes(body.type as EventType)) {
        return NextResponse.json({ error: "نوع فعالية غير صالح" }, { status: 400 });
      }
      data.type = body.type;
    }
    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status as EventStatus)) {
        return NextResponse.json({ error: "حالة فعالية غير صالحة" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.location !== undefined) {
      const location = body.location.trim();
      if (!location) {
        return NextResponse.json({ error: "المكان لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      data.location = location;
    }
    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "تاريخ البداية غير صالح" }, { status: 400 });
      }
      data.startDate = startDate;
    }
    if (body.endDate !== undefined) {
      if (body.endDate === null) {
        data.endDate = null;
      } else {
        const endDate = new Date(body.endDate);
        if (Number.isNaN(endDate.getTime())) {
          return NextResponse.json({ error: "تاريخ النهاية غير صالح" }, { status: 400 });
        }
        data.endDate = endDate;
      }
    }
    if (body.maxAttendees !== undefined) {
      data.maxAttendees =
        typeof body.maxAttendees === "number" && body.maxAttendees > 0
          ? Math.floor(body.maxAttendees)
          : null;
    }
    if (body.isRegistrationOpen !== undefined) {
      data.isRegistrationOpen = !!body.isRegistrationOpen;
    }

    // 5) التحقّق من ترتيب التواريخ بعد التحديث
    if (data.startDate && data.endDate) {
      if ((data.endDate as Date) < (data.startDate as Date)) {
        return NextResponse.json(
          { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" },
          { status: 400 }
        );
      }
    }

    // 6) التحديث
    const updated = await db.event.update({
      where: { id },
      data,
      select: { id: true, title: true, status: true },
    });

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.updated",
        entity: "Event",
        entityId: id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/events/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الفعالية" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "event.delete")) {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية حذف الفعاليات (مشرف حي أو مشرف عام)" },
        { status: 403 }
      );
    }

    // 2) العثور على الفعالية
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, districtId: true, deletedAt: true, title: true },
    });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });
    }
    if (event.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية حذف هذه الفعالية" },
        { status: 403 }
      );
    }

    // 3) حذف ناعم (soft delete)
    await db.event.update({
      where: { id },
      data: { deletedAt: new Date(), isRegistrationOpen: false },
    });

    // 4) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.deleted",
        entity: "Event",
        entityId: id,
        severity: "warning",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/events/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الفعالية" },
      { status: 500 }
    );
  }
}
