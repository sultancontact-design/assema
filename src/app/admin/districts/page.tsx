// ===================================================================
//  صفحة إدارة الأحياء — /admin/districts (Multi-Tenant)
//  Server Component — يجلب كل الأحياء مع الإحصاءات
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  DistrictsClient,
  type DistrictRow,
} from "@/components/admin/districts-client";

export const dynamic = "force-dynamic";

export default async function AdminDistrictsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "district.view")) return null;

  // 1) جلب كل الأحياء
  const districts = await db.district.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  // 2) إحصاءات لكل حي
  const rows: DistrictRow[] = await Promise.all(
    districts.map(async (d) => {
      const [familiesCount, usersCount, eventsCount, groupsCount, adsCount] = await Promise.all([
        db.family.count({ where: { districtId: d.id, deletedAt: null } }),
        db.user.count({ where: { districtId: d.id, deletedAt: null } }),
        db.event.count({ where: { districtId: d.id, deletedAt: null } }),
        db.group.count({ where: { districtId: d.id, deletedAt: null } }),
        db.ad.count({ where: { districtId: d.id } }),
      ]);

      // حساب رصيد الحي: مساهمات مؤكّدة - صرف مكتمل
      const [contributionsAgg, fundRequestsAgg] = await Promise.all([
        db.contribution.aggregate({
          where: { districtId: d.id, status: "CONFIRMED" },
          _sum: { amount: true },
        }),
        db.fundRequest.aggregate({
          where: {
            districtId: d.id,
            OR: [{ status: "DISBURSED" }, { status: "COMPLETED" }],
          },
          _sum: { amountDisbursed: true },
        }),
      ]);

      const totalContributions = contributionsAgg._sum.amount ?? 0;
      const totalDisbursed = fundRequestsAgg._sum.amountDisbursed ?? 0;
      const balance = totalContributions - totalDisbursed;

      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        city: d.city,
        region: d.region,
        description: d.description ?? "",
        boundarySvg: d.boundarySvg ?? "",
        isActive: d.isActive,
        isDefault: d.isDefault,
        createdAt:
          d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
        familiesCount,
        usersCount,
        eventsCount,
        groupsCount,
        adsCount,
        totalContributions,
        totalDisbursed,
        balance,
      };
    })
  );

  // 3) جلب المستخدمين للحوار "نقل عضو"
  const allUsers = await db.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, fullName: true, email: true, districtId: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة الأحياء
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} حي مسجّل. البنية متعددة الأحياء تتيح التوسّع من حيّ لآخر.
          الحي الافتراضي يضمّ كل الأعضاء الحاليين.
        </p>
      </header>

      <DistrictsClient districts={rows} allUsers={allUsers} />
    </div>
  );
}
