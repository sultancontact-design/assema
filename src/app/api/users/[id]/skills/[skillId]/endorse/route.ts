// ===================================================================
//  POST /api/users/[id]/skills/[skillId]/endorse
//  v61.0 Part 5: LinkedIn-style Skill Endorsements
//  - Endorse a skill (one endorsement per user per skill)
//  - Cannot endorse own skills
//  - Toggle behavior: endorsing again removes the endorsement
//  - AuditLog entry
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول للمصادقة" }, { status: 401 });
    }

    const { id, skillId } = await params;

    // Cannot endorse own skills
    if (id === user.id) {
      return NextResponse.json({ error: "لا يمكنك المصادقة على مهاراتك" }, { status: 400 });
    }

    // Find skill + verify it belongs to the target user
    const skill = await db.skill.findUnique({
      where: { id: skillId },
      select: { id: true, userId: true, name: true },
    });
    if (!skill) {
      return NextResponse.json({ error: "المهارة غير موجودة" }, { status: 404 });
    }
    if (skill.userId !== id) {
      return NextResponse.json({ error: "المهارة لا تنتمي لهذا المستخدم" }, { status: 400 });
    }

    // Check for existing endorsement (toggle behavior)
    const existing = await db.skillEndorsement.findUnique({
      where: {
        skillId_endorserId: { skillId, endorserId: user.id },
      },
      select: { id: true },
    });

    if (existing) {
      // Toggle off — remove endorsement
      await db.skillEndorsement.delete({ where: { id: existing.id } });

      try {
        await db.auditLog.create({
          data: {
            actorId: user.id,
            action: "skill.unendorse",
            entity: "Skill",
            entityId: skillId,
            severity: "info",
            metadata: JSON.stringify({ skillName: skill.name, targetUserId: id }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        endorsed: false,
        message: "أُزيلت مصادقتك",
      });
    }

    // Create endorsement
    await db.skillEndorsement.create({
      data: { skillId, endorserId: user.id },
    });

    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "skill.endorse",
          entity: "Skill",
          entityId: skillId,
          severity: "info",
          metadata: JSON.stringify({ skillName: skill.name, targetUserId: id }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      endorsed: true,
      message: `صادقت على "${skill.name}"`,
    });
  } catch (error) {
    console.error("[skills/endorse] error:", error);
    return NextResponse.json({ error: "فشلت المصادقة" }, { status: 500 });
  }
}
