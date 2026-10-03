// ===================================================================
//  DELETE /api/users/[id]/skills/[skillId]
//  v61.0 Part 5: Remove a skill from user's profile (self only)
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id, skillId } = await params;
    // Only the user can remove their own skills
    if (id !== user.id) {
      return NextResponse.json({ error: "يمكنك حذف مهاراتك فقط" }, { status: 403 });
    }

    const skill = await db.skill.findUnique({
      where: { id: skillId },
      select: { id: true, userId: true, name: true },
    });
    if (!skill || skill.userId !== id) {
      return NextResponse.json({ error: "المهارة غير موجودة" }, { status: 404 });
    }

    await db.skill.delete({ where: { id: skillId } });

    // AuditLog
    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "skill.remove",
          entity: "Skill",
          entityId: skillId,
          severity: "info",
          metadata: JSON.stringify({ name: skill.name }),
        },
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[skills/DELETE] error:", error);
    return NextResponse.json({ error: "فشل حذف المهارة" }, { status: 500 });
  }
}
