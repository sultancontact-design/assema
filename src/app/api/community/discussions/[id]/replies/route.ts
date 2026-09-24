// ===================================================================
//  API: /api/community/discussions/[id]/replies
//  POST — إضافة ردّ على نقاش
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للردّ على النقاش" },
        { status: 401 }
      );
    }

    const { id: discussionId } = await params;
    if (!discussionId) {
      return NextResponse.json(
        { error: "معرّف النقاش مطلوب" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const parentId =
      typeof body.parentId === "string" && body.parentId
        ? body.parentId
        : null;

    if (!content) {
      return NextResponse.json(
        { error: "محتوى الردّ مطلوب" },
        { status: 400 }
      );
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { error: "الردّ طويل جداً (الحد 2000 حرف)" },
        { status: 400 }
      );
    }

    // التحقّق من وجود النقاش
    const discussion = await db.discussion.findUnique({
      where: { id: discussionId },
      select: { id: true, title: true, authorId: true },
    });
    if (!discussion) {
      return NextResponse.json(
        { error: "النقاش غير موجود" },
        { status: 404 }
      );
    }

    // التحقّق من parentId (للردود المتداخلة)
    if (parentId) {
      const parent = await db.discussionReply.findUnique({
        where: { id: parentId },
        select: { id: true, discussionId: true },
      });
      if (!parent || parent.discussionId !== discussionId) {
        return NextResponse.json(
          { error: "الردّ الأصل غير صالح" },
          { status: 400 }
        );
      }
    }

    const reply = await db.discussionReply.create({
      data: {
        discussionId,
        authorId: user.id,
        content,
        parentId,
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        likes: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            profession: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        reply: {
          ...reply,
          createdAt:
            reply.createdAt instanceof Date
              ? reply.createdAt.toISOString()
              : reply.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/community/discussions/[id]/replies]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة الردّ" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  PATCH — زيادة الإعجاب لردّ
// ===================================================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { id: discussionId } = await params;
    const body = await req.json().catch(() => ({}));
    const replyId =
      typeof body.replyId === "string" ? body.replyId : "";

    if (!replyId) {
      return NextResponse.json(
        { error: "معرّف الردّ مطلوب" },
        { status: 400 }
      );
    }

    const reply = await db.discussionReply.findUnique({
      where: { id: replyId },
      select: { id: true, discussionId: true, likes: true },
    });
    if (!reply || reply.discussionId !== discussionId) {
      return NextResponse.json(
        { error: "الردّ غير موجود" },
        { status: 404 }
      );
    }

    const updated = await db.discussionReply.update({
      where: { id: replyId },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return NextResponse.json({
      success: true,
      reply: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/community/discussions/[id]/replies]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإعجاب بالردّ" },
      { status: 500 }
    );
  }
}
