// ===================================================================
//  /community/notifications/settings — إعدادات الإشعارات
//  - 10 toogles لأنواع الإشعارات
//  - ساعات الهدوء
//  - الحدّ اليومي
//  - "خذ استراحة" (إيقاف كل الإشعارات لـX ساعة)
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationSettingsForm } from "@/components/community/notification-settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إعدادات الإشعارات",
};

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/notifications/settings");
  }

  const prefs = await db.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          إعدادات الإشعارات الذكية
        </h1>
        <p className="text-sm text-muted-foreground">
          تحكّم كامل في ما يصلك ومتى. أنت المتقدّم — لا الخوارزمية.
        </p>
      </header>

      <NotificationSettingsForm initial={prefs} />
    </div>
  );
}
