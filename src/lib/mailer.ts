// ===================================================================
//  Mailer — واجهة إرسال البريد الإلكتروني عبر SMTP (Brevo)
//  - createTransport(): تهيئة كسولة + تخزين مؤشّر في process.env
//  - sendMail({ to, subject, html, text? }): إرسال واحد
//    * SMTP_ENABLED=false: تسجيل في الكونسول + تخزين كـEmailLog(pending)
//    * على الخطأ: تسجيل + رفع استثناء
//    * على النجاح: تخزين كـEmailLog(sent) + AuditLog(email.sent)
//  - sendBulkMail({ recipients[], subject, html }): حلقة مع تأخير 100ms
//  - getLastEmails(limit): آخر سجلات EmailLog
// ===================================================================

import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";

// ===================================================================
//  الأنواع
// ===================================================================

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendBulkMailParams {
  recipients: string[];
  subject: string;
  html: string;
}

export interface SendBulkMailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  messageId: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

// ===================================================================
//  كاش للـtransporter (لتفادي إعادة التهيئة في كل طلب)
// ===================================================================

let cachedTransporter: Transporter | null = null;

// ===================================================================
//  قراءة الإعدادات من البيئة (env) أو من جدول Setting
//  الأولوية: قاعدة البيانات إن وُجد فيها، وإلا متغيّرات البيئة.
// ===================================================================

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  enabled: boolean;
}

const DEFAULT_SMTP: SmtpSettings = {
  host: "smtp-relay.brevo.com",
  port: 587,
  user: "",
  pass: "",
  from: "سيدي يوسف بن علي العاصمة <noreply@syba-community.ma>",
  enabled: false,
};

// ===================================================================
//  parseBool: تحويل قيمة string/boolean إلى boolean
// ===================================================================

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    return v.trim().toLowerCase() === "true" || v.trim() === "1";
  }
  return false;
}

// ===================================================================
//  getSmtpSettings: يجلب الإعدادات من DB (Setting) أولاً، ثم env
// ===================================================================

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const keys = [
    "smtp.host",
    "smtp.port",
    "smtp.user",
    "smtp.pass",
    "smtp.from",
    "smtp.enabled",
  ];

  try {
    const rows = await db.setting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return {
      host: map["smtp.host"] || process.env.SMTP_HOST || DEFAULT_SMTP.host,
      port: parseInt(map["smtp.port"] || process.env.SMTP_PORT || String(DEFAULT_SMTP.port), 10),
      user: map["smtp.user"] ?? process.env.SMTP_USER ?? DEFAULT_SMTP.user,
      pass: map["smtp.pass"] ?? process.env.SMTP_PASS ?? DEFAULT_SMTP.pass,
      from: map["smtp.from"] || process.env.SMTP_FROM || DEFAULT_SMTP.from,
      enabled: parseBool(map["smtp.enabled"] ?? process.env.SMTP_ENABLED ?? DEFAULT_SMTP.enabled),
    };
  } catch {
    // فشل الوصول لـDB → استعمل env فقط
    return {
      host: process.env.SMTP_HOST || DEFAULT_SMTP.host,
      port: parseInt(process.env.SMTP_PORT || String(DEFAULT_SMTP.port), 10),
      user: process.env.SMTP_USER || DEFAULT_SMTP.user,
      pass: process.env.SMTP_PASS || DEFAULT_SMTP.pass,
      from: process.env.SMTP_FROM || DEFAULT_SMTP.from,
      enabled: parseBool(process.env.SMTP_ENABLED ?? DEFAULT_SMTP.enabled),
    };
  }
}

// ===================================================================
//  createTransport: يُنشئ Transporter مع تهيئة كسولة + كاش
// ===================================================================

export async function createTransport(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const settings = await getSmtpSettings();
  cachedTransporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: settings.user
      ? {
          user: settings.user,
          pass: settings.pass,
        }
      : undefined,
    // علاقة مهلة قصيرة لتسريع اكتشاف الأخطاء
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return cachedTransporter;
}

// ===================================================================
//  invalidateTransport: لإعادة إنشاء الـtransporter بعد تحديث الإعدادات
// ===================================================================

export function invalidateTransport(): void {
  cachedTransporter = null;
}

// ===================================================================
//  sendMail: الإرسال الفردي
// ===================================================================

export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const { to, subject, html, text } = params;

  // التحقّق من صحة البريد الإلكتروني
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    const err = `بريد غير صالح: ${to}`;
    console.warn(`[mailer] ${err}`);
    return { success: false, error: err };
  }

  const settings = await getSmtpSettings();

  // -----------------------------------------------------------------
  //  SMTP مُعطَّل → تسجيل في EmailLog pending (بدون console.log)
  // -----------------------------------------------------------------
  if (!settings.enabled) {
    try {
      await db.emailLog.create({
        data: {
          to,
          subject,
          body: html,
          status: "pending",
          error: "SMTP_DISABLED",
          sentAt: new Date(),
        },
      });
    } catch (e) {
      console.error("[mailer] failed to log pending email:", e);
    }
    return { success: true, messageId: `disabled-${Date.now()}` };
  }

  // -----------------------------------------------------------------
  //  SMTP مُفعّل → إرسال فعلي
  // -----------------------------------------------------------------
  try {
    const transporter = await createTransport();
    const info = await transporter.sendMail({
      from: settings.from,
      to,
      subject,
      html,
      text: text ?? undefined,
    });

    // نجاح → سجلّ EmailLog(sent)
    try {
      await db.emailLog.create({
        data: {
          to,
          subject,
          body: html,
          status: "sent",
          messageId: info.messageId ?? null,
          sentAt: new Date(),
        },
      });
    } catch (e) {
      console.error("[mailer] failed to log sent email:", e);
    }

    // نجاح → سجلّ AuditLog
    try {
      await db.auditLog.create({
        data: {
          action: "email.sent",
          entity: "EmailLog",
          metadata: JSON.stringify({ to, subject, status: "sent", messageId: info.messageId }),
          severity: "info",
        },
      });
    } catch (e) {
      console.error("[mailer] failed to log audit:", e);
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[mailer] sendMail error to=${to}:`, errorMsg);

    // فشل → سجلّ EmailLog(failed)
    try {
      await db.emailLog.create({
        data: {
          to,
          subject,
          body: html,
          status: "failed",
          error: errorMsg.slice(0, 1000),
        },
      });
    } catch (e) {
      console.error("[mailer] failed to log failed email:", e);
    }

    // فشل → سجلّ AuditLog
    try {
      await db.auditLog.create({
        data: {
          action: "email.failed",
          entity: "EmailLog",
          metadata: JSON.stringify({ to, subject, error: errorMsg.slice(0, 500) }),
          severity: "warning",
        },
      });
    } catch (e) {
      console.error("[mailer] failed to log audit:", e);
    }

    return { success: false, error: errorMsg };
  }
}

// ===================================================================
//  sendBulkMail: إرسال متعدّد مع تأخير 100ms بين كل إرسال
// ===================================================================

export async function sendBulkMail(
  params: SendBulkMailParams
): Promise<SendBulkMailResult> {
  const { recipients, subject, html } = params;
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    const res = await sendMail({ to: r, subject, html });
    if (res.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${r}: ${res.error ?? "unknown"}`);
    }
    // تأخير بسيط لتفادي rate-limit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors,
  };
}

// ===================================================================
//  getLastEmails: آخر N سجلّ بريد من EmailLog
// ===================================================================

export async function getLastEmails(limit = 20): Promise<EmailLogEntry[]> {
  const rows = await db.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      to: true,
      subject: true,
      status: true,
      error: true,
      messageId: true,
      sentAt: true,
      createdAt: true,
    },
  });
  return rows;
}

// ===================================================================
//  getEmailStats: إحصاءات البريد المُرسَل اليوم
// ===================================================================

export async function getEmailStats(): Promise<{
  sentToday: number;
  failedToday: number;
  pendingToday: number;
  successRate: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [sentToday, failedToday, pendingToday] = await Promise.all([
    db.emailLog.count({
      where: { status: "sent", createdAt: { gte: startOfDay } },
    }),
    db.emailLog.count({
      where: { status: "failed", createdAt: { gte: startOfDay } },
    }),
    db.emailLog.count({
      where: { status: "pending", createdAt: { gte: startOfDay } },
    }),
  ]);

  const total = sentToday + failedToday;
  const successRate = total > 0 ? (sentToday / total) * 100 : 0;

  return { sentToday, failedToday, pendingToday, successRate };
}
