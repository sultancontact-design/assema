// ===================================================================
//  صفحة المدوّنة — /blog  (v37.0: Hero + Bento)
//  - PageHero بصورة + عنوان display
//  - Bento Grid: مقال مميّز (col-span-2 row-span-2) + 6 صغيرة
//  - لا emoji — استبدلنا cat.icon بأيقونات Lucide
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
  Heart,
  GraduationCap,
  Wallet,
  Users,
  Sparkles,
  LayoutGrid,
  ArrowLeft,
  PenLine,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/community/page-hero";
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

// أيقونات Lucide لكل فئة (بديل emoji)
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HEALTH: Heart,
  FINANCE: Wallet,
  RELIGIOUS: Sparkles,
  PARENTING: Users,
  EDUCATION: GraduationCap,
  COMMUNITY: Users,
  default: BookOpen,
};

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
    <div className="flex flex-col">
      {/* ━━━ Hero بصورة + عنوان display ━━━ */}
      <PageHero
        title="مدوّنة الحي"
        subtitle="مقالات توعوية في الصحة والتربية والمالية والدين والمجتمع — معارف عملية لحياة مغربية أفضل في الحي."
        image="https://images.unsplash.com/photo-1481627834876-b7833e8f557d?auto=format&fit=crop&w=1920&q=80"
        imageAlt="مدوّنة الحي — مقالات توعوية"
        badge={`${total} مقالة`}
      />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* شريط الفلترة + زر كتابة مقال */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Card className="warm-shadow border-border/60 flex-1">
            <CardContent className="p-4">
              <BlogFilterBar total={total} filteredCount={posts.length} />
            </CardContent>
          </Card>
          <Button asChild size="lg" className="h-auto">
            <Link href="/community/blog/new">
              <PenLine className="size-4" />
              اكتب مقالاً
            </Link>
          </Button>
        </div>

        {/* ━━━ Bento Grid: مقال مميّز + 6 صغيرة ━━━ */}
        {posts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد مقالات بعد"
            message="ما زلنا نعمل على مقالات توعوية لهذا القسم. ساهم بمقال إذا كنت كاتباً أو خبيراً."
            divider
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {posts.map((post, idx) => {
              const cat = BLOG_CATEGORIES.find((c) => c.value === post.category);
              const Icon = CATEGORY_ICONS[post.category] ?? BookOpen;
              const isFeatured = idx === 0;
              const catLabel = BLOG_CATEGORY_LABELS[post.category] ?? post.category;
              const catGradient =
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
                  : "from-accent/15 to-primary/10";

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`block group ${isFeatured ? "md:col-span-2 md:row-span-2" : ""}`}
                >
                  <Card
                    className={`warm-shadow border-border/60 h-full overflow-hidden flex flex-col transition-all hover:border-primary/40 hover:shadow-lg ${
                      isFeatured ? "flex-row md:flex-col" : ""
                    }`}
                  >
                    {/* صورة الغلاف — تدرّج + أيقونة Lucide (بدون emoji) */}
                    <div
                      className={`relative ${isFeatured ? "h-64 md:h-72 md:flex-1" : "h-24"} grid place-items-center bg-gradient-to-br ${catGradient}`}
                      aria-hidden
                    >
                      <Icon className={`text-foreground/40 ${isFeatured ? "size-20" : "size-10"}`} />
                      {isFeatured && (
                        <span className="absolute top-3 end-3">
                          <Badge className="bg-primary text-primary-foreground border-transparent">
                            مميّز
                          </Badge>
                        </span>
                      )}
                    </div>

                    <CardContent className={`space-y-2 flex-1 flex flex-col ${isFeatured ? "p-6" : "p-4"}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-xs"
                        >
                          {catLabel}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {post.views} قراءة
                        </span>
                      </div>
                      <h3 className={`font-heading font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 ${isFeatured ? "text-2xl md:text-3xl" : "text-base"}`}>
                        {post.title}
                      </h3>
                      <p className={`text-muted-foreground leading-relaxed line-clamp-2 flex-1 ${isFeatured ? "text-sm md:text-base" : "text-xs"}`}>
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/60">
                        <span className="flex items-center gap-1.5 truncate">
                          <User className="size-3.5" />
                          {post.author?.fullName ?? "كاتب المنصة"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          {formatDateArabic(post.createdAt)}
                        </span>
                      </div>
                      {isFeatured && (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                            اقرأ المقال
                            <ArrowLeft className="size-4" />
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* ━━━ الترقيم ━━━ */}
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
                    <Link href={`/blog?${buildPageUrl(pageNum, search, categoryFilter)}`}>
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
                className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
              >
                <span>التالي</span>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
          </nav>
        )}
      </div>
    </div>
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
