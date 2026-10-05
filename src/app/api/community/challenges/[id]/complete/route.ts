// ===================================================================
//  GET /api/community/challenges/[id]/complete
//  v61.0: Check user's completion status for a challenge
//  - Returns: participation info + progress + reward info
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;

    const participation = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId: id } },
      select: {
        id: true,
        progress: true,
        completed: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const challenge = await db.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        requiredCount: true,
        pointsReward: true,
        badgeId: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "التحدي غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
      },
      participation: participation
        ? {
            ...participation,
            completedAt: participation.completedAt?.toISOString() ?? null,
            createdAt: participation.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[challenge/complete] error:", error);
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
