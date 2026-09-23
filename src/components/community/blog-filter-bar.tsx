"use client";

// ===================================================================
//  BlogFilterBar — شريط فلترة المدوّنة
//  - بحث debounced 300ms في العنوان/المقتطف
//  - فلتر فئة (صحة، تربية، مالية، دينية، مجتمع)
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BLOG_CATEGORIES } from "@/lib/constants";

interface BlogFilterBarProps {
  total: number;
  filteredCount: number;
}

export function BlogFilterBar({ total, filteredCount }: BlogFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "ALL";

  const [searchInput, setSearchInput] = React.useState<string>(search);

  const updateUrl = React.useCallback(
    (updates: { q?: string; category?: string; page?: string }) => {
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
      // إعادة ضبط الصفحة عند تغيير الفلتر
      if (updates.q !== undefined || updates.category !== undefined) {
        searchParams.delete("page");
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
      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
        <Input
          id="blog-search"
          aria-label="بحث في المدوّنة"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث في المقالات..."
          className="h-11 ps-9"
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

      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          variant={category === "ALL" ? "default" : "outline"}
          size="sm"
          className="h-9"
        >
          <Link href="/blog">الكل</Link>
        </Button>
        {BLOG_CATEGORIES.map((c) => {
          const isActive = category === c.value;
          return (
            <Button
              key={c.value}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5"
            >
              <Link href={`/blog?category=${c.value}`}>
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          عرض{" "}
          <span className="font-medium text-foreground">{filteredCount}</span>{" "}
          من <span className="font-medium text-foreground">{total}</span> مقال
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
