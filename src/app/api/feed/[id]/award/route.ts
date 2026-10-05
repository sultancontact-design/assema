// ===================================================================
//  POST /api/feed/[id]/award
//  v61.0 Part 5: Reddit-style Post Awards
//  - body: { awardType: 'GOLD' | 'SILVER' | 'BRONZE' | 'HELPFUL' | 'FUNNY' | 'WHOLESOME' | 'INSPIRING', note?: string }
//  - Atomic transaction:
//    1. Check user has enough Karma (points)
//    2. Decrement giver's points (karmaCost)
//    3. Increment post author's points (karmaReward)
//    4. Create PostAward entry
//    5. Create 2 PointsLedger entries (giver spend, author earn)
//    6. AuditLog entry
//  - Returns: { success, awardType, karmaCost, giverBalance, authorBalance }
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 7 award types (Reddit-inspired)
const AWARD_TYPES: Record<string, { cost: number; reward: number; emoji: string; label: string; color: string }> = {
  GOLD: { cost: 100, reward: 25, emoji: "🥇", label: "ذهبية", color: "#F5B220" },
  SILVER: { cost: 50, reward: 12, emoji: "🥈", label: "فضية", color: "#9CA3AF" },
  BRONZE: { cost: 25, reward: 6, emoji: "🥉", label: "برونزية", color: "#92400E" },
  HELPFUL: { cost: 10, reward: 3, emoji: "❤️", label: "مفيدة", color: "#DC2626" },
  FUNNY: { cost: 10, reward: 3, emoji: "😂", label: "مضحكة", color: "#F59E0B" },
  WHOLESOME: { cost: 15, reward: 4, emoji: "🌟", label: "نبيلة", color: "#10B981" },
  INSPIRING: { cost: 20, reward: 5, emoji: "🚀", label: "ملهمة", color: "#8B5CF6" },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const giver = await getCurrentUser();
    if (!giver) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    let body: { awardType?: unknown; note?: unknown };
    try {
      body = await request.json() as { awardType?: unknown; note?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const awardType = typeof body.awardType === "string" ? body.awardType.toUpperCase() : "";
    if (!AWARD_TYPES[awardType]) {
      return NextResponse.json(
        { error: `نوع الجائزة غير صالح: ${awardType}. الأنواع المتاحة: ${Object.keys(AWARD_TYPES).join(", ")}` },
        { status: 400 }
      );
    }
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 200) : null;
    const { cost, reward, emoji, label } = AWARD_TYPES[awardType];

    const result = await db.$transaction(async (tx) => {
      // 1) تحقق من وجود المنشور + صاحبه
      const item = await tx.feedItem.findUnique({
        where: { id },
        select: { id: true, userId: true, content: true },
      });
      if (!item) throw new Error("المنشور غير موجود");

      // لا يمكن إعطاء جائزة لنفسك
      if (item.userId === giver.id) {
        throw new Error("لا يمكنك إعطاء جائزة لمنشورك");
      }

      // 2) اتحقق من عدم وجود جائزة سابقة من نفس النوع
      const existing = await tx.postAward.findUnique({
        where: {
          userId_feedItemId_awardType: {
            userId: giver.id,
            feedItemId: id,
            awardType,
          },
        },
        select: { id: true },
      });
      if (existing) {
        throw new Error(`لقد أعطيت جائزة ${label} لهذا المنشور مسبقاً`);
      }

      // 3) اجلب رصيد المانح + تأكد من وجود ما يكفي
      const giverUser = await tx.user.findUnique({
        where: { id: giver.id },
        select: { id: true, points: true, fullName: true },
      });
      if (!giverUser) throw new Error("المستخدم غير موجود");
      if (giverUser.points < cost) {
        throw new Error(`رصيدك ${giverUser.points} Karma — تحتاج ${cost} لإعطاء جائزة ${label}`);
      }

      // 4) اجلب صاحب المنشور
      const authorUser = await tx.user.findUnique({
        where: { id: item.userId },
        select: { id: true, points: true, fullName: true },
      });
      if (!authorUser) throw new Error("صاحب المنشور غير موجود");

      // 5) خصم من المانح
      const updatedGiver = await tx.user.update({
        where: { id: giver.id },
        data: { points: { decrement: cost } },
        select: { points: true },
      });

      // 6) أضف إلى صاحب المنشور (25% من التكلفة كـ reward)
      const updatedAuthor = await tx.user.update({
        where: { id: item.userId },
        data: { points: { increment: reward } },
        select: { points: true },
      });

      // 7) أنشئ سجلّ الجائزة
      const award = await tx.postAward.create({
        data: {
          userId: giver.id,
          feedItemId: id,
          awardType,
          karmaCost: cost,
          karmaReward: reward,
          note,
        },
        select: { id: true },
      });

      // 8) PointsLedger للمانح (SPEND)
      await tx.pointsLedger.create({
        data: {
          userId: giver.id,
          amount: -cost,
          type: "SPEND",
          reason: `award:${awardType} ${emoji} على منشور ${authorUser.fullName}`,
          balanceAfter: updatedGiver.points,
          metadata: JSON.stringify({
            awardId: award.id,
            feedItemId: id,
            awardType,
            authorId: item.userId,
          }),
        },
      });

      // 9) PointsLedger لصاحب المنشور (EARN)
      await tx.pointsLedger.create({
        data: {
          userId: item.userId,
          amount: reward,
          type: "EARN",
          reason: `received award:${awardType} ${emoji} من ${giverUser.fullName}`,
          balanceAfter: updatedAuthor.points,
          metadata: JSON.stringify({
            awardId: award.id,
            feedItemId: id,
            awardType,
            giverId: giver.id,
          }),
        },
      });

      // 10) AuditLog
      try {
        await tx.auditLog.create({
          data: {
            actorId: giver.id,
            action: "feed.award",
            entity: "FeedItem",
            entityId: id,
            severity: "info",
            metadata: JSON.stringify({
              awardType,
              cost,
              reward,
              awardId: award.id,
              giverBalance: updatedGiver.points,
              authorBalance: updatedAuthor.points,
              authorId: item.userId,
              note,
            }),
          },
        });
      } catch {
        // تجاهل
      }

      return {
        awardId: award.id,
        awardType,
        emoji,
        label,
        karmaCost: cost,
        karmaReward: reward,
        giverBalance: updatedGiver.points,
        authorBalance: updatedAuthor.points,
        authorName: authorUser.fullName,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[feed/award] error:", error);
    const msg = error instanceof Error ? error.message : "فشل إعطاء الجائزة";
    const status = msg.includes("غير موجود") || msg.includes("لا يمكنك") || msg.includes("مسبقاً") || msg.includes("رصيدك")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET: استعلم عن الجوائز المُعطاة لمنشور معيّن
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const awards = await db.postAward.findMany({
      where: { feedItemId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        awardType: true,
        karmaCost: true,
        karmaReward: true,
        note: true,
        createdAt: true,
        user: { select: { id: true, fullName: true } },
      },
    });
    return NextResponse.json({ awards });
  } catch {
    return NextResponse.json({ awards: [] });
  }
}
