import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { targetType, targetId, field, amount, reason } = body;
    if (!targetType || !targetId || !field || typeof amount !== "number")
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // USER fields
    if (targetType === "USER") {
      if (field === "points") {
        await db.user.update({ where: { id: targetId }, data: { points: { increment: amount } } });
      }
    }

    // VIDEO fields
    if (targetType === "VIDEO") {
      const fieldMap: Record<string, string> = { likes: "likes", bookmarks: "bookmarks", shares: "shares", comments: "comments", views: "views" };
      const dbField = fieldMap[field];
      if (dbField) {
        await db.video.update({ where: { id: targetId }, data: { [dbField]: { increment: amount } } });
      }
    }

    // POST/BlogPost fields
    if (targetType === "POST") {
      const fieldMap: Record<string, string> = { likes: "likes", views: "views" };
      const dbField = fieldMap[field];
      if (dbField) {
        await db.blogPost.update({ where: { id: targetId }, data: { [dbField]: { increment: amount } } });
      }
    }

    // Log adjustment
    await db.statsAdjustment.create({ data: { adminId: admin.id, targetType, targetId, field, amount, reason: reason || null } }).catch(() => {});
    await db.auditLog.create({ data: { actorId: admin.id, action: "stats.boost", entity: `${targetType}:${targetId}`, severity: "critical", metadata: JSON.stringify({ field, amount, reason }) } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stats-boost] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
