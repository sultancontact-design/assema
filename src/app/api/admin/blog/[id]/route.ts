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

// PATCH — update existing blog post
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.excerpt === "string" && body.excerpt.trim()) data.excerpt = body.excerpt.trim();
  if (typeof body.content === "string" && body.content.trim()) data.content = body.content;
  if (typeof body.tiptapContent === "string") data.tiptapContent = body.tiptapContent;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage ? String(body.coverImage) : null;
  if (typeof body.category === "string") {
    const cat = body.category.toUpperCase();
    if (!ALLOWED_CATEGORIES.includes(cat)) {
      return NextResponse.json({ error: "الفئة غير صالحة" }, { status: 400 });
    }
    data.category = cat;
  }
  if (body.tags !== undefined) data.tags = body.tags ? String(body.tags).trim() : null;
  if (typeof body.status === "string") {
    const status = body.status.toLowerCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
    }
    data.status = status;
    // إذا تغيّرت الحالة من غير منشور إلى منشور، حدّث publishedAt
    if (status === "published" && existing.status !== "published") {
      data.publishedAt = new Date();
    }
  }
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.readingTime === "number") data.readingTime = Math.max(1, Math.min(120, body.readingTime));

  if (typeof body.slug === "string" && body.slug.trim()) {
    let slug = slugify(body.slug);
    if (!slug) slug = slugify(existing.title);
    // تحقق من التفرّد (لو تغيّر)
    if (slug !== existing.slug) {
      const other = await db.blogPost.findUnique({ where: { slug } });
      if (other && other.id !== id) {
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      }
      data.slug = slug;
    }
  }

  const updated = await db.blogPost.update({ where: { id }, data });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.blog.update",
      entity: "BlogPost",
      entityId: id,
      severity: "info",
      metadata: JSON.stringify({ updatedFields: Object.keys(data) }),
    },
  });

  return NextResponse.json({ success: true, id: updated.id, slug: updated.slug });
}

// DELETE — soft delete (set status=archived)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  await db.blogPost.update({
    where: { id },
    data: { status: "archived" },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.blog.archive",
      entity: "BlogPost",
      entityId: id,
      severity: "warning",
      metadata: JSON.stringify({ title: existing.title }),
    },
  });

  return NextResponse.json({ success: true });
}
