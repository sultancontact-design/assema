import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    profession, skills, interests, bio, avatar,
    socialInstagram, socialTiktok, socialFacebook, socialWhatsapp,
    isProfilePublic, allowMessages,
  } = body;

  // firstName/lastName/email/phone are read-only (security)
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      profession: profession || null,
      skills: skills || null,
      interests: interests || null,
      bio: bio || null,
      avatar: avatar || null,
      socialInstagram: socialInstagram || null,
      socialTiktok: socialTiktok || null,
      socialFacebook: socialFacebook || null,
      socialWhatsapp: socialWhatsapp || null,
      isProfilePublic: !!isProfilePublic,
      allowMessages: !!allowMessages,
    },
    select: { id: true, profession: true, bio: true },
  });

  await db.auditLog.create({
    data: {
      action: "user.profile.update",
      entity: "User",
      entityId: user.id,
      severity: "info",
      actorId: user.id,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, user: updated });
}
