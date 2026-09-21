// ===================================================================
//  صفحة الباقات — /admin/ads/packages
//  Server Component — يجلب 5 باقات + إحصاءات + إعدادات تجاوز
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  PackagesGrid,
  type PackageStats,
} from "@/components/admin/ads/packages-grid";
import { AD_PACKAGE_LABELS } from "@/lib/constants";
import type { AdPackage } from "@prisma/client";

export const dynamic = "force-dynamic";

const PACKAGE_KEYS = Object.keys(AD_PACKAGE_LABELS) as AdPackage[];
const FEATURED: AdPackage = "GOLD";

export default async function AdminAdsPackagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  // جلب الإعلانات لحساب الإحصاءات
  const ads = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    take: 200,
  });

  // جلب إعدادات التجاوز للسعر/المدة
  const settingKeys = PACKAGE_KEYS.flatMap((p) => [
    `ads.packages.${p}.price`,
    `ads.packages.${p}.duration`,
  ]);
  const settings = await db.setting.findMany({
    where: { key: { in: settingKeys } },
    select: { key: true, value: true },
  });
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const packages: PackageStats[] = PACKAGE_KEYS.map((key) => {
    const meta = AD_PACKAGE_LABELS[key];
    const adsForPackage = ads.filter((a) => a.package === key);
    const activeCount = adsForPackage.filter((a) => a.status === "ACTIVE").length;
    const revenue = adsForPackage
      .filter((a) => a.status === "ACTIVE" || a.status === "EXPIRED")
      .reduce((s, a) => s + a.amountPaid, 0);

    const priceOverride = settingsMap.get(`ads.packages.${key}.price`);
    const durationOverride = settingsMap.get(`ads.packages.${key}.duration`);
    const price = priceOverride ? Number(priceOverride) : meta.price;
    const duration = durationOverride ?? meta.duration;

    return {
      key,
      label: meta.label,
      price,
      duration,
      basePrice: meta.price,
      baseDuration: meta.duration,
      activeCount,
      revenue,
      totalAds: adsForPackage.length,
      featured: key === FEATURED,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الباقات الإعلانية
        </h1>
        <p className="text-sm text-muted-foreground">
          {packages.length} باقات — عدّل الأسعار والمدد حسب الحاجة.
        </p>
      </header>

      <PackagesGrid packages={packages} />
    </div>
  );
}
