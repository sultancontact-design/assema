import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }

  const serviceId = String(body.serviceId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  const ratingRaw = typeof body.rating === "number" ? body.rating : parseInt(String(body.rating), 10);

  if (!serviceId) return NextResponse.json({ error: "اختر خدمة" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  if (bodyText.length < 10) return NextResponse.json({ error: "النص قصير جداً (10 أحرف على الأقل)" }, { status: 400 });
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return NextResponse.json({ error: "التقييم 1-5" }, { status: 400 });
  }

  // تحقق وجود الخدمة
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "الخدمة غير موجودة" }, { status: 404 });

  const record = await db.serviceReviewSubmission.create({
    data: {
      userId: user.id,
      serviceId,
      rating: ratingRaw,
      title,
      body: bodyText,
      status: "PENDING",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "contribution.serviceReview.submitted",
      entity: "ServiceReviewSubmission",
      entityId: record.id,
      severity: "info",
      metadata: JSON.stringify({ serviceId, rating: ratingRaw }),
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
