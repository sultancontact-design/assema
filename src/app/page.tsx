// ===================================================================
//  HomePage — الصفحة الرئيسية الحيّة (v10-revive)
//  - Server component مع Suspense boundaries لتدفّق البيانات
//  - تجلب بيانات حقيقية: آخر 3 مساهمات، آخر 3 فعاليات، آخر 5 مدوّنات،
//    آخر 5 نقاشات + إحصاءات حيّة من getFundStats
//  - يعمل لكل من الزوار والمستخدمين المسجّلين
//  - لا توجد try/catch تخفي البيانات كاملة: fallback صريح
// ===================================================================

import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  Users,
  HandCoins,
  CalendarDays,
  MapPin,
  MessageSquare,
  Quote,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { getFundStats } from "@/lib/fund-stats";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { VisitorWelcome } from "@/components/community/visitor-welcome";
import { HomeHero } from "@/components/community/home-hero";
import {
  HomeLiveStats,
  HomeLiveStatsSkeleton,
} from "@/components/community/home-live-stats";
import { HomePrinciples } from "@/components/community/home-principles";
import { ActivityTicker } from "@/components/community/activity-ticker";
import { FomoBanner } from "@/components/community/fomo-banner";
import {
  StoriesCarousel,
  type StoryCard,
} from "@/components/community/stories-carousel";
import { LiveToasts } from "@/components/community/live-toasts";

// السماح بالـ ISR لمدّة 60 ثانية (آمنة للقراءة العامة)
export const revalidate = 60;
export const dynamic = "force-dynamic";

// ===================================================================
//  المبادئ الخمسة + باقات الإعلانات
// ===================================================================

const AD_PACKAGES = [
  {
    name: "برونزية",
    duration: "شهر",
    placement: "Sidebar",
    price: "300",
    popular: false,
  },
  {
    name: "فضية",
    duration: "شهر",
    placement: "Sidebar + In-feed",
    price: "600",
    popular: false,
  },
  {
    name: "ذهبية",
    duration: "شهر",
    placement: "كل الأماكن",
    price: "1,200",
    popular: true,
  },
  {
    name: "بلاتينية",
    duration: "3 أشهر",
    placement: "كل الأماكن + فعالية",
    price: "3,000",
    popular: false,
  },
];

// ===================================================================
//  Async data fetchers — كلها مع try/catch + fallback لضمان SSR
// ===================================================================

interface LiveStats {
  families: number;
  contributions: number;
  contributionsTotal: number;
  events: number;
}

async function fetchLiveStats(): Promise<LiveStats> {
  // v26.0: bypass unstable_cache (getFundStats) — use direct DB queries
  // The cached version was returning 0 during build (DB unreachable at build time)
  const results = await Promise.allSettled([
    // Direct contribution aggregate (no cache)
    db.contribution.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
      _count: true,
    }),
    db.family.count({ where: { isActive: true, deletedAt: null } }),
    db.event.count({
      where: {
        status: "PUBLISHED",
        startDate: { gte: new Date() },
        deletedAt: null,
      },
    }),
  ]);
  const contribResult = results[0].status === "fulfilled" ? results[0].value : null;
  const family = results[1].status === "fulfilled" ? results[1].value : 0;
  const event = results[2].status === "fulfilled" ? results[2].value : 0;
  const contribCount = contribResult?._count ?? 0;
  const contribTotal = Number(contribResult?._sum.amount ?? 0);
  return {
    families: family,
    contributions: contribCount,
    contributionsTotal: contribTotal,
    events: event,
  };
}

// ─────────── آخر 3 مساهمات مؤكّدة (أرقام مجهولة + المبلغ) ───────────
interface ContributionPreview {
  id: string;
  amount: number;
  month: string;
  receiptCode: string;
  method: string;
  confirmedAt: string | null;
  createdAt: string;
}

async function fetchRecentContributions(): Promise<ContributionPreview[]> {
  try {
    const rows = await db.contribution.findMany({
      where: { status: "CONFIRMED" },
      orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        amount: true,
        month: true,
        digitalReceipt: true,
        method: true,
        confirmedAt: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      month: r.month,
      // رمز مجهول: SY-XXXX (آخر 4 رموز من الإيصال الرقمي أو معرّف المساهمة)
      receiptCode: `SY-${(r.digitalReceipt ?? r.id).slice(-4).toUpperCase()}`,
      method: r.method,
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

// ─────────── آخر 3 فعاليات قادمة ───────────
interface EventPreview {
  id: string;
  title: string;
  slug: string;
  type: string;
  startDate: string;
  location: string;
}

async function fetchUpcomingEvents(): Promise<EventPreview[]> {
  try {
    const rows = await db.event.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { gte: new Date() },
        deletedAt: null,
      },
      orderBy: { startDate: "asc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        startDate: true,
        location: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      type: r.type,
      startDate: r.startDate.toISOString(),
      location: r.location,
    }));
  } catch {
    return [];
  }
}

// ─────────── آخر 5 مقالات منشورة للقصص ───────────
async function fetchBlogStories(): Promise<StoryCard[]> {
  try {
    const rows = await db.blogPost.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        category: true,
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });
    if (rows.length === 0) return PLACEHOLDER_STORIES;
    return rows.map((r) => {
      const first = r.author?.firstName?.trim() ?? "هيئة التحرير";
      const lastInitial = r.author?.lastName?.trim().charAt(0);
      const author = lastInitial ? `${first} ${lastInitial}.` : first;
      return {
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        author,
        category: r.category,
        href: `/blog/${r.slug}`,
      } as StoryCard;
    });
  } catch {
    return PLACEHOLDER_STORIES;
  }
}

// ─────────── آخر 5 نقاشات (مع عدد الردود) ───────────
interface DiscussionPreview {
  id: string;
  title: string;
  views: number;
  replies: number;
  category: string;
  authorMasked: string;
  createdAt: string;
}

async function fetchRecentDiscussions(): Promise<DiscussionPreview[]> {
  try {
    const rows = await db.discussion.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        views: true,
        category: true,
        createdAt: true,
        author: {
          select: { firstName: true, lastName: true },
        },
        replies: { select: { id: true } },
      },
    });
    return rows.map((r) => {
      const first = r.author?.firstName?.trim() ?? "جار";
      const lastInitial = r.author?.lastName?.trim().charAt(0);
      const authorMasked = lastInitial ? `${first} ${lastInitial}.` : first;
      return {
        id: r.id,
        title: r.title,
        views: r.views,
        replies: r.replies.length,
        category: r.category,
        authorMasked,
        createdAt: r.createdAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// ─────────── قصص افتراضية (عند فراغ المدوّنة) ───────────
const PLACEHOLDER_STORIES: StoryCard[] = [
  {
    id: "p1",
    title: "كيف تبدأ بمساهمة رمزية وتُحدث فرقاً؟",
    excerpt:
      "الخطوة الأولى نحو المعروف تبدأ بـ10 دراهم. اقرأ قصص من ساهموا بقدر ما يقدرون.",
    author: "هيئة التحرير",
    category: "مالية",
    href: "/blog",
  },
  {
    id: "p2",
    title: "دور المسجد في تجميع كلمة الحي",
    excerpt:
      "من منبر المسجد تتجمّع الأفراح والأتراح. تعرّف على الوظائف الستّ التي يلعبها المسجد.",
    author: "هيئة التحرير",
    category: "دينية",
    href: "/blog",
  },
  {
    id: "p3",
    title: "تربية الأبناء على العطاء: دليل عملي",
    excerpt:
      "في كل عمر مرحلة عطاء. كيف نُنشئ جيلاً يعرف معنى \"المعروف المغربي\".",
    author: "هيئة التحرير",
    category: "تربية",
    href: "/blog",
  },
  {
    id: "p4",
    title: "صحة الطفل: علامات تستدعي الاستشفاء",
    excerpt:
      "ثلاث مراحل عمرية، وتطعيمات أساسية، وعلامات خطر يجب على كل أم معرفتها.",
    author: "هيئة التحرير",
    category: "صحة",
    href: "/blog",
  },
  {
    id: "p5",
    title: "التطوع: طريق إلى السعادة",
    excerpt:
      "دراسات هارفارد، آيات قرآنية، وخبرات من حيّنا. المعروف يصنع السعادة بطريقتين.",
    author: "هيئة التحرير",
    category: "مجتمع",
    href: "/blog",
  },
];

// ===================================================================
//  Suspense-wrapped async sections
// ===================================================================

async function LiveStatsSection() {
  const stats = await fetchLiveStats();
  return (
    <HomeLiveStats
      families={stats.families}
      contributions={stats.contributions}
      contributionsTotal={stats.contributionsTotal}
      events={stats.events}
    />
  );
}

async function ContributionsSection({ isVisitor }: { isVisitor: boolean }) {
  const items = await fetchRecentContributions();
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <HandCoins className="size-6 mx-auto mb-2 text-primary opacity-60" />
        لا توجد مساهمات مؤكّدة بعد — كن أوّل من يدعم الصندوق.
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <Card
          key={c.id}
          className="relative overflow-hidden border-border warm-shadow card-glow lift-on-hover"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono bg-muted">
                {c.receiptCode}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {c.confirmedAt
                  ? formatDateArabic(new Date(c.confirmedAt))
                  : formatDateArabic(new Date(c.createdAt))}
              </span>
            </div>
            <div className="mt-3 text-2xl font-heading font-extrabold text-primary">
              {formatNumber(c.amount)}{" "}
              <span className="text-sm font-normal text-muted-foreground">د.م</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              مساهمة شهر {c.month} — مؤكّدة
            </div>
          </CardContent>
          {/* تدرّج إخفاء في الأسفل عند الزوار */}
          {isVisitor && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent">
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center">
                <span className="rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-[10px] font-medium shadow">
                  سجّل لرؤية المزيد
                </span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

async function EventsSection({ isVisitor, vertical = false }: { isVisitor: boolean; vertical?: boolean }) {
  const items = await fetchUpcomingEvents();
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <CalendarDays className="size-6 mx-auto mb-2 text-secondary opacity-60" />
        لا توجد فعاليات قادمة بعد — ترقّبوها قريباً.
      </Card>
    );
  }
  return (
    <div className={vertical ? "grid gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {items.map((e) => (
        <Card
          key={e.id}
          className="relative overflow-hidden border-border warm-shadow card-glow lift-on-hover"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-accent border-accent/30">
                {e.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDateArabic(new Date(e.startDate))}
              </span>
            </div>
            <h3 className="mt-2 font-heading font-bold text-base text-foreground line-clamp-2 leading-snug">
              <Link href={`/community/events/${e.slug}`} className="underline-animate">
                {e.title}
              </Link>
            </h3>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              <span className="truncate">{e.location}</span>
            </div>
          </CardContent>
          {isVisitor && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent">
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center">
                <span className="rounded-full bg-secondary text-secondary-foreground px-3 py-0.5 text-[10px] font-medium shadow">
                  سجّل لرؤية المزيد
                </span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

async function StoriesSection({ isVisitor }: { isVisitor: boolean }) {
  const stories = await fetchBlogStories();
  return (
    <StoriesCarousel
      stories={stories}
      isVisitor={isVisitor}
    />
  );
}

async function DiscussionsSection({ isVisitor }: { isVisitor: boolean }) {
  const items = await fetchRecentDiscussions();
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <MessageSquare className="size-6 mx-auto mb-2 text-secondary opacity-60" />
        لا توجد نقاشات في الحي بعد — ابدأ أوّل نقاش.
      </Card>
    );
  }
  return (
    <div className="relative">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden warm-shadow">
        {items.map((d) => (
          <li key={d.id}>
            <Link
              href={`/community/discussions/${d.id}`}
              className="flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors"
            >
              <span className="grid size-9 place-items-center rounded-full bg-secondary/10 text-secondary text-xs font-bold shrink-0">
                {d.authorMasked.slice(0, 1)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {d.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateArabic(new Date(d.createdAt))}
                  </span>
                </div>
                <p className="mt-1 font-heading font-bold text-foreground line-clamp-1">
                  {d.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3" />
                    {formatNumber(d.replies)} ردّ
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    {formatNumber(d.views)} مشاهدة
                  </span>
                  <span>· {d.authorMasked}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {isVisitor && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent">
          <div className="absolute inset-x-0 bottom-1 flex items-center justify-center">
            <span className="rounded-full bg-accent text-accent-foreground px-3 py-0.5 text-[10px] font-medium shadow">
              سجّل لرؤية المزيد
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  Skeleton fallbacks
// ===================================================================
function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-3 h-8 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DiscussionsSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-1 h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StoriesSkeleton() {
  return (
    <div className="overflow-hidden" aria-hidden>
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shrink-0 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)] border-0 warm-shadow">
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===================================================================
//  الصفحة الرئيسية
// ===================================================================
export default async function HomePage() {
  const user = await getCurrentUser();
  const isVisitor = !user;

  return (
    <div className="flex flex-col">
      {/* ─────────── 1. قسم البطل المتحرّك ─────────── */}
      <HomeHero />

      {/* ─────────── 2. الأرقام الحيّة (4 بطاقات) ─────────── */}
      <section
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12"
        aria-labelledby="stats-heading"
      >
        <h2 id="stats-heading" className="sr-only">
          إحصاءات حيّة
        </h2>
        <Suspense fallback={<HomeLiveStatsSkeleton />}>
          <LiveStatsSection />
        </Suspense>
      </section>

      {/* ─────────── 3. شريط النشاطات الحيّة ─────────── */}
      <section
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-4"
        aria-label="آخر نشاطات الحي"
      >
        <ActivityTicker />
      </section>

      {/* ─────────── 4. بانر الإلحاح الأخلاقي ─────────── */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <FomoBanner />
      </section>

      {/* ─────────── 5. معاينة المحتوى العمومي — Bento Grid ─────────── */}
      <section
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16"
        aria-labelledby="preview-heading"
      >
        {/* عنوان تحريري يساري (لا text-center) */}
        <div className="mb-8 max-w-3xl">
          <Badge variant="outline" className="mb-3 text-accent border-accent/30">
            نافذة على الحي
          </Badge>
          <h2
            id="preview-heading"
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3 leading-[1.1]"
          >
            ماذا يحدث في الحي؟
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            نظرة شفّافة على آخر المساهمات والفعاليات والنقاشات. سجّل دخولك
            لرؤية التفاصيل الكاملة والمشاركة.
          </p>
        </div>

        {/* Bento Grid 12-أعمدة: بطاقة كبيرة 8 أعمدة + بطاقة جانبية 4 أعمدة */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          {/* البطاقة الكبيرة: آخر المساهمات */}
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2">
              <HandCoins className="size-5 text-primary" />
              <h3 className="font-heading font-bold text-lg text-foreground">
                آخر المساهمات
              </h3>
              <Badge variant="secondary" className="ms-1" >
                مؤكّدة
              </Badge>
            </div>
            <Suspense fallback={<CardGridSkeleton />}>
              <ContributionsSection isVisitor={isVisitor} />
            </Suspense>
          </div>

          {/* البطاقة الجانبية: فعاليات قادمة */}
          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="size-5 text-secondary" />
              <h3 className="font-heading font-bold text-lg text-foreground">
                فعاليات قادمة
              </h3>
            </div>
            <Suspense fallback={<CardGridSkeleton count={2} />}>
              <EventsSection isVisitor={isVisitor} vertical />
            </Suspense>
          </div>
        </div>

        {/* صف ثاني: قصص المدوّنة (8) + نقاشات (4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2">
              <Quote className="size-5 text-accent" />
              <h3 className="font-heading font-bold text-lg text-foreground">
                من المدوّنة
              </h3>
            </div>
            <Suspense fallback={<StoriesSkeleton />}>
              <StoriesSection isVisitor={isVisitor} />
            </Suspense>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="size-5 text-secondary" />
              <h3 className="font-heading font-bold text-lg text-foreground">
                نقاشات الحي
              </h3>
            </div>
            <Suspense fallback={<DiscussionsSkeleton />}>
              <DiscussionsSection isVisitor={isVisitor} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ─────────── بانر ترحيب للزائر (فقط لغير المسجّلين) ─────────── */}
      {!user && (
        <div className="container mx-auto py-4">
          <VisitorWelcome />
        </div>
      )}

      {/* ─────────── 6. المبادئ — قائمة عمودية بتسلسل رقمي ─────────── */}
      <section
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20"
        aria-labelledby="principles-heading"
      >
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="mb-3 text-secondary border-secondary/30">
            مبادئنا الخمسة
          </Badge>
          <h2
            id="principles-heading"
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3 leading-[1.1]"
          >
            على ماذا نقف؟
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            خمس ركائز بُنيت عليها المنصة، لا نتنازل عنها في أي مرحلة.
          </p>
        </div>
        <HomePrinciples />
      </section>

      {/* ─────────── 7. باقات الإعلانات — بطاقة بارزة ─────────── */}
      <section className="bg-muted/30 border-y border-border" aria-labelledby="ads-heading">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="mb-10 max-w-3xl">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">
              للراعين والمعلنين
            </Badge>
            <h2
              id="ads-heading"
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3 leading-[1.1]"
            >
              باقات الإعلانات
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              رعِ حيّك وادعم المعروف. كل باقة تشمل موقعاً ومدة محدّدة. الأرباح
              تدعم صندوق المعروف.
            </p>
          </div>

          {/* Bento: بطاقة ذهبية بارزة (col-span-2) + 3 بطاقات أصغر */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AD_PACKAGES.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative warm-shadow card-glow lift-on-hover ${
                  pkg.popular ? "lg:col-span-2 border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 inset-x-0 mx-auto w-fit bg-primary text-primary-foreground">
                    الأكثر طلباً
                  </Badge>
                )}
                <CardContent className={`p-6 ${pkg.popular ? "text-start" : "text-start"}`}>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  <div className="my-4">
                    <span className="font-heading font-extrabold text-primary" style={{ fontSize: pkg.popular ? "clamp(2rem, 4vw, 3rem)" : "1.875rem" }}>
                      {pkg.price}
                    </span>
                    <span className="text-sm text-muted-foreground ms-1">
                      درهم
                    </span>
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <dt>المدة:</dt>
                      <dd className="text-foreground font-medium">
                        {pkg.duration}
                      </dd>
                    </div>
                    <div className="flex justify-center gap-1">
                      <dt>الأماكن:</dt>
                      <dd className="text-foreground font-medium">
                        {pkg.placement}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    asChild
                    variant={pkg.popular ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-4 h-11 press-on-active"
                  >
                    <Link href="/contact">اطلب الباقة</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── 8. دعوة للانضمام (CTA نهائي) ─────────── */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <Card className="overflow-hidden border-0 maarouf-gradient-soft text-primary-foreground">
          <CardContent className="relative p-8 md:p-12 text-center">
            {/* أنميشن الخلفية: نمط زخرفي شفّاف */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #FBF6EE 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative">
              <span
                className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-background/20 text-primary-foreground animate-pulse-glow"
                aria-hidden="true"
              >
                <CalendarDays className="size-7" />
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
                انضمّ إلى حيّك اليوم
              </h2>
              <p className="opacity-95 max-w-2xl mx-auto mb-6 leading-relaxed">
                إن كنتَ تسكن في حي سيدي يوسف بن علي بمراكش، سجّل حساباً وانضمّ
                إلى مجتمعك الرقمي. مجاناً، بشفافية، وبكرامة.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-background text-primary hover:bg-background/90 press-on-active"
                >
                  <Link href="/register">
                    <span>التسجيل المجاني</span>
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-background/40 text-primary-foreground hover:bg-background/10 hover:text-primary-foreground press-on-active"
                >
                  <Link href="/login">
                    <Lock className="size-4" />
                    <span>تسجيل الدخول</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─────────── إشعارات حيّة للزوار ─────────── */}
      <LiveToasts />
    </div>
  );
}
