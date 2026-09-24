// ===================================================================
//  صفحة دليل الحي — /guide
//  Server Component يعرض الأماكن المفيدة في الحي مصنّفة حسب الفئة
//  - بحث بالاسم
//  - فلتر فئة
//  - زر "أضف مكاناً" → /guide/add
//  - لكل عنصر: name, category badge, address, phone, rating
// ===================================================================

import Link from "next/link";
import {
  MapPin,
  Phone,
  Star,
  Plus,
  Compass,
  ChevronLeft,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { maskPhone, shouldMaskPhone } from "@/lib/privacy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EmptyState } from "@/components/shared/empty-state";
import { GuideFilterBar } from "@/components/community/guide-filter-bar";
import { GUIDE_CATEGORIES, GUIDE_CATEGORY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "دليل الحي",
  description:
    "دليل شامل لأماكن الحي المفيدة: مقاهي، مطاعم، محلات، مدارس، مراكز صحية، مساجد، خدمات، وجمعيات.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// عدد النجوم المعروض (0-5)
function renderRating(rating: number) {
  return (
    <div className="flex items-center gap-1" aria-label={`التقييم ${rating.toFixed(1)} من 5`}>
      <Star className="size-3.5 text-accent fill-accent" />
      <span className="text-xs font-medium text-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default async function GuidePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const categoryFilter =
    typeof params.category === "string" ? params.category : "ALL";

  // المستخدم الحالي (لتحديد سياسة إخفاء رقم الهاتف)
  const currentUser = await getCurrentUser();
  const hidePhone = shouldMaskPhone(currentUser?.role);

  // بناء شرط البحث
  const whereClause = {
    ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.guideItem.count(),
    db.guideItem.findMany({
      where: whereClause,
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 60,
    }),
  ]);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      {/* ─────────── الترويسة ─────────── */}
      <header className="text-center mb-6">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 mb-3"
        >
          <Compass className="size-3 ms-1.5" />
          دليل الحي
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
          دليل سيدي يوسف بن علي
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          كل ما يحتاجه سكان الحي في مكان واحد — مقاهي، مطاعم، محلات، مدارس،
          مراكز صحية، مساجد، خدمات، وجمعيات. ساهم بإضافة ما تعرفه من أماكن.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* ─────────── بطاقات الفئات السريعة ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
        {GUIDE_CATEGORIES.map((c) => {
          const isActive = categoryFilter === c.value;
          const href = isActive ? "/guide" : `/guide?category=${c.value}`;
          return (
            <Button
              key={c.value}
              asChild
              variant={isActive ? "default" : "outline"}
              className="h-16 flex-col gap-1 text-xs"
            >
              <Link href={href}>
                <span className="text-lg">{c.icon}</span>
                <span>{c.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* ─────────── شريط الفلترة ─────────── */}
      <Card className="warm-shadow border-border/60 mb-6">
        <CardContent className="p-4">
          <GuideFilterBar total={total} filteredCount={items.length} />
        </CardContent>
      </Card>

      {/* ─────────── شبكة الأماكن ─────────── */}
      {items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="لا توجد أماكن بعد"
          message="ما زال الدليل فارغاً في هذه الفئة — كن أول من يضيف مكاناً يفيد أهل الحي!"
          actionLabel="أضف مكاناً"
          actionHref="/guide/add"
          divider
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const cat = GUIDE_CATEGORIES.find((c) => c.value === item.category);
            return (
              <Card
                key={item.id}
                className="warm-shadow border-border/60 h-full transition-all hover:border-primary/30 hover:-translate-y-0.5"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid place-items-center size-10 rounded-lg bg-primary/10 text-lg shrink-0">
                        {cat?.icon ?? "📍"}
                      </span>
                      <h3 className="font-heading font-bold text-foreground text-base leading-tight truncate">
                        {item.name}
                      </h3>
                    </div>
                    {renderRating(item.rating)}
                  </div>

                  <Badge
                    variant="secondary"
                    className="bg-secondary/10 text-secondary border-secondary/20"
                  >
                    {GUIDE_CATEGORY_LABELS[item.category] ?? item.category}
                  </Badge>

                  {item.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs">
                    {item.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
                        <span className="leading-relaxed">{item.address}</span>
                      </div>
                    )}
                    {item.phone && (
                      <a
                        href={hidePhone ? undefined : `tel:${item.phone}`}
                        dir="ltr"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={
                          hidePhone
                            ? "رقم الهاتف مُخفى — الأرقام الكاملة متاحة للمشرفين فقط"
                            : `اتصل على ${item.phone}`
                        }
                      >
                        <Phone className="size-3.5 shrink-0 text-primary" />
                        <span className="font-mono">
                          {hidePhone ? maskPhone(item.phone) : item.phone}
                        </span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─────────── CTA سفلي ─────────── */}
      <div className="mt-10 text-center">
        <Button asChild variant="secondary" size="lg" className="h-12 px-6 gap-2">
          <Link href="/guide/add">
            <Plus className="size-4" />
            <span>أضف مكاناً للدليل</span>
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          مساهمتك في إثراء الدليل تساعد كل أهل الحي.
        </p>
      </div>

      {/* ─────────── رجوع ─────────── */}
      <div className="mt-8 flex justify-center">
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href="/">
            <ChevronLeft className="size-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
