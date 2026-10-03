// ===================================================================
//  POST /api/community/challenges/[id]/join
//  v61.0: User joins a challenge (creates UserChallenge entry)
//  - Validates challenge is active + not expired
//  - Prevents duplicate joins (unique constraint)
//  - AuditLog entry
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    const now = new Date();

    // Validate challenge exists + is active + not expired
    const challenge = await db.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        requiredCount: true,
        pointsReward: true,
        badgeId: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "التحدي غير موجود" }, { status: 404 });
    }
    if (challenge.status !== "active") {
      return NextResponse.json({ error: "التحدي غير نشط" }, { status: 400 });
    }
    if (now < challenge.startDate) {
      return NextResponse.json({ error: "التحدي لم يبدأ بعد" }, { status: 400 });
    }
    if (now > challenge.endDate) {
      return NextResponse.json({ error: "التحدي منتهي" }, { status: 400 });
    }

    // Check for existing participation (unique constraint will catch this anyway)
    const existing = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId: id } },
      select: { id: true, completed: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.completed ? "أكملت هذا التحدي مسبقاً" : "أنت مشترك في هذا التحدي مسبقاً" },
        { status: 409 }
      );
    }

    // Create participation entry
    const participation = await db.userChallenge.create({
      data: {
        userId: user.id,
        challengeId: id,
        progress: 0,
        completed: false,
      },
      select: { id: true, progress: true },
    });

    // AuditLog
    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "challenge.join",
          entity: "Challenge",
          entityId: id,
          severity: "info",
          metadata: JSON.stringify({ challengeTitle: challenge.title }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      participationId: participation.id,
      progress: 0,
      requiredCount: challenge.requiredCount,
      pointsReward: challenge.pointsReward,
      badgeId: challenge.badgeId,
    });
  } catch (error) {
    console.error("[challenge/join] error:", error);
    const msg = error instanceof Error ? error.message : "فشل الانضمام";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
