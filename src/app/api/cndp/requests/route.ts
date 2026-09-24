import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["ACCESS", "RECTIFICATION", "ERASURE", "RESTRICTION", "PORTABILITY", "OBJECTION"];

// POST — أي زائر/مستخدم يحقّ له تقديم طلب CNDP
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const nationalId = body.nationalId ? String(body.nationalId).trim() : null;
  const requestType = String(body.requestType ?? "").toUpperCase();
  const description = String(body.description ?? "").trim();
  const targetData = body.targetData ? String(body.targetData).trim() : null;

  // تحقّق
  if (!fullName || !email) {
    return NextResponse.json({ error: "الاسم والبريد الإلكتروني مطلوبان" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(requestType)) {
    return NextResponse.json({ error: "نوع الطلب غير صالح" }, { status: 400 });
  }
  if (description.length < 20) {
    return NextResponse.json({ error: "الوصف يجب أن يكون 20 حرفاً على الأقل" }, { status: 400 });
  }

  // ربط بالمستخدم المسجّل (لو وُجد)
  const currentUser = await getCurrentUser().catch(() => null);

  // معلومات التدقّق
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent");

  // حساب أقصى أجل قانوني = الآن + 30 يوماً (المادة 31 من 09-08)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // ملاحظة: nationalId يُخزَّن مُعمّىً (لا نُخزّنه نصّاً صريحاً)
  // للتبسيط: نخزّن أول 4 + آخر 3 حروف، نُخفي الوسط
  const maskedNationalId = nationalId && nationalId.length > 7
    ? `${nationalId.slice(0, 4)}••••${nationalId.slice(-3)}`
    : nationalId ? "•••••" : null;

  const request_record = await db.cndpRequest.create({
    data: {
      fullName,
      email,
      phone,
      nationalId: maskedNationalId,
      userId: currentUser?.id ?? null,
      requestType: requestType as "ACCESS" | "RECTIFICATION" | "ERASURE" | "RESTRICTION" | "PORTABILITY" | "OBJECTION",
      description,
      targetData,
      status: "PENDING",
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  // AuditLog (حرج — قانوني)
  await db.auditLog.create({
    data: {
      actorId: currentUser?.id ?? null,
      action: "cndp.request.submitted",
      entity: "CndpRequest",
      entityId: request_record.id,
      severity: "warning",
      metadata: JSON.stringify({
        requestType,
        email,
        expiresAt: expiresAt.toISOString(),
      }),
    },
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    id: request_record.id,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}

// GET — للمستخدم المُسجّل: طلباته. للمشرف: كل الطلبات.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  if (user.role === "SUPER_ADMIN") {
    const requests = await db.cndpRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      requests,
      count: requests.length,
    });
  }

  // للمستخدم العادي: طلباته فقط
  const requests = await db.cndpRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    requests,
    count: requests.length,
  });
}
