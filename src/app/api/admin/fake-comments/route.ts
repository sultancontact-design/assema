import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const templates = await db.fakeCommentTemplate.findMany({
      where: { isActive: true },
      orderBy: { usageCount: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[fake-comments GET] error:", error);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { targetType, targetId, count } = body;
    if (!targetType || !targetId || !count)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // اجلب مستخدمين عشوائيين
    const users = await db.user.findMany({ select: { id: true }, take: 30 });

    const templates = await db.fakeCommentTemplate.findMany({
      where: { isActive: true },
      orderBy: { usageCount: "asc" },
      take: count,
    });

    let created = 0;
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (!randomUser || !templates[i]) continue;

      await db.comment.create({
        data: {
          userId: randomUser.id,
          targetType,
          targetId,
          content: templates[i].content,
          isApproved: true,
          isFake: true,
          likes: Math.floor(Math.random() * 20),
        },
      });

      await db.fakeCommentTemplate.update({
        where: { id: templates[i].id },
        data: { usageCount: { increment: 1 } },
      }).catch(() => {});

      created++;
    }

    await db.adminCommentBoost.create({
      data: { adminId: admin.id, targetType, targetId, count: created },
    }).catch(() => {});

    await db.auditLog.create({
      data: { actorId: admin.id, action: "comments.bulk_add", entity: `${targetType}:${targetId}`, severity: "critical", metadata: JSON.stringify({ count: created }) },
    }).catch(() => {});

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("[fake-comments POST] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
