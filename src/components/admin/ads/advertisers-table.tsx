"use client";

// ===================================================================
//  AdvertisersTable — جدول المعلنين (مُجمَّع من جدول Ad)
//  - بحث بالاسم/البريد
//  - إجراء سطر: عرض شيت بكل حملات المعلن + المبلغ الإجمالي
// ===================================================================

import * as React from "react";
import { Search, Eye, Megaphone, Phone, Mail, Calendar } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AD_PACKAGE_LABELS,
  AD_STATUS_LABELS,
  formatMAD,
  formatDateArabic,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AdPackage, AdStatus } from "@prisma/client";
import type { AdRow } from "@/lib/ads-utils";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdvertiserRow {
  key: string; // advertiserEmail أو advertiserName كبديل
  name: string;
  email: string | null;
  phone: string | null;
  campaignsCount: number;
  totalSpent: number;
  lastCampaignAt: string; // ISO
  ads: AdRow[];
}

interface AdvertisersTableProps {
  advertisers: AdvertiserRow[];
}

const STATUS_BADGE: Record<AdStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  PAUSED: "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  EXPIRED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  REJECTED: "border-rose-600/30 bg-rose-600/10 text-rose-700 dark:text-rose-400",
};

export function AdvertisersTable({ advertisers }: AdvertisersTableProps) {
  const [search, setSearch] = React.useState("");
  const [viewing, setViewing] = React.useState<AdvertiserRow | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return advertisers;
    return advertisers.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.phone ?? "").toLowerCase().includes(q)
    );
  }, [advertisers, search]);

  return (
    <div className="space-y-4">
      {/* بحث */}
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
            placeholder="بحث بالاسم أو البريد أو الهاتف…"
            className="h-10 ps-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} معلن
        </span>
      </div>

      {/* الجدول */}
      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-start">الاسم</TableHead>
                <TableHead className="text-start">البريد</TableHead>
                <TableHead className="text-start">الهاتف</TableHead>
                <TableHead className="text-start">عدد الحملات</TableHead>
                <TableHead className="text-start">إجمالي الإنفاق</TableHead>
                <TableHead className="text-start">آخر حملة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    لا يوجد معلنون مطابقون.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.key} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">
                      {row.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                        {row.campaignsCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatMAD(row.totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateArabic(row.lastCampaignAt)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label="عرض الحملات"
                        onClick={() => setViewing(row)}
                      >
                        <Eye className="size-4" strokeWidth={1.5} />
                      </Button>
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
          {viewing && <AdvertiserSheetContent advertiser={viewing} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ===================================================================
//  محتوى شيت المعلن
// ===================================================================

function AdvertiserSheetContent({ advertiser }: { advertiser: AdvertiserRow }) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-4">
        <SheetTitle className="text-start">{advertiser.name}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* بطاقات اتصال */}
        <div className="rounded-md border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">بيانات التواصل</p>
          {advertiser.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
              <Mail className="size-3.5" strokeWidth={1.5} />
              <span>{advertiser.email}</span>
            </div>
          )}
          {advertiser.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
              <Phone className="size-3.5" strokeWidth={1.5} />
              <span>{advertiser.phone}</span>
            </div>
          )}
        </div>

        {/* إجمالي */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">عدد الحملات</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {advertiser.campaignsCount}
            </p>
          </div>
          <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-center">
            <p className="text-[10px] uppercase text-accent">إجمالي الإنفاق</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {formatMAD(advertiser.totalSpent)}
            </p>
          </div>
        </div>

        {/* الخط الزمني للحملات */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Calendar className="size-3.5 text-accent" strokeWidth={1.5} />
            <span>الحملات ({advertiser.ads.length})</span>
          </p>
          <ul className="space-y-2">
            {advertiser.ads.map((ad) => (
              <li
                key={ad.id}
                className="rounded-md border border-border bg-card p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{ad.title}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", STATUS_BADGE[ad.status as AdStatus])}
                  >
                    {AD_STATUS_LABELS[ad.status as AdStatus]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{AD_PACKAGE_LABELS[ad.package as AdPackage].label}</span>
                  <span>{formatDateArabic(ad.startDate)}</span>
                  <span className="font-medium text-foreground">
                    {formatMAD(ad.amountPaid)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { Megaphone };
