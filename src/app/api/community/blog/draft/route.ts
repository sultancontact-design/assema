import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST: حفظ مسودة المقال في DB (status: DRAFT)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, excerpt, category, content, metaDescription, metaKeywords } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "العنوان والمحتوى مطلوبان" }, { status: 400 });
    }

    // نبحث عن مسودة موجودة لهذا المستخدم (للتحديث بدل الإنشاء)
    const existing = await db.blogPost.findFirst({
      where: { authorId: user.id, status: "DRAFT" },
      select: { id: true },
    });

    const slug = title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    if (existing) {
      const updated = await db.blogPost.update({
        where: { id: existing.id },
        data: {
          title,
          excerpt: excerpt ?? "",
          category: category ?? "COMMUNITY",
          content,
          metaDescription: metaDescription ?? null,
          metaKeywords: metaKeywords ?? null,
          slug: slug || existing.id,
        },
      });
      return NextResponse.json({ ok: true, draftId: updated.id });
    }

    const draft = await db.blogPost.create({
      data: {
        title,
        excerpt: excerpt ?? "",
        category: category ?? "COMMUNITY",
        content,
        metaDescription: metaDescription ?? null,
        metaKeywords: metaKeywords ?? null,
        slug: slug || `draft-${Date.now()}`,
        status: "DRAFT",
        authorId: user.id,
        publishedAt: null,
      },
    });
    return NextResponse.json({ ok: true, draftId: draft.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الحفظ" },
      { status: 500 }
    );
  }
}
