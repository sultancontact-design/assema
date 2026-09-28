import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { id, bankName, accountHolder, rib, iban, swift, paypalEmail, cashplusNumber, inwiMoney, orangeMoney, customNote, isVisible } = body;
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
  const updated = await db.fundAccountInfo.update({
    where: { id },
    data: {
      bankName: bankName || null, accountHolder: accountHolder || null, rib: rib || null,
      iban: iban || null, swift: swift || null, paypalEmail: paypalEmail || null,
      cashplusNumber: cashplusNumber || null, inwiMoney: inwiMoney || null,
      orangeMoney: orangeMoney || null, customNote: customNote || null,
      isVisible: !!isVisible, updatedBy: user.id,
    },
  });
  await db.auditLog.create({ data: { action: "fund.account.update", entity: "FundAccountInfo", entityId: id, severity: "info", actorId: user.id } }).catch(() => {});
  return NextResponse.json({ success: true, account: updated });
}
