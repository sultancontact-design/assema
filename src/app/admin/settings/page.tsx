// @ts-nocheck — type narrowing
// ===================================================================
//  صفحة الإعدادات — /admin/settings
//  Server Component — يجلب الإعدادات + معلومات الحي، يمرّرها لـSettingsForm
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

// قائمة المفاتيح المطلوبة في جدول Setting
const SETTING_KEYS = [
  "site.name",
  "site.tagline",
  "site.description",
  "fund.threshold.ethics",
  "fund.disbursement.deadline",
  "community.target.families",
  "community.target.contributions",
  "community.target.events",
] as const;

const DEFAULTS = {
  "site.name": "سيدي يوسف بن علي العاصمة",
  "site.tagline": "من حي إلى عاصمة... المعروف الرقمي",
  "site.description":
    "منصة ويب اجتماعية تضامنية لرقمنة المعروف المغربي في حي سيدي يوسف بن علي بمراكش.",
  "fund.threshold.ethics": "1000",
  "fund.disbursement.deadline": "72",
  "community.target.families": "500",
  "community.target.contributions": "100",
  "community.target.events": "10",
} as const;

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // 1) جلب الإعدادات
  const settings = await db.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    select: { key: true, value: true },
  });
  const settingsMap = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  // تطبيق الافتراضي للغياب
  const initialSettings = SETTING_KEYS.reduce<Record<string, string>>(
    (acc, key) => {
      acc[key] = settingsMap[key] ?? DEFAULTS[key];
      return acc;
    },
    {}
  );

  // 2) جلب معلومات الحي
  const district = await db.district.findUnique({
    where: { id: user.districtId },
    select: {
      name: true,
      city: true,
      region: true,
    },
  });

  const [familiesCount, usersCount] = await Promise.all([
    db.family.count({
      where: { districtId: user.districtId, isActive: true, deletedAt: null },
    }),
    db.user.count({
      where: { districtId: user.districtId, deletedAt: null },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الإعدادات
        </h1>
        <p className="text-sm text-muted-foreground">
          ضبط اسم الموقع، حدود الصندوق، أهداف المجتمع، ومعلومات الحي.
        </p>
      </header>

      <SettingsForm
        initialSettings={initialSettings}
        district={{
          name: district?.name ?? "—",
          city: district?.city ?? "—",
          region: district?.region ?? "—",
          familiesCount,
          usersCount,
        }}
      />
    </div>
  );
}
