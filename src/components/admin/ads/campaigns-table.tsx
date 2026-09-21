"use client";

// ===================================================================
//  CampaignsTable — جدول الحملات الإعلانية (client)
//  - بحث + فلتر الحالة + فلتر الباقة
//  - زر "حملة جديدة" → AdFormDialog (mode="create")
//  - إجراءات سطر: عرض (Sheet), تعديل (Dialog), إيقاف/تفعيل, حذف
//  - تصدير CSV (xlsx)
// ===================================================================

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Power,
  Trash2,
  Megaphone,
  Download,
  Play,
  Pause,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import {
  AD_PACKAGE_LABELS,
  AD_PLACEMENT_LABELS,
  AD_STATUS_LABELS,
  formatMAD,
  formatNumber,
  formatDateArabic,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toAdRow, type AdRow } from "@/lib/ads-utils";
import { AdFormDialog } from "./ad-form-dialog";
import type { AdPackage, AdStatus } from "@prisma/client";

// ===================================================================
//  أنواع
// ===================================================================

export interface CampaignsTableProps {
  ads: AdRow[];
}

const STATUS_BADGE_CLASS: Record<AdStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  PAUSED: "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  EXPIRED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  REJECTED: "border-rose-600/30 bg-rose-600/10 text-rose-700 dark:text-rose-400",
};

const PAGE_SIZE = 25;

// ===================================================================
//  المُكوّن
// ===================================================================

export function CampaignsTable({ ads }: CampaignsTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [packageFilter, setPackageFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(0);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdRow | null>(null);
  const [viewing, setViewing] = React.useState<AdRow | null>(null);
  const [deleting, setDeleting] = React.useState<AdRow | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // فلترة على العميل
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ads.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (packageFilter !== "ALL" && a.package !== packageFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.advertiserName} ${a.advertiserEmail ?? ""} ${a.advertiserPhone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ads, search, statusFilter, packageFilter]);

  // إعادة الترقيم عند تغيّر الفلاتر
  React.useEffect(() => setPage(0), [search, statusFilter, packageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function toggleStatus(ad: AdRow) {
    const next: AdStatus = ad.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل تحديث الحالة");
        return;
      }
      toast.success(
        next === "ACTIVE" ? "تم تفعيل الحملة" : "تم إيقاف الحملة مؤقتاً"
      );
      // تحديث محلي
      ad.status = next;
      setViewing((v) => (v && v.id === ad.id ? { ...v, status: next } : v));
      // إعادة تحميل بسيطة
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusyId(null);
    }
  }

  async function approveAd(ad: AdRow) {
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل الموافقة على الحملة");
        return;
      }
      toast.success("تمت الموافقة على الحملة وتفعيلها");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectAd(ad: AdRow) {
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", reason: "مرفوضة من قبل المشرف" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل رفض الحملة");
        return;
      }
      toast.success("تم رفض الحملة");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(ad: AdRow) {
    setBusyId(ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل حذف الحملة");
        return;
      }
      toast.success("تم حذف الحملة");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  function handleExport() {
    const rows = filtered.map((a) => ({
      "العنوان": a.title,
      "المعلن": a.advertiserName,
      "البريد": a.advertiserEmail ?? "",
      "الهاتف": a.advertiserPhone ?? "",
      "الباقة": AD_PACKAGE_LABELS[a.package as AdPackage].label,
      "المكان": AD_PLACEMENT_LABELS[a.placement] ?? a.placement,
      "تاريخ البداية": formatDateArabic(a.startDate),
      "تاريخ النهاية": formatDateArabic(a.endDate),
      "المبلغ": a.amountPaid,
      "المشاهدات": a.views,
      "النقرات": a.clicks,
      "الحالة": AD_STATUS_LABELS[a.status as AdStatus],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 28 }, { wch: 22 }, { wch: 28 }, { wch: 14 },
      { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الحملات");
    XLSX.writeFile(wb, `ads-campaigns-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("تم تصدير الحملات");
  }

  return (
    <div className="space-y-4">
      {/* أدوات الفلترة */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعنوان أو المعلن أو البريد…"
              className="h-10 ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              {(Object.keys(AD_STATUS_LABELS) as AdStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {AD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={packageFilter} onValueChange={setPackageFilter}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="الباقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الباقات</SelectItem>
              {(Object.keys(AD_PACKAGE_LABELS) as AdPackage[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {AD_PACKAGE_LABELS[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 gap-2"
            onClick={handleExport}
          >
            <Download className="size-4" strokeWidth={1.5} />
            <span>تصدير CSV</span>
          </Button>
          <Button
            className="h-10 gap-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setCreateOpen(true)}
          >
            <Megaphone className="size-4" strokeWidth={1.5} />
            <span>حملة جديدة</span>
          </Button>
        </div>
      </div>

      {/* الجدول */}
      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-start">العنوان</TableHead>
                <TableHead className="text-start">المعلن</TableHead>
                <TableHead className="text-start">الباقة</TableHead>
                <TableHead className="text-start">المكان</TableHead>
                <TableHead className="text-start">المدة</TableHead>
                <TableHead className="text-start">المبلغ</TableHead>
                <TableHead className="text-start">المشاهدات</TableHead>
                <TableHead className="text-start">النقرات</TableHead>
                <TableHead className="text-start">CTR</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    لا توجد حملات مطابقة للفلاتر المختارة.
                  </TableCell>
                </TableRow>
              ) : (
                current.map((ad) => {
                  const ctr = ad.views > 0 ? (ad.clicks / ad.views) * 100 : 0;
                  const isPaused = ad.status === "PAUSED";
                  const isActive = ad.status === "ACTIVE";
                  const isPending = ad.status === "PENDING";
                  return (
                    <TableRow key={ad.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-[200px] truncate font-medium text-foreground" title={ad.title}>
                        {ad.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ad.advertiserName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                          {AD_PACKAGE_LABELS[ad.package as AdPackage].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {AD_PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        <div>{formatDateArabic(ad.startDate)}</div>
                        <div className="text-foreground/60">إلى {formatDateArabic(ad.endDate)}</div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatMAD(ad.amountPaid)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ad.views)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ad.clicks)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ctr.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE_CLASS[ad.status as AdStatus]}>
                          {AD_STATUS_LABELS[ad.status as AdStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {(isPending) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 text-emerald-600"
                                aria-label="موافقة"
                                disabled={busyId === ad.id}
                                onClick={() => approveAd(ad)}
                              >
                                <Check className="size-4" strokeWidth={1.5} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 text-rose-600"
                                aria-label="رفض"
                                disabled={busyId === ad.id}
                                onClick={() => rejectAd(ad)}
                              >
                                <X className="size-4" strokeWidth={1.5} />
                              </Button>
                            </>
                          )}
                          {(isActive || isPaused) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9"
                              aria-label={isPaused ? "تفعيل" : "إيقاف"}
                              disabled={busyId === ad.id}
                              onClick={() => toggleStatus(ad)}
                            >
                              {isPaused ? (
                                <Play className="size-4" strokeWidth={1.5} />
                              ) : (
                                <Pause className="size-4" strokeWidth={1.5} />
                              )}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9"
                                aria-label="المزيد من الإجراءات"
                              >
                                <MoreVertical className="size-4" strokeWidth={1.5} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewing(ad)}>
                                <Eye className="size-4" strokeWidth={1.5} />
                                <span>عرض التفاصيل</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(ad)}>
                                <Pencil className="size-4" strokeWidth={1.5} />
                                <span>تعديل</span>
                              </DropdownMenuItem>
                              {ad.targetUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-4" strokeWidth={1.5} />
                                    <span>زيارة الرابط</span>
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(ad)}
                              >
                                <Trash2 className="size-4" strokeWidth={1.5} />
                                <span>حذف الحملة</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* الترقيم */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 border-t border-border p-3 text-xs text-muted-foreground">
            <span>
              عرض {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} من {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                السابق
              </Button>
              <span className="px-2">{page + 1} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* نافذة الإنشاء */}
      <AdFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* نافذة التعديل */}
      <AdFormDialog
        mode="edit"
        ad={editing ?? undefined}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />

      {/* شيت التفاصيل */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          {viewing && (
            <AdDetailSheetContent ad={viewing} />
          )}
        </SheetContent>
      </Sheet>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحملة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحملة &quot;{deleting?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleting && handleDelete(deleting)}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===================================================================
//  محتوى شيت التفاصيل
// ===================================================================

function AdDetailSheetContent({ ad }: { ad: AdRow }) {
  const [busy, setBusy] = React.useState(false);

  async function handleDownloadInvoice() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}/invoice/pdf`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "فشل توليد الفاتورة");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${ad.id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الفاتورة");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b border-border p-4">
        <SheetTitle className="text-start">{ad.title}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* بطاقات الحالة */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">الباقة</p>
            <Badge variant="outline" className="mt-1 border-accent/30 bg-accent/10 text-accent">
              {AD_PACKAGE_LABELS[ad.package as AdPackage].label}
            </Badge>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">الحالة</p>
            <Badge variant="outline" className={cn("mt-1", STATUS_BADGE_CLASS[ad.status as AdStatus])}>
              {AD_STATUS_LABELS[ad.status as AdStatus]}
            </Badge>
          </div>
        </div>

        {/* المعلن */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">بيانات المعلن</p>
          <div className="text-sm text-muted-foreground">{ad.advertiserName}</div>
          {ad.advertiserEmail && (
            <div className="text-sm text-muted-foreground">{ad.advertiserEmail}</div>
          )}
          {ad.advertiserPhone && (
            <div className="text-sm text-muted-foreground" dir="ltr">{ad.advertiserPhone}</div>
          )}
        </div>

        {/* المدة */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">مدة العرض</p>
          <div className="text-sm text-muted-foreground">من {formatDateArabic(ad.startDate)}</div>
          <div className="text-sm text-muted-foreground">إلى {formatDateArabic(ad.endDate)}</div>
        </div>

        {/* المكان + الرابط */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">المكان والرابط</p>
          <div className="text-sm text-muted-foreground">
            المكان: {AD_PLACEMENT_LABELS[ad.placement] ?? ad.placement}
          </div>
          {ad.targetUrl && (
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.5} />
              <span>زيارة الرابط</span>
            </a>
          )}
          {ad.imageUrl && (
            <div className="mt-2">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="max-h-40 w-full rounded-md border border-border object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* الأداء */}
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-semibold text-foreground">الأداء</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">المشاهدات</p>
              <p className="font-semibold text-foreground">{formatNumber(ad.views)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">النقرات</p>
              <p className="font-semibold text-foreground">{formatNumber(ad.clicks)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">CTR</p>
              <p className="font-semibold text-foreground">
                {(ad.views > 0 ? (ad.clicks / ad.views) * 100 : 0).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* المبلغ */}
        <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-accent">المبلغ المدفوع</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {formatMAD(ad.amountPaid)}
          </p>
        </div>
      </div>

      {/* تذييل بأزرار */}
      <div className="border-t border-border p-3 space-y-2">
        <Button
          variant="outline"
          className="h-11 w-full gap-2"
          disabled={busy}
          onClick={handleDownloadInvoice}
        >
          <Download className="size-4" strokeWidth={1.5} />
          <span>{busy ? "جارٍ التوليد…" : "تنزيل الفاتورة (PDF)"}</span>
        </Button>
      </div>
    </div>
  );
}

export { toAdRow };
