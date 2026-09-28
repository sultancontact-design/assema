import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { FundSettingsClient } from "@/components/admin/fund/fund-settings-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعدادات الصندوق" };

export default async function FundSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/fund/settings");
  const settings = await db.fundSettings.findFirst() ?? await db.fundSettings.create({ data: {} });
  return (
    <div className="flex flex-col">
      <PageHero title="إعدادات الصندوق" subtitle="تحكّم في فتح/إغلاق الصندوق، حدود التبرع، والشفافية." image="https://images.unsplash.com/photo-1601598851547-4308f1d1fa0f?auto=format&fit=crop&w=1920&q=80" imageAlt="إعدادات الصندوق" badge="إدارة مالية" />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FundSettingsClient initial={{
          id: settings.id, isOpen: settings.isOpen, minDonation: settings.minDonation,
          maxDonation: settings.maxDonation, allowAnonymous: settings.allowAnonymous,
          requireReceipt: settings.requireReceipt, publicTransparency: settings.publicTransparency,
          thankYouMessage: settings.thankYouMessage,
        }} />
      </div>
    </div>
  );
}
