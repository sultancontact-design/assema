import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { FundAccountClient } from "@/components/admin/fund/fund-account-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "معلومات الحساب البنكي" };

export default async function FundAccountPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/fund/account");
  const acct = await db.fundAccountInfo.findFirst() ?? await db.fundAccountInfo.create({ data: {} });
  return (
    <div className="flex flex-col">
      <PageHero title="معلومات الحساب البنكي" subtitle="معلومات الحساب التي يراها المتبرعون — RIB، IBAN، CashPlus، Inwi Money." image="https://images.unsplash.com/photo-1601598851547-4308f1d1fa0f?auto=format&fit=crop&w=1920&q=80" imageAlt="معلومات الحساب" badge="بيانات مالية" />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FundAccountClient initial={{
          id: acct.id, bankName: acct.bankName, accountHolder: acct.accountHolder, rib: acct.rib,
          iban: acct.iban, swift: acct.swift, paypalEmail: acct.paypalEmail,
          cashplusNumber: acct.cashplusNumber, inwiMoney: acct.inwiMoney, orangeMoney: acct.orangeMoney,
          customNote: acct.customNote, isVisible: acct.isVisible,
        }} />
      </div>
    </div>
  );
}
