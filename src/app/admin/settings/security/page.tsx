// ===================================================================
//  /admin/settings/security — صفحة الإعدادات الأمنية
//  Server Component — SUPER_ADMIN فقط
//  - يجلب حالة 2FA للمستخدم الحالي
//  - يجلب آخر 10 سجلات AuditLog حيث يبدأ action بـ "user.2fa."
//  - يُمرّر البيانات للمكوّن العميل المناسب (setup أو enabled)
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TwoFactorSetup } from "@/components/admin/two-factor-setup";
import { TwoFactorEnabled } from "@/components/admin/two-factor-enabled";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/settings/security");
  }

  // تقييد صارم: SUPER_ADMIN فقط
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // جلب حالة 2FA + آخر السجلات الأمنية المتعلّقة بـ2FA
  const [dbUser, auditLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    }),
    db.auditLog.findMany({
      where: {
        OR: [
          { action: { startsWith: "user.2fa." } },
          { action: { startsWith: "admin.2fa." } },
        ],
        actorId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        severity: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  const isTwoFactorEnabled = dbUser?.twoFactorEnabled === true;

  const auditEntries = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    severity: l.severity,
    metadata: l.metadata,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الإعدادات الأمنية
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة المصادقة الثنائية ورموز النسخ الاحتياطي ومراجعة آخر محاولات
          الدخول.
        </p>
      </header>

      {/* معلومات الجلسة الحالية */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="size-2 rounded-full bg-secondary" />
          معلومات الجلسة الحالية
        </h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">البريد</dt>
            <dd className="font-mono text-start" dir="ltr">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">الدور</dt>
            <dd className="font-medium text-foreground">مشرف عام</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">آخر دخول</dt>
            <dd className="font-medium text-foreground">
              {dbUser?.lastLoginAt
                ? new Intl.DateTimeFormat("ar-MA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(dbUser.lastLoginAt)
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* قسم 2FA — يعرض أحد المكوّنين حسب الحالة */}
      {isTwoFactorEnabled ? (
        <TwoFactorEnabled auditLogs={auditEntries} />
      ) : (
        <TwoFactorSetup />
      )}
    </div>
  );
}
