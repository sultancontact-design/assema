import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — تعليقات عامة (بدون auth)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    if (!targetType || !targetId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const comments = await db.comment.findMany({
      where: { targetType, targetId, isApproved: true, parentId: null },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        replies: {
          where: { isApproved: true },
          include: { user: { select: { id: true, fullName: true, avatar: true } } },
          orderBy: { createdAt: "asc" },
          take: 10,
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    const total = await db.comment.count({ where: { targetType, targetId, isApproved: true } });

    const serialized = comments.map(c => ({
      ...c,
      user: { id: c.user.id, name: c.user.fullName, avatar: c.user.avatar },
      replies: c.replies.map(r => ({ ...r, user: { id: r.user.id, name: r.user.fullName, avatar: r.user.avatar }, createdAt: r.createdAt.toISOString() })),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ comments: serialized, total });
  } catch (error) {
    console.error("[comments GET] error:", error);
    return NextResponse.json({ comments: [], total: 0 }, { status: 500 });
  }
}

// POST — إضافة تعليق (يتطلب auth)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { targetType, targetId, content, parentId } = body;
    if (!targetType || !targetId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (content.length < 2 || content.length > 2000) return NextResponse.json({ error: "التعليق بين 2 و 2000 حرف" }, { status: 400 });

    const comment = await db.comment.create({
      data: { userId: user.id, targetType, targetId, content, parentId: parentId || null, isApproved: true },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });

    // +2 نقاط
    await db.user.update({ where: { id: user.id }, data: { points: { increment: 2 } } }).catch(() => {});

    return NextResponse.json({
      success: true,
      comment: { ...comment, user: { id: comment.user.id, name: comment.user.fullName, avatar: comment.user.avatar }, createdAt: comment.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("[comments POST] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
