// ===================================================================
//  صفحة النسخ الاحتياطي — /admin/backup
//  Server Component — يجلب قائمة النسخ السابقة + إعدادات الجدولة
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import {
  BackupClient,
  type BackupHistoryRow,
  type BackupSettings,
} from "@/components/admin/backup-client";
import { formatDateTimeArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

const DB_FILE_PATH = resolve(process.cwd(), "db/custom.db");

export default async function AdminBackupPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "admin.backup")) return null;

  // 1) حجم ملف قاعدة البيانات
  let dbFileSize = 0;
  try {
    const stat = await fs.stat(DB_FILE_PATH);
    dbFileSize = stat.size;
  } catch {
    dbFileSize = 0;
  }

  // 2) قائمة النسخ السابقة (audit logs action starts with "backup.")
  const backupLogs = await db.auditLog.findMany({
    where: { action: { startsWith: "backup." } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, fullName: true, email: true } },
    },
  });

  const history: BackupHistoryRow[] = backupLogs.map((log) => {
    let meta: { type?: string; size?: number; filename?: string } = {};
    try {
      meta = JSON.parse(log.metadata ?? "{}");
    } catch {
      // تجاهل
    }
    return {
      id: log.id,
      action: log.action,
      type: meta.type ?? log.action.replace("backup.", ""),
      size: meta.size ?? 0,
      filename: meta.filename ?? "",
      downloadedBy: log.actor?.fullName ?? "النظام",
      createdAt:
        log.createdAt instanceof Date
          ? log.createdAt.toISOString()
          : String(log.createdAt),
    };
  });

  // 3) إعدادات الجدولة (settings table)
  const settings = await db.setting.findMany({
    where: {
      key: { startsWith: "backup.schedule." },
    },
    select: { key: true, value: true, type: true },
  });

  const backupSettings: BackupSettings = {
    frequency: "weekly",
    retention: "14",
    enabled: false,
  };
  for (const s of settings) {
    if (s.key === "backup.schedule.frequency") backupSettings.frequency = s.value;
    if (s.key === "backup.schedule.retention") backupSettings.retention = s.value;
    if (s.key === "backup.schedule.enabled") backupSettings.enabled = s.value === "true";
  }

  // نمرّر قيم formatted للعرض التاريخي (string بدلاً من Date)
  const formattedHistory = history.map((h) => ({
    ...h,
    createdAtLabel: formatDateTimeArabic(h.createdAt),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          النسخ الاحتياطي
        </h1>
        <p className="text-sm text-muted-foreground">
          نسخ قاعدة البيانات دورياً للحفاظ على استمرارية الخدمة.
        </p>
      </header>

      <BackupClient
        dbFileSize={dbFileSize}
        history={formattedHistory}
        settings={backupSettings}
      />
    </div>
  );
}
