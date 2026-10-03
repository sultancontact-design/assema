// ===================================================================
//  POST /api/community/challenges/[id]/progress
//  v61.0: Increment user's progress on a challenge
//  - body: { increment?: number (default 1) }
//  - Auto-completes when progress reaches requiredCount
//  - Awards Karma + badge (if configured) on completion
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
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    let body: { increment?: unknown };
    try {
      body = await request.json() as { increment?: unknown };
    } catch {
      body = {};
    }
    const increment = typeof body.increment === "number" && body.increment > 0 ? body.increment : 1;

    // Find participation
    const participation = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId: id } },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            requiredCount: true,
            pointsReward: true,
            badgeId: true,
            status: true,
            endDate: true,
          },
        },
      },
    });

    if (!participation) {
      return NextResponse.json({ error: "لم تنضم لهذا التحدي بعد" }, { status: 404 });
    }
    if (participation.completed) {
      return NextResponse.json({ error: "أكملت هذا التحدي مسبقاً", alreadyCompleted: true }, { status: 400 });
    }
    if (participation.challenge.status !== "active") {
      return NextResponse.json({ error: "التحدي غير نشط" }, { status: 400 });
    }
    if (new Date() > participation.challenge.endDate) {
      return NextResponse.json({ error: "التحدي منتهي" }, { status: 400 });
    }

    const newProgress = Math.min(participation.progress + increment, participation.challenge.requiredCount);
    const isNowCompleted = newProgress >= participation.challenge.requiredCount;

    // Update progress (atomic)
    const updated = await db.userChallenge.update({
      where: { id: participation.id },
      data: {
        progress: newProgress,
        completed: isNowCompleted,
        completedAt: isNowCompleted ? new Date() : null,
      },
      select: { progress: true, completed: true },
    });

    // If just completed — award rewards (Karma + badge)
    let karmaAwarded = 0;
    let badgeAwarded: string | null = null;
    if (isNowCompleted && !participation.completed) {
      const result = await db.$transaction(async (tx) => {
        // 1) Award Karma points
        if (participation.challenge.pointsReward > 0) {
          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { points: { increment: participation.challenge.pointsReward } },
            select: { points: true },
          });

          await tx.pointsLedger.create({
            data: {
              userId: user.id,
              amount: participation.challenge.pointsReward,
              type: "EARN",
              reason: `challenge:${participation.challenge.title} completed`,
              balanceAfter: updatedUser.points,
              metadata: JSON.stringify({
                challengeId: id,
                challengeTitle: participation.challenge.title,
              }),
            },
          });

          karmaAwarded = participation.challenge.pointsReward;
        }

        // 2) Award badge if configured
        if (participation.challenge.badgeId) {
          try {
            await tx.userBadge.create({
              data: {
                userId: user.id,
                badgeId: participation.challenge.badgeId,
              },
            });
            badgeAwarded = participation.challenge.badgeId;

            // Increment badge's currentRecipients
            await tx.badge.update({
              where: { id: participation.challenge.badgeId },
              data: { currentRecipients: { increment: 1 } },
            }).catch(() => {});
          } catch {
            // Already has the badge — skip
          }
        }

        // 3) AuditLog
        try {
          await tx.auditLog.create({
            data: {
              actorId: user.id,
              action: "challenge.complete",
              entity: "Challenge",
              entityId: id,
              severity: "info",
              metadata: JSON.stringify({
                challengeTitle: participation.challenge.title,
                karmaAwarded,
                badgeAwarded,
              }),
            },
          });
        } catch {}

        return { karmaAwarded, badgeAwarded };
      });
      karmaAwarded = result.karmaAwarded;
      badgeAwarded = result.badgeAwarded;
    }

    return NextResponse.json({
      success: true,
      progress: updated.progress,
      requiredCount: participation.challenge.requiredCount,
      completed: updated.completed,
      karmaAwarded,
      badgeAwarded,
      isJustCompleted: isNowCompleted && !participation.completed,
    });
  } catch (error) {
    console.error("[challenge/progress] error:", error);
    const msg = error instanceof Error ? error.message : "فشل تحديث التقدّم";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
