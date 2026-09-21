"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@prisma/client";

// ===================================================================
//  شريط فلترة الفعاليات
//  - يقرأ searchParams من الـURL
//  - عند التغيير، يستخدم router.push لتحديث الـURL
//  - الخادم يعيد استرجاع البيانات المفلترة
// ===================================================================

interface EventsFilterBarProps {
  total: number;
  filteredCount: number;
}

const TYPE_VALUES = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const STATUS_OPTIONS = [
  { value: "ALL", label: "كل الحالات" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "ONGOING", label: "جارية الآن" },
  { value: "COMPLETED", label: "مكتملة" },
];

export function EventsFilterBar({ total, filteredCount }: EventsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("q") ?? "";
  const type = params.get("type") ?? "ALL";
  const status = params.get("status") ?? "ALL";

  const [searchInput, setSearchInput] = React.useState<string>(search);

  // تحديث الـURL
  const updateUrl = React.useCallback(
    (updates: { q?: string; type?: string; status?: string }) => {
      const searchParams = new URLSearchParams(params.toString());
      if (updates.q !== undefined) {
        if (updates.q.trim()) searchParams.set("q", updates.q.trim());
        else searchParams.delete("q");
      }
      if (updates.type !== undefined) {
        if (updates.type !== "ALL") searchParams.set("type", updates.type);
        else searchParams.delete("type");
      }
      if (updates.status !== undefined) {
        if (updates.status !== "ALL") searchParams.set("status", updates.status);
        else searchParams.delete("status");
      }
      const qs = searchParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router]
  );

  // debounced search
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        updateUrl({ q: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search, updateUrl]);

  const hasActiveFilters = !!(search || type !== "ALL" || status !== "ALL");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        {/* بحث */}
        <div className="space-y-1.5">
          <Label htmlFor="search" className="sr-only">
            بحث في الفعاليات
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
            <Input
              id="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في الفعاليات..."
              className="h-11 ps-9"
              aria-label="بحث"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateUrl({ q: "" });
                }}
                aria-label="مسح البحث"
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* فلتر النوع */}
        <div className="space-y-1.5">
          <Label htmlFor="type-filter" className="sr-only">
            فلتر النوع
          </Label>
          <Select
            value={type}
            onValueChange={(v) => updateUrl({ type: v })}
          >
            <SelectTrigger id="type-filter" className="h-11 min-w-[140px]">
              <Filter className="size-4 text-muted-foreground" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الأنواع</SelectItem>
              {TYPE_VALUES.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="me-1" aria-hidden>
                    {EVENT_TYPE_LABELS[t].emoji}
                  </span>
                  <span>{EVENT_TYPE_LABELS[t].label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلتر الحالة */}
        <div className="space-y-1.5">
          <Label htmlFor="status-filter" className="sr-only">
            فلتر الحالة
          </Label>
          <Select
            value={status}
            onValueChange={(v) => updateUrl({ status: v })}
          >
            <SelectTrigger id="status-filter" className="h-11 min-w-[140px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          عرض{" "}
          <span className="font-medium text-foreground">{filteredCount}</span>{" "}
          من <span className="font-medium text-foreground">{total}</span>{" "}
          فعالية
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              setSearchInput("");
              router.push(pathname);
            }}
          >
            <X className="size-4" />
            <span>مسح الفلاتر</span>
          </Button>
        )}
      </div>
    </div>
  );
}
