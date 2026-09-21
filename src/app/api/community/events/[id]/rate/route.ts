// ===================================================================
//  API: /api/community/events/[id]/rate
//  POST — تقييم الفعالية من قبل مستخدم حضرها
//  - يتطلّب مصادقة
//  - Body: { rating: number (1-5), comment?: string, anonymous?: boolean }
//  - يتحقّق: المستخدم حضر الفعالية (registration.status === ATTENDED)
//  - لا يمكن التقييم مرّتين (409 إن سبق)
//  - يُخزّن التقييم كـ AuditLog: action=event.rated, entity=Event,
//    entityId=eventId, metadata=JSON({rating, comment, anonymous})
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RateBody {
  rating?: number;
  comment?: string | null;
  anonymous?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لتقييم الفعالية" },
        { status: 401 }
      );
    }

    // 2) Parse body
    let body: RateBody = {};
    try {
      body = (await request.json()) as RateBody;
    } catch {
      return NextResponse.json(
        { error: "جسم الطلب غير صالح (JSON متوقّع)" },
        { status: 400 }
      );
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "التقييم يجب أن يكون عدداً صحيحاً بين 1 و 5" },
        { status: 400 }
      );
    }

    const comment =
      typeof body.comment === "string" && body.comment.trim()
        ? body.comment.trim().slice(0, 500)
        : null;

    const anonymous = !!body.anonymous;

    // 3) التحقّق من وجود الفعالية وأنها مكتملة
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, deletedAt: true },
    });

    if (!event || event.deletedAt) {
      return NextResponse.json(
        { error: "الفعالية غير موجودة" },
        { status: 404 }
      );
    }

    if (event.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "لا يمكن تقييم فعالية لم تكتمل بعد" },
        { status: 400 }
      );
    }

    // 4) التحقّق من حضور المستخدم
    const registration = await db.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId: user.id,
        status: "ATTENDED",
      },
      select: { id: true, ticketCode: true },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "التقييم متاح فقط لمن حضر الفعالية" },
        { status: 403 }
      );
    }

    // 5) منع التقييم المكرّر
    const existingRating = await db.auditLog.findFirst({
      where: {
        action: "event.rated",
        entity: "Event",
        entityId: id,
        actorId: user.id,
      },
      select: { id: true },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: "سبق وأن أرسلت تقييماً لهذه الفعالية" },
        { status: 409 }
      );
    }

    // 6) تخزين التقييم كـ AuditLog
    const audit = await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.rated",
        entity: "Event",
        entityId: id,
        metadata: JSON.stringify({
          rating,
          comment,
          anonymous,
          ticketCode: registration.ticketCode,
        }),
        severity: "info",
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        success: true,
        ratingId: audit.id,
        rating,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/community/events/[id]/rate]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال التقييم" },
      { status: 500 }
    );
  }
}
