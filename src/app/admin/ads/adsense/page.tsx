// ===================================================================
//  صفحة Google AdSense — /admin/ads/adsense
//  Server Component — يقرأ إعدادات AdSense من جدول Setting
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { AdsenseForm } from "@/components/admin/ads/adsense-form";

export const dynamic = "force-dynamic";

const SETTING_KEYS = [
  "ads.adsense.publisherId",
  "ads.adsense.active",
  "ads.adsense.testMode",
  "ads.adsense.lastReport",
];

export default async function AdminAdsensePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  const settings = await db.setting.findMany({
    where: { key: { in: SETTING_KEYS } },
    select: { key: true, value: true },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const publisherId = map.get("ads.adsense.publisherId") ?? "";
  const active = map.get("ads.adsense.active") === "true";
  const testMode = map.get("ads.adsense.testMode") === "true";
  const lastReport = map.get("ads.adsense.lastReport") ?? "";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Google AdSense
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة تكامل AdSense — المعرّف، التفعيل، وضع التجربة، والتقارير.
        </p>
      </header>

      <AdsenseForm
        publisherId={publisherId}
        active={active}
        testMode={testMode}
        lastReport={lastReport}
      />
    </div>
  );
}
