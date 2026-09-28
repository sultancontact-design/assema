import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const acct = await db.fundAccountInfo.findFirst({ where: { isVisible: true } });
  if (!acct) return NextResponse.json({ isVisible: false }, { status: 200 });
  return NextResponse.json({
    bankName: acct.bankName, accountHolder: acct.accountHolder, rib: acct.rib,
    iban: acct.iban, swift: acct.swift, paypalEmail: acct.paypalEmail,
    cashplusNumber: acct.cashplusNumber, inwiMoney: acct.inwiMoney,
    orangeMoney: acct.orangeMoney, customNote: acct.customNote,
    isVisible: acct.isVisible,
  });
}
