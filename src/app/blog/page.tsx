// ===================================================================
//  صفحة المدوّنة — /blog
//  Server Component يعرض قائمة المقالات من جدول BlogPost
//  - بحث في العنوان/المقتطف
//  - فلتر فئة
//  - كل مقال: title, excerpt, category badge, date, author
//  - ترقيم (10 مقالات لكل صفحة)
// ===================================================================

import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Eye,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EmptyState } from "@/components/shared/empty-state";
import { BlogFilterBar } from "@/components/community/blog-filter-bar";
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, formatDateArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "نصائح ومقالات",
  description:
    "مقالات توعوية في الصحة، التربية، المالية، الدين، والمجتمع — لحياة مغربية أفضل في الحي.",
};

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const categoryFilter =
    typeof params.category === "string" ? params.category : "ALL";
  const pageParam = Array.isArray(params.page)
    ? params.page[0]
    : params.page;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // بناء شرط البحث
  const whereClause = {
    status: "published",
    ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, posts] = await Promise.all([
    db.blogPost.count({ where: whereClause }),
    db.blogPost.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: {
          select: { fullName: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* ─────────── الترويسة ─────────── */}
      <header className="text-center mb-8">
        <Badge
          variant="secondary"
          className="bg-secondary/10 text-secondary border-secondary/20 mb-3"
        >
          <BookOpen className="size-3 ms-1.5" />
          نصائح ومقالات
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground mb-2">
          مدوّنة الحي
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          مقالات توعوية في الصحة والتربية والمالية والدين والمجتمع —
          معارف عملية لحياة مغربية أفضل في الحي.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* ─────────── شريط الفلترة ─────────── */}
      <Card className="warm-shadow border-border/60 mb-6">
        <CardContent className="p-4">
          <BlogFilterBar total={total} filteredCount={posts.length} />
        </CardContent>
      </Card>

      {/* ─────────── شبكة المقالات ─────────── */}
      {posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لا توجد مقالات بعد"
          message="ما زلنا نعمل على مقالات توعوية لهذا القسم. عُد قريباً، أو ساهم بمقال إذا كنت كاتباً أو خبيراً."
          divider
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((post) => {
            const cat = BLOG_CATEGORIES.find((c) => c.value === post.category);
            return (
              <Card
                key={post.id}
                className="warm-shadow border-border/60 h-full overflow-hidden flex flex-col transition-all hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div
                  className={`h-32 grid place-items-center bg-gradient-to-br ${
                    post.category === "HEALTH"
                      ? "from-primary/15 to-accent/10"
                      : post.category === "FINANCE"
                      ? "from-accent/15 to-secondary/10"
                      : post.category === "RELIGIOUS"
                      ? "from-secondary/15 to-primary/10"
                      : post.category === "PARENTING"
                      ? "from-primary/15 to-secondary/10"
                      : post.category === "EDUCATION"
                      ? "from-secondary/15 to-accent/10"
                      : "from-accent/15 to-primary/10"
                  }`}
                >
                  <span className="text-5xl opacity-30">{cat?.icon ?? "📝"}</span>
                </div>
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      {post.views} قراءة
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground leading-tight">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="size-3.5" />
                      {post.author?.fullName ?? "كاتب المنصة"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDateArabic(post.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─────────── الترقيم ─────────── */}
      {totalPages > 1 && (
        <nav
          aria-label="ترقيم المدوّنة"
          className="flex items-center justify-center gap-2 mt-8"
        >
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 gap-1.5"
            aria-disabled={safePage <= 1}
            aria-label="الصفحة السابقة"
          >
            <Link
              href={`/blog?${buildPageUrl(safePage - 1, search, categoryFilter)}`}
              className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <ChevronRight className="size-4" />
              <span>السابق</span>
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              // عرض الصفحات الحالية ±2
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
              const pageNum = start + idx;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  asChild
                  variant={pageNum === safePage ? "default" : "outline"}
                  size="icon"
                  className="size-10"
                  aria-label={`الصفحة ${pageNum}`}
                  aria-current={pageNum === safePage ? "page" : undefined}
                >
                  <Link
                    href={`/blog?${buildPageUrl(pageNum, search, categoryFilter)}`}
                  >
                    <span>{pageNum}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 gap-1.5"
            aria-disabled={safePage >= totalPages}
            aria-label="الصفحة التالية"
          >
            <Link
              href={`/blog?${buildPageUrl(safePage + 1, search, categoryFilter)}`}
              className={
                safePage >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              <span>التالي</span>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        </nav>
      )}
    </section>
  );
}

// ─────────── مساعد لبناء URL الصفحة ───────────
function buildPageUrl(page: number, search: string, category: string): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (category !== "ALL") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}
