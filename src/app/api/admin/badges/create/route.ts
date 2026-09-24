// ===================================================================
//  POST /api/admin/badges/create
//  إنشاء شارة جديدة
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_RARITIES = ["common", "rare", "epic", "legendary"];

interface CreateBody {
  name: string;
  slug: string;
  description: string;
  icon: string;
  rarity: string;
  isLimited?: boolean;
  maxRecipients?: number | null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مشرف عام" }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { name, slug, description, icon, rarity, isLimited, maxRecipients } = body;
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  }
  if (!slug || slug.trim().length < 2) {
    return NextResponse.json({ error: "الرمز مطلوب" }, { status: 400 });
  }
  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: "الوصف مطلوب" }, { status: 400 });
  }
  if (!VALID_RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "الندرة غير صالحة" }, { status: 400 });
  }

  // تحقّق من التكرار
  const existing = await db.badge.findUnique({ where: { slug: slug.trim() } });
  if (existing) {
    return NextResponse.json({ error: "الرمز مستعمل بالفعل" }, { status: 400 });
  }
  const existingByName = await db.badge.findUnique({ where: { name: name.trim() } });
  if (existingByName) {
    return NextResponse.json({ error: "الاسم مستعمل بالفعل" }, { status: 400 });
  }

  const badge = await db.badge.create({
    data: {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      icon: icon || "🏆",
      rarity,
      isLimited: isLimited ?? false,
      maxRecipients: isLimited ? Math.max(1, maxRecipients ?? 10) : null,
      currentRecipients: 0,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "badge.create",
      entity: "Badge",
      entityId: badge.id,
      severity: "info",
      metadata: JSON.stringify({ name, slug, rarity }),
    },
  });

  return NextResponse.json({ success: true, badge });
}
