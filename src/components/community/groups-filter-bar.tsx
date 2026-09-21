"use client";

// ===================================================================
//  شريط فلترة المجموعات — GroupsFilterBar
//  مكوّن عميل يقرأ searchParams من الـURL ويُحدّثها عند التغيير
//  - بحث debounced 300ms في اسم/وصف المجموعة
//  - فلتر فئة (all/عائلي/تنمية/تعليم/تراث)
//  - زر مسح الفلاتر
//  - الخادم يعيد استرجاع البيانات المفلترة
// ===================================================================

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

// ===================================================================
//  خيارات الفئة — مطابقة لـDEFAULT_GROUPS في constants.ts
// ===================================================================

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "كل الفئات" },
  { value: "عائلي", label: "عائلي" },
  { value: "تنمية", label: "تنمية" },
  { value: "تعليم", label: "تعليم" },
  { value: "تراث", label: "تراث" },
];

// ===================================================================
//  الخصائص
// ===================================================================

interface GroupsFilterBarProps {
  total: number;
  filteredCount: number;
}

// ===================================================================
//  المكوّن
// ===================================================================

export function GroupsFilterBar({
  total,
  filteredCount,
}: GroupsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "ALL";

  const [searchInput, setSearchInput] = React.useState<string>(search);

  // تحديث الـURL
  const updateUrl = React.useCallback(
    (updates: { q?: string; category?: string }) => {
      const searchParams = new URLSearchParams(params.toString());
      if (updates.q !== undefined) {
        if (updates.q.trim()) searchParams.set("q", updates.q.trim());
        else searchParams.delete("q");
      }
      if (updates.category !== undefined) {
        if (updates.category !== "ALL")
          searchParams.set("category", updates.category);
        else searchParams.delete("category");
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

  const hasActiveFilters = !!(search || category !== "ALL");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        {/* بحث */}
        <div className="space-y-1.5">
          <Label htmlFor="groups-search" className="sr-only">
            بحث في المجموعات
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
            <Input
              id="groups-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في اسم المجموعة أو وصفها..."
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

        {/* فلتر الفئة */}
        <div className="space-y-1.5">
          <Label htmlFor="category-filter" className="sr-only">
            فلتر الفئة
          </Label>
          <Select
            value={category}
            onValueChange={(v) => updateUrl({ category: v })}
          >
            <SelectTrigger id="category-filter" className="h-11 min-w-[140px]">
              <Filter className="size-4 text-muted-foreground" />
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
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
          مجموعة
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
