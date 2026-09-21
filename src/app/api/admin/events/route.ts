// ===================================================================
//  API: /api/admin/events
//  POST — إنشاء فعالية جديدة (SUPER_ADMIN أو DISTRICT_MOD أو GROUP_LEADER)
//  الجسم: { title, description, type, startDate, endDate?, location, maxAttendees?, isRegistrationOpen? }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";
import type { EventType } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: EventType[] = [
  "MONTHLY",
  "SEASONAL",
  "SPECIAL",
  "SOLIDARITY",
  "CULTURAL",
];

/** توليد slug فريد من العنوان + رقم عشوائي */
function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "event"}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }
    if (!hasPermission(user.role, "event.create")) {
      return NextResponse.json(
        {
          error: "هذا الإجراء يتطلب أحد الأدوار: مشرف حي، أو رئيس مجموعة، أو مشرف عام",
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      description?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      maxAttendees?: number | null;
      isRegistrationOpen?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم مطلوب" }, { status: 400 });
    }

    // 3) التحقق
    const title = body.title?.trim();
    const description = body.description?.trim();
    const location = body.location?.trim();

    if (!title) {
      return NextResponse.json(
        { error: "العنوان مطلوب" },
        { status: 400 }
      );
    }
    if (!description) {
      return NextResponse.json(
        { error: "الوصف مطلوب" },
        { status: 400 }
      );
    }
    if (!location) {
      return NextResponse.json(
        { error: "المكان مطلوب" },
        { status: 400 }
      );
    }
    if (!body.startDate) {
      return NextResponse.json(
        { error: "تاريخ البداية مطلوب" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "تاريخ البداية غير صالح" },
        { status: 400 }
      );
    }

    let endDate: Date | null = null;
    if (body.endDate) {
      endDate = new Date(body.endDate);
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "تاريخ النهاية غير صالح" },
          { status: 400 }
        );
      }
      if (endDate < startDate) {
        return NextResponse.json(
          { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" },
          { status: 400 }
        );
      }
    }

    const type = ALLOWED_TYPES.includes(body.type as EventType)
      ? (body.type as EventType)
      : "MONTHLY";

    const maxAttendees =
      typeof body.maxAttendees === "number" && body.maxAttendees > 0
        ? Math.floor(body.maxAttendees)
        : null;

    // 4) توليد slug فريد
    let slug = slugify(title);
    const existing = await db.event.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 5) الإنشاء
    const event = await db.event.create({
      data: {
        title,
        slug,
        description,
        type,
        status: "PUBLISHED",
        startDate,
        endDate,
        location,
        maxAttendees,
        isRegistrationOpen: body.isRegistrationOpen ?? true,
        requiresApproval: false,
        districtId: user.districtId,
        organizerId: user.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    // 6) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.created",
        entity: "Event",
        entityId: event.id,
        severity: "info",
      },
    });

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/events]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الفعالية" },
      { status: 500 }
    );
  }
}

// GET — قائمة الفعاليات (للاستخدام المستقبلي)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }
  const events = await db.event.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startDate: true,
      location: true,
    },
    orderBy: { startDate: "desc" },
    take: 100,
  });
  return NextResponse.json({ events });
}
