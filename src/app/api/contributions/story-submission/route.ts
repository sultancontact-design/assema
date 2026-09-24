import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }

  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  const consentGiven = Boolean(body.consentGiven);
  const anonymize = body.anonymize !== undefined ? Boolean(body.anonymize) : true;
  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;

  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  if (bodyText.length < 50) return NextResponse.json({ error: "النص قصير جداً (50 حرف)" }, { status: 400 });
  if (!consentGiven) return NextResponse.json({ error: "الموافقة على النشر مطلوبة" }, { status: 400 });

  const record = await db.storySubmission.create({
    data: {
      userId: user.id,
      title,
      body: bodyText,
      consentGiven,
      anonymize,
      imageUrl,
      districtId: user.districtId,
      status: "PENDING",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "contribution.story.submitted",
      entity: "StorySubmission",
      entityId: record.id,
      severity: "info",
      metadata: JSON.stringify({ title, anonymize }),
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
