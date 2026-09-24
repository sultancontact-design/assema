import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["SOCIAL", "EDUCATIONAL", "CHARITY", "CULTURAL"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const proposedDateStr = String(body.proposedDate ?? "").trim();
  const location = body.location ? String(body.location).trim() : null;
  const category = body.category ? String(body.category).toUpperCase() : "SOCIAL";
  const expectedAttendees = typeof body.expectedAttendees === "number" && body.expectedAttendees > 0 ? body.expectedAttendees : null;
  const budget = typeof body.budget === "number" && body.budget >= 0 ? body.budget : null;

  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  if (description.length < 20) return NextResponse.json({ error: "الوصف قصير جداً" }, { status: 400 });
  if (!proposedDateStr) return NextResponse.json({ error: "التاريخ مطلوب" }, { status: 400 });
  const proposedDate = new Date(proposedDateStr);
  if (isNaN(proposedDate.getTime()) || proposedDate < new Date()) {
    return NextResponse.json({ error: "التاريخ غير صالح أو في الماضي" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "الفئة غير صالحة" }, { status: 400 });
  }

  const record = await db.eventProposal.create({
    data: {
      userId: user.id,
      title,
      description,
      proposedDate,
      location,
      districtId: user.districtId,
      expectedAttendees,
      category,
      budget,
      status: "PENDING",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "contribution.eventProposal.submitted",
      entity: "EventProposal",
      entityId: record.id,
      severity: "info",
      metadata: JSON.stringify({ title, proposedDate: proposedDate.toISOString() }),
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
