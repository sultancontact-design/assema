import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "PARTIALLY", "REJECTED", "EXPIRED"];

// GET /api/cndp/requests/[id] — تفاصيل طلب
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const { id } = await params;
  const record = await db.cndpRequest.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  // صاحب الطلب يرى طلبه فقط؛ المشرف يرى الكل
  if (user.role !== "SUPER_ADMIN" && record.userId !== user.id) {
    return NextResponse.json({ error: "غير مصرّح بمشاهدة هذا الطلب" }, { status: 403 });
  }

  return NextResponse.json({ request: record });
}

// PATCH /api/cndp/requests/[id] — يستعمله المشرف لتحديث الحالة والردّ
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  }

  const { id } = await params;
  const record = await db.cndpRequest.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.adminResponse === "string") {
    data.adminResponse = body.adminResponse.trim() || null;
  }
  if (typeof body.assignedTo === "string") {
    data.assignedTo = body.assignedTo || null;
  }
  // لو وصل لحالة نهائية: سجّل وقت المعالجة
  const finalStates = ["APPROVED", "PARTIALLY", "REJECTED", "EXPIRED"];
  if (
    typeof data.status === "string" &&
    finalStates.includes(data.status) &&
    !record.processedAt
  ) {
    data.processedAt = new Date();
  }

  const updated = await db.cndpRequest.update({ where: { id }, data });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "cndp.request.processed",
      entity: "CndpRequest",
      entityId: id,
      severity: "critical",
      metadata: JSON.stringify({
        previousStatus: record.status,
        newStatus: data.status ?? record.status,
        processedAt: data.processedAt,
      }),
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, request: updated });
}
