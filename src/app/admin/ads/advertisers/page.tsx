// ===================================================================
//  صفحة المعلنين — /admin/ads/advertisers
//  Server Component — يجمّع الإعلانات حسب البريد (groupBy)
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  AdvertisersTable,
  type AdvertiserRow,
} from "@/components/admin/ads/advertisers-table";
import { toAdRow } from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  // جلب كل الإعلانات في الحي
  const ads = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // تجميع على العميل (group by advertiserEmail أو الاسم كبديل)
  const map = new Map<string, AdvertiserRow>();
  for (const ad of ads) {
    const key = (ad.advertiserEmail?.trim() || ad.advertiserName.trim() || ad.id).toLowerCase();
    const existing = map.get(key);
    const row = toAdRow(ad);
    if (existing) {
      existing.campaignsCount += 1;
      existing.totalSpent += ad.amountPaid;
      existing.ads.push(row);
      // نُحدّث آخر تاريخ إن كان أحدث
      if (ad.createdAt.getTime() > new Date(existing.lastCampaignAt).getTime()) {
        existing.lastCampaignAt = ad.createdAt.toISOString();
      }
      // نُحدّث الاسم/الهاتف إن كانت مفقودة
      if (!existing.name && ad.advertiserName) existing.name = ad.advertiserName;
      if (!existing.email && ad.advertiserEmail) existing.email = ad.advertiserEmail;
      if (!existing.phone && ad.advertiserPhone) existing.phone = ad.advertiserPhone;
    } else {
      map.set(key, {
        key,
        name: ad.advertiserName,
        email: ad.advertiserEmail,
        phone: ad.advertiserPhone,
        campaignsCount: 1,
        totalSpent: ad.amountPaid,
        lastCampaignAt: ad.createdAt.toISOString(),
        ads: [row],
      });
    }
  }

  const advertisers = Array.from(map.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          المعلنون
        </h1>
        <p className="text-sm text-muted-foreground">
          {advertisers.length} معلن نشط — تجميع آلي من جدول الإعلانات.
        </p>
      </header>

      <AdvertisersTable advertisers={advertisers} />
    </div>
  );
}
