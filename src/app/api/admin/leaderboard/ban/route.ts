import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { userId, reason, expiresAt } = body as { userId?: string; reason?: string; expiresAt?: string };

  if (!userId || !reason) {
    return NextResponse.json({ error: "userId و reason مطلوبان" }, { status: 400 });
  }

  // upsert (لتفادي الـ unique constraint على userId)
  const ban = await db.leaderboardBan.upsert({
    where: { userId },
    create: {
      userId,
      reason,
      bannedBy: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    update: {
      reason,
      bannedBy: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { user: { select: { fullName: true } } },
  });

  await db.auditLog.create({
    data: {
      action: "leaderboard.ban.create",
      entity: "User",
      entityId: userId,
      severity: "warning",
      actorId: user.id,
      metadata: JSON.stringify({ reason }),
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    ban: {
      ...ban,
      createdAt: ban.createdAt.toISOString(),
      expiresAt: ban.expiresAt?.toISOString() ?? null,
      user: { fullName: ban.user.fullName },
    },
  });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  await db.leaderboardBan.delete({ where: { id } }).catch(() => {});

  await db.auditLog.create({
    data: {
      action: "leaderboard.ban.remove",
      entity: "LeaderboardBan",
      entityId: id,
      severity: "info",
      actorId: user.id,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
