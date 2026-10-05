// ===================================================================
//  POST /api/feed/[id]/vote
//  v61.0 Part 5: Reddit-style upvote/downvote
//  - body: { value: 1 (upvote) | -1 (downvote) | 0 (remove vote) }
//  - Atomic transaction: upsert FeedVote + update FeedItem counters + score
//  - Returns new score + user's current vote
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول للتصويت" }, { status: 401 });
    }

    const { id } = await params;
    let body: { value?: unknown };
    try {
      body = await request.json() as { value?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const value =
      typeof body.value === "number"
        ? body.value
        : parseInt(String(body.value), 10);

    if (![-1, 0, 1].includes(value)) {
      return NextResponse.json(
        { error: "القيمة يجب أن تكون 1 (upvote) أو -1 (downvote) أو 0 (إزالة)" },
        { status: 400 }
      );
    }

    // Atomic transaction
    const result = await db.$transaction(async (tx) => {
      // 1) تحقق من وجود المنشور
      const item = await tx.feedItem.findUnique({
        where: { id },
        select: { id: true, userId: true, upvotes: true, downvotes: true, score: true },
      });
      if (!item) {
        throw new Error("المنشور غير موجود");
      }

      // 2) ابحث عن تصويت سابق لنفس المستخدم
      const existingVote = await tx.feedVote.findUnique({
        where: { userId_feedItemId: { userId: user.id, feedItemId: id } },
        select: { id: true, value: true },
      });

      // 3) احسب التغيّر في العدّادات
      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (existingVote) {
        // إزالة التأثير القديم
        if (existingVote.value === 1) upvoteDelta -= 1;
        else if (existingVote.value === -1) downvoteDelta -= 1;

        if (value === 0) {
          // إزالة التصويت
          await tx.feedVote.delete({ where: { id: existingVote.id } });
        } else if (value === existingVote.value) {
          // نفس التصويت — اعتبره إزالة (toggle behavior)
          await tx.feedVote.delete({ where: { id: existingVote.id } });
        } else {
          // تغيير القيمة
          await tx.feedVote.update({
            where: { id: existingVote.id },
            data: { value },
          });
          if (value === 1) upvoteDelta += 1;
          else if (value === -1) downvoteDelta += 1;
        }
      } else if (value !== 0) {
        // إنشاء تصويت جديد
        await tx.feedVote.create({
          data: { userId: user.id, feedItemId: id, value },
        });
        if (value === 1) upvoteDelta += 1;
        else if (value === -1) downvoteDelta += 1;
      }

      // 4) حدّث عدّادات المنشور
      const newUpvotes = item.upvotes + upvoteDelta;
      const newDownvotes = item.downvotes + downvoteDelta;
      const newScore = newUpvotes - newDownvotes;

      await tx.feedItem.update({
        where: { id },
        data: {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          score: newScore,
        },
      });

      // 5) اكتب AuditLog (non-critical)
      try {
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: value === 1 ? "feed.upvote" : value === -1 ? "feed.downvote" : "feed.unvote",
            entity: "FeedItem",
            entityId: id,
            severity: "info",
            metadata: JSON.stringify({
              value,
              newScore,
              feedItemAuthorId: item.userId,
            }),
          },
        });
      } catch {
        // تجاهل
      }

      return {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newScore,
        userVote: value === 0 ? null : value,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[feed/vote] error:", error);
    const msg = error instanceof Error ? error.message : "فشل التصويت";
    const status = msg.includes("غير موجود") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET: استعلم عن تصويت المستخدم الحالي على منشور معيّن
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ userVote: null });
    }

    const { id } = await params;
    const vote = await db.feedVote.findUnique({
      where: { userId_feedItemId: { userId: user.id, feedItemId: id } },
      select: { value: true, createdAt: true, updatedAt: true },
    });

    const item = await db.feedItem.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true, score: true },
    });

    return NextResponse.json({
      userVote: vote?.value ?? null,
      upvotes: item?.upvotes ?? 0,
      downvotes: item?.downvotes ?? 0,
      score: item?.score ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
