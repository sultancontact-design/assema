import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["HEALTH", "EDUCATION", "FINANCE", "PARENTING", "RELIGIOUS", "COMMUNITY"];
const ALLOWED_STATUSES = ["draft", "published", "archived"];

function slugify(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// POST — create new blog post
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? "").trim();
  const content = String(body.content ?? "").trim();
  const category = String(body.category ?? "").toUpperCase();
  const tags = body.tags ? String(body.tags).trim() : null;
  const coverImage = body.coverImage ? String(body.coverImage).trim() : null;
  const status = String(body.status ?? "draft").toLowerCase() as "draft" | "published" | "archived";
  const featured = Boolean(body.featured);
  const readingTime = typeof body.readingTime === "number" ? Math.max(1, Math.min(120, body.readingTime)) : null;
  const tiptapContent = body.tiptapContent ? String(body.tiptapContent) : null;

  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  if (!excerpt) return NextResponse.json({ error: "المقتطف مطلوب" }, { status: 400 });
  if (!content || content === "<p></p>") return NextResponse.json({ error: "المحتوى مطلوب" }, { status: 400 });
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "الفئة غير صالحة" }, { status: 400 });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
  }

  let slug = String(body.slug ?? "").trim();
  if (!slug) slug = slugify(title);
  if (!slug) return NextResponse.json({ error: "الـslug مطلوب" }, { status: 400 });

  // تحقق من عدم تكرار الـslug
  const existing = await db.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const post = await db.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      tiptapContent,
      coverImage,
      category,
      tags,
      status,
      featured,
      authorId: user.id,
      readingTime,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  // AuditLog
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.blog.create",
      entity: "BlogPost",
      entityId: post.id,
      severity: "warning",
      metadata: JSON.stringify({ title, slug, status, category }),
    },
  });

  return NextResponse.json({ success: true, id: post.id, slug: post.slug }, { status: 201 });
}
