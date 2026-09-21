// ===================================================================
//  صفحة الحملات الإعلانية — /admin/ads/campaigns
//  Server Component — يجلب كل إعلانات الحي ويمرّرها للجدول
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { CampaignsTable } from "@/components/admin/ads/campaigns-table";
import { toAdRow } from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

export default async function AdminAdsCampaignsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  const ads = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = ads.map(toAdRow);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الحملات الإعلانية
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} حملة مسجّلة — أنشئ حملة جديدة، عدّل الموجودة، أو راجع بانتظار الموافقة.
        </p>
      </header>

      <CampaignsTable ads={rows} />
    </div>
  );
}
