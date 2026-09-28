import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST: إرسال المقال للمراجعة (status: PENDING_REVIEW)
// يعطي المستخدم 15 نقطة مكافأة على المساهمة
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, excerpt, category, content, metaDescription, metaKeywords } = body;

    if (!title || !content || content.length < 200) {
      return NextResponse.json(
        { error: "العنوان مطلوب والمحتوى 200 حرف على الأقل" },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || `post-${Date.now()}`;

    // إنشاء المقال بحالة PENDING_REVIEW
    const post = await db.blogPost.create({
      data: {
        title,
        excerpt: excerpt ?? "",
        category: category ?? "COMMUNITY",
        content,
        metaDescription: metaDescription ?? null,
        metaKeywords: metaKeywords ?? null,
        slug,
        status: "PENDING_REVIEW",
        authorId: user.id,
        publishedAt: null,
      },
    });

    // منح 15 نقطة مكافأة على المساهمة
    await db.user
      .update({
        where: { id: user.id },
        data: { points: { increment: 15 } },
      })
      .catch(() => {});

    // تسجيل النشاط
    await db.userActivity
      .create({
        data: {
          userId: user.id,
          type: "BLOG_SUBMITTED",
          description: `أرسل مقالاً للمراجعة: ${title.slice(0, 50)}`,
          isPublic: false,
        },
      })
      .catch(() => {});

    return NextResponse.json({ ok: true, postId: post.id, pointsEarned: 15 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الإرسال" },
      { status: 500 }
    );
  }
}
