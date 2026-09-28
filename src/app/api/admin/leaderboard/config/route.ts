import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, period, isActive, isVisible, minPoints, topN, showAvatars, showDistricts, showBadges, reward1st, reward2nd, reward3rd, customMessage } = body;

  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const updated = await db.leaderboardConfig.update({
    where: { id },
    data: {
      isActive: !!isActive,
      isVisible: !!isVisible,
      minPoints: Number(minPoints) || 0,
      topN: Number(topN) || 10,
      showAvatars: !!showAvatars,
      showDistricts: !!showDistricts,
      showBadges: !!showBadges,
      reward1st: Number(reward1st) || 0,
      reward2nd: Number(reward2nd) || 0,
      reward3rd: Number(reward3rd) || 0,
      customMessage: customMessage || null,
      updatedBy: user.id,
    },
  });

  await db.auditLog.create({
    data: {
      action: "leaderboard.config.update",
      entity: "LeaderboardConfig",
      entityId: id,
      severity: "info",
      actorId: user.id,
      metadata: JSON.stringify({ period, isActive, isVisible }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, config: updated });
}
