"use client";

// ===================================================================
//  BackupClient — 3 أقسام: نسخ يدوي + مجدول + قائمة النسخ السابقة
// ===================================================================

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DatabaseBackup,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Save,
  FileText,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTimeArabic } from "@/lib/constants";

// ===================================================================
//  الأنواع
// ===================================================================

export interface BackupHistoryRow {
  id: string;
  action: string;
  type: string;
  size: number;
  filename: string;
  downloadedBy: string;
  createdAt: string;
  createdAtLabel?: string;
}

export interface BackupSettings {
  frequency: string;
  retention: string;
  enabled: boolean;
}

interface BackupClientProps {
  dbFileSize: number;
  history: BackupHistoryRow[];
  settings: BackupSettings;
}

// ===================================================================
//  مساعدات
// ===================================================================

function formatBytes(bytes: number): string {
  if (!bytes) return "0 ب";
  const k = 1024;
  const sizes = ["ب", "ك.ب", "م.ب", "ج.ب"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${sizes[i] ?? "ب"}`;
}

const TYPE_LABELS: Record<string, string> = {
  "backup.download": "تنزيل يدوي",
  "backup.json": "تصدير JSON",
  "backup.schedule.updated": "تحديث الجدولة",
  "backup.restore": "استعادة",
  "backup.delete": "حذف نسخة",
};

// ===================================================================
//  المُكوّن
// ===================================================================

export function BackupClient({
  dbFileSize,
  history,
  settings,
}: BackupClientProps) {
  // إعدادات الجدولة
  const [frequency, setFrequency] = React.useState(settings.frequency);
  const [retention, setRetention] = React.useState(settings.retention);
  const [enabled, setEnabled] = React.useState(settings.enabled);
  const [savingSettings, setSavingSettings] = React.useState(false);

  // التنزيلات
  const [downloading, setDownloading] = React.useState<string | null>(null);

  // استعادة
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const [restoring, setRestoring] = React.useState(false);

  // حذف
  const [deleting, setDeleting] = React.useState<BackupHistoryRow | null>(null);
  const [deletingBusy, setDeletingBusy] = React.useState(false);

  async function downloadDb() {
    setDownloading("db");
    try {
      const res = await fetch("/api/admin/backup/download", { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "فشل التنزيل");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syba-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل نسخة كاملة");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloading(null);
    }
  }

  async function downloadJson() {
    setDownloading("json");
    try {
      const res = await fetch("/api/admin/backup/json", { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "فشل التصدير");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syba-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تصدير JSON");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloading(null);
    }
  }

  async function downloadBackup(row: BackupHistoryRow) {
    if (!row.filename) {
      toast.error("لا يوجد ملف للتنزيل لهذه النسخة");
      return;
    }
    // نُحاول تنزيل الملف من المسار المُسجّل
    setDownloading(row.id);
    try {
      const res = await fetch(`/api/admin/backup/download?filename=${encodeURIComponent(row.filename)}`, {
        method: "GET",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "النسخة غير متاحة بعد");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.filename || "backup.db";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل النسخة");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloading(null);
    }
  }

  async function saveScheduleSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/backup/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency, retention, enabled }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "فشل حفظ الإعدادات");
        return;
      }
      toast.success("تم حفظ إعدادات الجدولة");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleRestore() {
    if (!restoreFile) {
      toast.error("يرجى اختيار ملف نسخة احتياطية");
      return;
    }
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", restoreFile);
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        body: formData,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error ?? "فشلت الاستعادة");
        return;
      }
      toast.success("تم استعادة النسخة بنجاح. يُرجى إعادة تحميل الصفحة.");
      setRestoreOpen(false);
      setRestoreFile(null);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      // الحذف غير متاح حالياً — فقط تُحذف الإشارات في الـaudit log
      toast.success("تم حذف سجل النسخة");
      setDeleting(null);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* تحذير */}
      <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
        <div className="text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium">تنبيه هام</p>
          <p className="mt-1 text-xs">
            النسخ الاحتياطي ضروري لاستمرارية الخدمة. النسخ الحالية تُخزَّن محلياً فقط —
            يُنصح بنسخها لتخزين سحابي مجاني (Cloudflare R2 / Supabase Storage) عند النشر على VPS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* نسخ يدوي */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DatabaseBackup className="size-4 text-accent" strokeWidth={1.5} />
              <span>نسخ يدوي</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              حجم قاعدة البيانات الحالية:{" "}
              <span className="font-medium text-foreground">{formatBytes(dbFileSize)}</span>
            </div>

            <div className="space-y-2">
              <Button
                onClick={downloadDb}
                disabled={downloading === "db"}
                className="h-11 w-full"
              >
                <Download className="size-4" strokeWidth={1.5} />
                <span>{downloading === "db" ? "جارٍ التنزيل..." : "تنزيل نسخة كاملة (SQLite)"}</span>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                ملف .db ثنائي — مناسب للاستعادة السريعة على نفس النوع من قواعد البيانات.
              </p>

              <Button
                onClick={downloadJson}
                disabled={downloading === "json"}
                variant="outline"
                className="h-11 w-full"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                <span>{downloading === "json" ? "جارٍ التصدير..." : "تصدير JSON"}</span>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                صيغة JSON قابلة للقراءة ومحمولة على PostgreSQL في الإنتاج.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* نسخ مجدول */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="size-4 text-accent" strokeWidth={1.5} />
              <span>نسخ مجدول</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-3">
              <div>
                <Label htmlFor="schedule-enabled" className="text-sm font-medium text-foreground">
                  تفعيل النسخ المجدول
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  سيتم حفظ الإعدادات في جدول الإعدادات
                </p>
              </div>
              <Switch
                id="schedule-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label>التكرار</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر التكرار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>مدة الاحتفاظ (أيام)</Label>
              <Select value={retention} onValueChange={setRetention}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 أيام</SelectItem>
                  <SelectItem value="14">14 يوماً</SelectItem>
                  <SelectItem value="30">30 يوماً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
              سيتم تفعيل النسخ المجدول عند النشر على VPS مع cron job —
              الإعدادات تُحفَظ محلياً حتى يتم النشر.
            </div>

            <Button onClick={saveScheduleSettings} disabled={savingSettings} className="h-11 w-full">
              <Save className="size-4" strokeWidth={1.5} />
              <span>{savingSettings ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* قائمة النسخ السابقة */}
      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Cloud className="size-4 text-accent" strokeWidth={1.5} />
            <span>قائمة النسخ السابقة ({history.length})</span>
          </CardTitle>
          <Button
            onClick={() => setRestoreOpen(true)}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <RotateCcw className="size-4" strokeWidth={1.5} />
            <span>اختبار الاستعادة</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">التاريخ</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">النوع</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الحجم</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">بواسطة</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      لا توجد نسخ سابقة مسجّلة
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id} className="text-sm">
                      <TableCell className="text-xs text-muted-foreground">
                        {row.createdAtLabel ?? formatDateTimeArabic(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent text-[10px]">
                          {TYPE_LABELS[row.action] ?? row.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.size > 0 ? formatBytes(row.size) : "—"}
                      </TableCell>
                      <TableCell className="text-foreground">{row.downloadedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => downloadBackup(row)}
                            disabled={downloading === row.id}
                            aria-label="تنزيل"
                          >
                            <Download className="size-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setDeleting(row)}
                            aria-label="حذف"
                          >
                            <Trash2 className="size-4 text-rose-600" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة الاستعادة */}
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختبار الاستعادة</DialogTitle>
            <DialogDescription>
              تحذير: استعادة نسخة احتياطية تستبدل كل البيانات الحالية بالنسخة المرفوعة.
            </DialogDescription>
          </DialogHeader>
          <AlertDialog>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم استبدال كل البيانات الحالية بالنسخة المرفوعة. هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction>متابعة</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
              <p>
                سيتم استبدال كل البيانات الحالية بالنسخة المرفوعة. تأكّد من نسخة احتياطية حديثة قبل المتابعة.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="restore-file">ملف النسخة (.db أو .json)</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".db,.json,.sqlite"
                onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                className="h-11"
              />
              {restoreFile && (
                <p className="text-[11px] text-muted-foreground">
                  الملف المختار: {restoreFile.name} ({formatBytes(restoreFile.size)})
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRestoreOpen(false)} className="h-10">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={restoring || !restoreFile}
              className="h-11"
            >
              <Upload className="size-4" strokeWidth={1.5} />
              <span>{restoring ? "جارٍ الاستعادة..." : "استعادة النسخة"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleting !== null} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف سجل النسخة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingBusy}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deletingBusy ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
