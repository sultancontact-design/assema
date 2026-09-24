import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["price-report", "service-review", "event-proposal", "story"];
const STATUS_BY_TYPE: Record<string, string[]> = {
  "price-report": ["PENDING", "APPROVED", "REJECTED"],
  "service-review": ["PENDING", "APPROVED", "REJECTED", "FLAGGED"],
  "event-proposal": ["PENDING", "APPROVED", "REJECTED", "CONVERTED"],
  "story": ["PENDING", "APPROVED", "REJECTED", "PUBLISHED"],
};

// PATCH /api/admin/contributions/[type]/[id]
// يعالج مساهمة (يُغيّر الحالة + ملاحظة + وقت المراجعة)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const { type: typeParam, id } = await params;
  if (!VALID_TYPES.includes(typeParam)) {
    return NextResponse.json({ error: "نوع مساهمة غير صالح" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const newStatus = String(body.status ?? "").toUpperCase();
  const allowedStatuses = STATUS_BY_TYPE[typeParam];
  if (!allowedStatuses.includes(newStatus)) {
    return NextResponse.json(
      { error: `الحالة غير مسموحة لهذا النوع: ${allowedStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() || null : null;
  const reviewedAt = new Date();

  // 根据 type احفظ التحديث في الجدول المناسب
  let updated: Record<string, unknown> | null = null;
  let action = "";

  if (typeParam === "price-report") {
    const record = await db.priceReport.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    updated = await db.priceReport.update({
      where: { id },
      data: { status: newStatus, adminNote, reviewedAt, reviewedBy: user.id },
    });
    action = "admin.contribution.priceReport.reviewed";
    // لو قُبل: ادفع السعر إلى جدول MarketPrice ليُعرض في القائمة
    if (newStatus === "APPROVED") {
      await db.marketPrice.create({
        data: {
          productName: record.productName,
          productNameAr: record.productNameAr,
          category: record.category,
          price: record.price,
          unit: record.unit,
          market: record.marketName ?? undefined,
          source: "user",
          reportedBy: record.userId,
          districtId: record.districtId,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      }).catch(() => null);
    }
  } else if (typeParam === "service-review") {
    const record = await db.serviceReviewSubmission.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    updated = await db.serviceReviewSubmission.update({
      where: { id },
      data: { status: newStatus, adminNote, reviewedAt, reviewedBy: user.id },
    });
    action = "admin.contribution.serviceReview.reviewed";
    // لو قُبل: أضف تقييم للخدمة في جدول ServiceReview
    if (newStatus === "APPROVED") {
      await db.serviceReview.create({
        data: {
          serviceId: record.serviceId,
          userId: record.userId,
          rating: record.rating,
          comment: record.body,
        },
      }).catch(() => null);
      // تحديث متوسط تقييم الخدمة
      const allReviews = await db.serviceReview.findMany({
        where: { serviceId: record.serviceId },
        select: { rating: true },
      });
      if (allReviews.length > 0) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await db.service.update({
          where: { id: record.serviceId },
          data: { rating: avg, reviews: allReviews.length },
        }).catch(() => null);
      }
    }
  } else if (typeParam === "event-proposal") {
    const record = await db.eventProposal.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    updated = await db.eventProposal.update({
      where: { id },
      data: { status: newStatus, adminNote, reviewedAt, reviewedBy: user.id },
    });
    action = "admin.contribution.eventProposal.reviewed";
    // لو حُوّل لحدث: أنشئ Event
    if (newStatus === "CONVERTED") {
      const event = await db.event.create({
        data: {
          title: record.title,
          description: record.description,
          date: record.proposedDate,
          location: record.location ?? "يُحدّد لاحقاً",
          districtId: record.districtId ?? undefined,
          organizerId: record.userId,
          maxAttendees: record.expectedAttendees ?? 50,
          status: "UPCOMING",
        },
      }).catch(() => null);
      if (event) {
        await db.eventProposal.update({
          where: { id },
          data: { convertedEventId: event.id },
        }).catch(() => null);
      }
    }
  } else if (typeParam === "story") {
    const record = await db.storySubmission.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    updated = await db.storySubmission.update({
      where: { id },
      data: { status: newStatus, adminNote, reviewedAt, reviewedBy: user.id, publishedAt: newStatus === "PUBLISHED" ? new Date() : null },
    });
    action = "admin.contribution.story.reviewed";
    // لو نُشرت كمقال: أنشئ BlogPost
    if (newStatus === "PUBLISHED") {
      const slugBase = record.title
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      let slug = slugBase;
      const existing = await db.blogPost.findUnique({ where: { slug } });
      if (existing) slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
      const post = await db.blogPost.create({
        data: {
          title: record.title,
          slug,
          excerpt: record.body.slice(0, 200) + (record.body.length > 200 ? "..." : ""),
          content: `<p>${record.body.replace(/\n/g, "</p><p>")}</p>`,
          category: "COMMUNITY",
          status: "published",
          authorId: record.userId,
          publishedAt: new Date(),
        },
      }).catch(() => null);
      if (post) {
        await db.storySubmission.update({
          where: { id },
          data: { blogPostId: post.id },
        }).catch(() => null);
      }
    }
  }

  // AuditLog
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action,
      entity: typeParam,
      entityId: id,
      severity: "warning",
      metadata: JSON.stringify({ newStatus, adminNote }),
    },
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    item: updated,
  });
}
