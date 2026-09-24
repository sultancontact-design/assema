// ===================================================================
//  POST /api/admin/challenges/create
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["DAILY", "WEEKLY", "MONTHLY", "SEASONAL"];

interface CreateBody {
  title: string;
  description: string;
  type: string;
  pointsReward: number;
  requiredCount: number;
  startDate: string;
  endDate: string;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "صلاحية مشرف عام مطلوبة" }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "جسم غير صالح" }, { status: 400 });
  }

  const { title, description, type, pointsReward, requiredCount, startDate, endDate } = body;
  if (!title || title.trim().length < 3) {
    return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  }
  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: "الوصف مطلوب" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "النوع غير صالح" }, { status: 400 });
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "التواريخ غير صالحة" }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "تاريخ النهاية يجب أن يكون بعد البدء" }, { status: 400 });
  }

  const challenge = await db.challenge.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      type,
      status: "active",
      pointsReward: Math.max(0, pointsReward),
      requiredCount: Math.max(1, requiredCount),
      startDate: start,
      endDate: end,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "challenge.create",
      entity: "Challenge",
      entityId: challenge.id,
      severity: "info",
      metadata: JSON.stringify({ title, type, pointsReward }),
    },
  });

  return NextResponse.json({ success: true, challenge });
}
