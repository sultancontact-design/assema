// ===================================================================
//  /admin/settings/email — صفحة إعدادات البريد الإلكتروني
//  Server Component — SUPER_ADMIN فقط
//  - يجلب إعدادات SMTP من جدول Setting (أو fallback لـenv)
//  - يجلب آخر 20 سجلّ بريد من EmailLog
//  - يجلب إحصاءات البريد (sentToday / failedToday / pendingToday / successRate)
//  - يُمرّر البيانات للمكوّنات العميلية
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { getLastEmails, getEmailStats, getSmtpSettings } from "@/lib/mailer";
import { EmailSettingsForm, type SmtpSettingsState } from "@/components/admin/email-settings-form";
import { EmailLogsTable, type EmailLogRow, type EmailStatsState } from "@/components/admin/email-logs-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إعدادات البريد الإلكتروني — سيدي يوسف بن علي العاصمة",
};

export default async function EmailSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/settings/email");
  }

  // تقييد صارم: SUPER_ADMIN فقط
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // جلب الإعدادات + السجلّات + الإحصاءات بالتوازي
  const [settings, logs, stats] = await Promise.all([
    getSmtpSettings(),
    getLastEmails(20),
    getEmailStats(),
  ]);

  const initialSettings: SmtpSettingsState = {
    host: settings.host,
    port: settings.port,
    user: settings.user,
    pass: "",
    passSet: settings.pass.length > 0,
    from: settings.from,
    enabled: settings.enabled,
  };

  const initialLogs: EmailLogRow[] = logs.map((l) => ({
    id: l.id,
    to: l.to,
    subject: l.subject,
    status: l.status,
    error: l.error,
    messageId: l.messageId,
    sentAt: l.sentAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  const initialStats: EmailStatsState = {
    sentToday: stats.sentToday,
    failedToday: stats.failedToday,
    pendingToday: stats.pendingToday,
    successRate: stats.successRate,
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إعدادات البريد الإلكتروني
        </h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS.SUPER_ADMIN.label} — اضبط بيانات اعتماد SMTP لتفعيل
          إرسال البريد من المنصة.
        </p>
      </header>

      {/* تنبيه عام */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        <strong className="font-bold">قبل البدء:</strong>{" "}
        أنشئ حساباً في{" "}
        <a
          href="https://www.brevo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Brevo
        </a>{" "}
        (300 رسالة/يوم مجاناً)، ووثّق النطاق{" "}
        <code dir="ltr" className="font-mono">
          syba-community.ma
        </code>
        ، ثم انسخ بيانات SMTP_USER و SMTP_PASS إلى النموذج أدناه.
      </div>

      {/* نموذج الإعدادات */}
      <EmailSettingsForm
        initialSettings={initialSettings}
        currentEmail={user.email}
      />

      {/* جدول السجلّات */}
      <EmailLogsTable initialLogs={initialLogs} stats={initialStats} />
    </div>
  );
}
