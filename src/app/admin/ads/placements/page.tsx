// ===================================================================
//  صفحة أماكن الإعلانات — /admin/ads/placements
//  Server Component — يجمع إحصاءات لكل مكان (12 مكان)
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  PlacementsGrid,
  type PlacementStats,
} from "@/components/admin/ads/placements-grid";
import { AD_PLACEMENT_LABELS } from "@/lib/constants";
import { computeCTR, toAdRow } from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

export default async function AdminAdsPlacementsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  const ads = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // جلب الإعدادات المتعلّقة بالأماكن
  const placementKeys = Object.keys(AD_PLACEMENT_LABELS);
  const settingKeys = placementKeys.flatMap((p) => [
    `ads.placement.${p}.code`,
    `ads.placement.${p}.active`,
  ]);
  const settings = await db.setting.findMany({
    where: { key: { in: settingKeys } },
    select: { key: true, value: true },
  });
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  // تجميع الإحصاءات لكل مكان
  const placements: PlacementStats[] = placementKeys.map((key) => {
    const label = AD_PLACEMENT_LABELS[key];
    const adsForPlace = ads.filter((a) => a.placement === key);
    const views = adsForPlace.reduce((s, a) => s + a.views, 0);
    const clicks = adsForPlace.reduce((s, a) => s + a.clicks, 0);
    const revenue = adsForPlace
      .filter((a) => a.status === "ACTIVE" || a.status === "EXPIRED")
      .reduce((s, a) => s + a.amountPaid, 0);
    const activeAd = adsForPlace.find((a) => a.status === "ACTIVE") ?? null;

    return {
      key,
      label,
      adsCount: adsForPlace.length,
      views,
      clicks,
      ctr: computeCTR(views, clicks),
      revenue,
      activeAd: activeAd ? toAdRow(activeAd) : null,
      customCode: settingsMap.get(`ads.placement.${key}.code`) ?? null,
      customActive: settingsMap.get(`ads.placement.${key}.active`) === "true",
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          أماكن الإعلانات
        </h1>
        <p className="text-sm text-muted-foreground">
          {placements.length} مكان متاح — تخصّص الكود لكل مكان على حدة.
        </p>
      </header>

      <PlacementsGrid placements={placements} />
    </div>
  );
}
