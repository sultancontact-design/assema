"use client";

// ===================================================================
//  InvoicesTable — جدول الفواتير (يُولَّد آلياً من Ad)
//  - فلتر الحالة (مدفوعة / قيد السداد / الكل)
//  - بحث برقم الفاتورة أو اسم المعلن
//  - إجراء: عرض الفاتورة (Sheet) + تنزيل PDF
// ===================================================================

import * as React from "react";
import { Search, Eye, Download, FileText, Filter } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AD_PACKAGE_LABELS,
  AD_PLACEMENT_LABELS,
  formatMAD,
  formatDateArabic,
} from "@/lib/constants";
import { generateInvoiceNumber, type AdRow } from "@/lib/ads-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdPackage } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface InvoiceRow {
  ad: AdRow;
  invoiceNumber: string;
  isPaid: boolean;
}

interface InvoicesTableProps {
  invoices: InvoiceRow[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [viewing, setViewing] = React.useState<InvoiceRow | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter === "PAID" && !inv.isPaid) return false;
      if (statusFilter === "PENDING" && inv.isPaid) return false;
      if (q) {
        const hay = `${inv.invoiceNumber} ${inv.ad.title} ${inv.ad.advertiserName} ${inv.ad.advertiserEmail ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  async function handleDownload(inv: InvoiceRow) {
    setDownloadingId(inv.ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${inv.ad.id}/invoice`, {
        method: "GET",
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
      a.download = `${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الفاتورة");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* أدوات */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الفاتورة أو اسم المعلن…"
            className="h-10 ps-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" strokeWidth={1.5} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الفواتير</SelectItem>
              <SelectItem value="PAID">مدفوعة</SelectItem>
              <SelectItem value="PENDING">قيد السداد</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* الجدول */}
      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-start">رقم الفاتورة</TableHead>
                <TableHead className="text-start">الحملة</TableHead>
                <TableHead className="text-start">المعلن</TableHead>
                <TableHead className="text-start">الباقة</TableHead>
                <TableHead className="text-start">التاريخ</TableHead>
                <TableHead className="text-start">المبلغ</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    لا توجد فواتير مطابقة.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.ad.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[12px] font-medium text-foreground" dir="ltr">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {inv.ad.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.ad.advertiserName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                        {AD_PACKAGE_LABELS[inv.ad.package as AdPackage].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateArabic(inv.ad.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatMAD(inv.ad.amountPaid)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          inv.isPaid
                            ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {inv.isPaid ? "مدفوعة" : "قيد السداد"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          aria-label="عرض"
                          onClick={() => setViewing(inv)}
                        >
                          <Eye className="size-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-accent"
                          aria-label="تنزيل PDF"
                          disabled={downloadingId === inv.ad.id}
                          onClick={() => handleDownload(inv)}
                        >
                          <Download className="size-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* شيت تفصيلي */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          {viewing && (
            <InvoiceSheetContent
              invoice={viewing}
              onDownload={() => handleDownload(viewing)}
              downloading={downloadingId === viewing.ad.id}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ===================================================================
//  شيت الفاتورة
// ===================================================================

function InvoiceSheetContent({
  invoice,
  onDownload,
  downloading,
}: {
  invoice: InvoiceRow;
  onDownload: () => void;
  downloading: boolean;
}) {
  const { ad, invoiceNumber, isPaid } = invoice;
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-4">
        <SheetTitle className="text-start font-mono" dir="ltr">
          {invoiceNumber}
        </SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* الحالة */}
        <div className="rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              الحالة
            </span>
            <Badge
              variant="outline"
              className={cn(
                isPaid
                  ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}
            >
              {isPaid ? "مدفوعة" : "قيد السداد"}
            </Badge>
          </div>
        </div>

        {/* المعلن */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">بيانات المعلن</p>
          <div className="text-sm text-foreground">{ad.advertiserName}</div>
          {ad.advertiserEmail && (
            <div className="text-sm text-muted-foreground" dir="ltr">{ad.advertiserEmail}</div>
          )}
          {ad.advertiserPhone && (
            <div className="text-sm text-muted-foreground" dir="ltr">{ad.advertiserPhone}</div>
          )}
        </div>

        {/* تفاصيل الحملة */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">تفاصيل الحملة</p>
          <div className="text-sm font-medium text-foreground">{ad.title}</div>
          <div className="text-[12px] text-muted-foreground">
            الباقة: {AD_PACKAGE_LABELS[ad.package as AdPackage].label}
          </div>
          <div className="text-[12px] text-muted-foreground">
            المكان: {AD_PLACEMENT_LABELS[ad.placement] ?? ad.placement}
          </div>
          <div className="text-[12px] text-muted-foreground">
            من {formatDateArabic(ad.startDate)} إلى {formatDateArabic(ad.endDate)}
          </div>
        </div>

        {/* الإجمالي */}
        <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-accent">المبلغ الإجمالي</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {formatMAD(ad.amountPaid)}
          </p>
        </div>

        {/* التاريخ */}
        <div className="rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            تاريخ الإصدار
          </p>
          <p className="text-sm text-foreground">{formatDateArabic(ad.createdAt)}</p>
        </div>
      </div>

      {/* تذييل */}
      <div className="border-t border-border p-3">
        <Button
          variant="outline"
          className="h-11 w-full gap-2"
          disabled={downloading}
          onClick={onDownload}
        >
          {downloading ? "جارٍ التوليد…" : (
            <>
              <FileText className="size-4" strokeWidth={1.5} />
              <span>تنزيل PDF عربي</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export { generateInvoiceNumber };
