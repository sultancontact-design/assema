// ===================================================================
//  POST/GET/DELETE /api/users/[id]/skills
//  v61.0 Part 5: LinkedIn-style Skills
//  - POST: add a skill to user's profile (self only)
//  - GET: list user's skills with endorsement counts
//  - DELETE: remove a skill (self only, via ?skillId= query)
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list user's skills + endorsement counts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skills = await db.skill.findMany({
      where: { userId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { endorsements: true } },
      },
    });

    return NextResponse.json({
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        endorsements: s._count.endorsements,
      })),
    });
  } catch {
    return NextResponse.json({ skills: [] });
  }
}

// POST: add a skill (self only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    // Only the user can add skills to their own profile
    if (id !== user.id) {
      return NextResponse.json({ error: "يمكنك إضافة المهارات لملفك فقط" }, { status: 403 });
    }

    let body: { name?: unknown };
    try {
      body = await request.json() as { name?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim().toLowerCase().slice(0, 50)
        : "";

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "اسم المهارة قصير جداً" }, { status: 400 });
    }

    // Check for duplicate (case-insensitive due to lowercase)
    const existing = await db.skill.findUnique({
      where: { userId_name: { userId: id, name } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "لديك مهارة بنفس الاسم مسبقاً" }, { status: 409 });
    }

    // Limit to 30 skills per user
    const count = await db.skill.count({ where: { userId: id } });
    if (count >= 30) {
      return NextResponse.json({ error: "الحد الأقصى 30 مهارة لكل مستخدم" }, { status: 400 });
    }

    const skill = await db.skill.create({
      data: { userId: id, name },
      select: { id: true, name: true },
    });

    // AuditLog
    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "skill.add",
          entity: "Skill",
          entityId: skill.id,
          severity: "info",
          metadata: JSON.stringify({ name }),
        },
      });
    } catch {}

    return NextResponse.json({ success: true, skill }, { status: 201 });
  } catch (error) {
    console.error("[skills/POST] error:", error);
    return NextResponse.json({ error: "فشل إضافة المهارة" }, { status: 500 });
  }
}
