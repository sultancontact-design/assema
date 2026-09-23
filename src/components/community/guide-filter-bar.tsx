"use client";

// ===================================================================
//  GuideFilterBar — شريط فلترة دليل الحي
//  - بحث debounced 300ms في اسم المكان/وصفه
//  - فلتر فئة (مقاهي، مطاعم، محلات، مدارس، مراكز صحية، مساجد، خدمات، جمعيات)
//  - زر "أضف مكاناً" → /guide/add
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, X, Plus } from "lucide-react";
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
import { GUIDE_CATEGORIES } from "@/lib/constants";

interface GuideFilterBarProps {
  total: number;
  filteredCount: number;
}

export function GuideFilterBar({ total, filteredCount }: GuideFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "ALL";

  const [searchInput, setSearchInput] = React.useState<string>(search);

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="guide-search" className="sr-only">
            بحث في دليل الحي
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
            <Input
              id="guide-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في اسم المكان أو وصفه..."
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

        <div className="space-y-1.5">
          <Label htmlFor="category-filter" className="sr-only">
            فلتر الفئة
          </Label>
          <Select
            value={category}
            onValueChange={(v) => updateUrl({ category: v })}
          >
            <SelectTrigger id="category-filter" className="h-11 min-w-[160px]">
              <Filter className="size-4 text-muted-foreground" />
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الأماكن</SelectItem>
              {GUIDE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button asChild variant="default" className="h-11 gap-1.5">
          <Link href="/guide/add">
            <Plus className="size-4" />
            <span className="hidden sm:inline">أضف مكاناً</span>
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          عرض{" "}
          <span className="font-medium text-foreground">{filteredCount}</span>{" "}
          من <span className="font-medium text-foreground">{total}</span> مكان
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
