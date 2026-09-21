// ===================================================================
//  API: /api/admin/groups
//  POST — إنشاء مجموعة جديدة (group.create)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["عائلي", "تنمية", "تعليم", "تراث", "عام"];

function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "group"}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "group.create")) {
      return NextResponse.json(
        {
          error: "هذا الإجراء يتطلب صلاحية إنشاء المجموعات (مشرف حي أو مشرف عام)",
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      description?: string | null;
      category?: string;
      isPrivate?: boolean;
      maxMembers?: number | null;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم مطلوب" }, { status: 400 });
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "اسم المجموعة مطلوب" }, { status: 400 });
    }
    const category =
      body.category && ALLOWED_CATEGORIES.includes(body.category)
        ? body.category
        : "عام";

    const maxMembers =
      typeof body.maxMembers === "number" && body.maxMembers > 0
        ? Math.floor(body.maxMembers)
        : null;

    // 3) slug فريد
    let slug = slugify(name);
    const existing = await db.group.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 4) الإنشاء
    const group = await db.group.create({
      data: {
        name,
        slug,
        description: body.description?.trim() || null,
        districtId: user.districtId,
        category,
        isDefault: false,
        isActive: true,
        isPrivate: body.isPrivate ?? false,
        maxMembers,
      },
      select: { id: true, name: true, slug: true },
    });

    // 5) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.created",
        entity: "Group",
        entityId: group.id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/groups]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المجموعة" },
      { status: 500 }
    );
  }
}
