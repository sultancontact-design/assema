import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { id, isOpen, minDonation, maxDonation, allowAnonymous, requireReceipt, publicTransparency, thankYouMessage } = body;
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
  const updated = await db.fundSettings.update({
    where: { id },
    data: {
      isOpen: !!isOpen, minDonation: Number(minDonation) || 0, maxDonation: Number(maxDonation) || 0,
      allowAnonymous: !!allowAnonymous, requireReceipt: !!requireReceipt, publicTransparency: !!publicTransparency,
      thankYouMessage: thankYouMessage || null, updatedBy: user.id,
    },
  });
  await db.auditLog.create({ data: { action: "fund.settings.update", entity: "FundSettings", entityId: id, severity: "info", actorId: user.id } }).catch(() => {});
  return NextResponse.json({ success: true, settings: updated });
}
