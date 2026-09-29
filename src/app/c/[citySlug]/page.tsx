// ===================================================================
//  /c/[citySlug] — صفحة المدينة
//  تعرض: معلومات المدينة + قائمة الأحياء + إحصاءات + أحدث المنشورات
// ===================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Users,
  Home as HomeIcon,
  HandHeart,
  TrendingUp,
  Building2,
  ChevronLeft,
  CalendarDays,
  Newspaper,
  Award,
  ArrowLeft,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { formatNumber } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { citySlug } = await params;
  const city = await db.city.findUnique({
    where: { slug: citySlug },
    select: { name: true, nameAr: true, nameFr: true, region: { select: { nameAr: true, name: true } } },
  });
  if (!city) return { title: "المدينة غير موجودة" };
  return {
    title: `${city.nameAr ?? city.name} — ${
      city.region?.nameAr ?? ""
    } — سيدي يوسف بن علي العاصمة`,
    description: `مدينة ${city.nameAr ?? city.name} في ${
      city.region?.nameAr ?? ""
    } — الأحياء والإحصاءات والمنشورات.`,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params;

  // 1) جلب المدينة بالـslug
  const city = await db.city.findUnique({
    where: { slug: citySlug },
    include: {
      region: { select: { id: true, name: true, nameAr: true, slug: true } },
      _count: {
        select: {
          districts: { where: { isActive: true, deletedAt: null } },
          users: { where: { deletedAt: null, status: "ACTIVE" } },
        },
      },
    },
  });

  if (!city || !city.isActive) {
    notFound();
  }

  // 2) جلب أحياء المدينة (مرن: cityId أو city field بنص المدينة)
  const districts = await db.district.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [{ cityId: city.id }, { city: city.name }, { city: city.nameAr ?? city.name }],
    },
    orderBy: [{ isDefault: "desc" }, { nameAr: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      nameFr: true,
      description: true,
      members: true,
      familiesCount: true,
      contributions: true,
      population: true,
      isDefault: true,
    },
    take: 50,
  });

  // 3) جلب أعلى 5 أعضاء في المدينة (حسب النقاط)
  const topUsers = await db.user.findMany({
    where: {
      OR: [{ cityId: city.id }, { district: { cityId: city.id } }],
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: { points: "desc" },
    take: 5,
    select: {
      id: true,
      fullName: true,
      points: true,
      level: true,
      profession: true,
      avatar: true,
    },
  });

  // 4) أحدث 5 منشورات في نطاق المدينة
  const recentFeedItems = await db.feedItem.findMany({
    where: { cityId: city.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      type: true,
      content: true,
      likes: true,
      comments: true,
      shares: true,
      createdAt: true,
      user: { select: { id: true, fullName: true } },
    },
  });

  // 5) أحدث 3 فعاليات في المدينة
  const now = new Date();
  const upcomingEvents = await db.event.findMany({
    where: {
      OR: [{ cityId: city.id }, { district: { cityId: city.id } }],
      deletedAt: null,
      status: { in: ["PUBLISHED", "ONGOING"] },
      startDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      startDate: true,
      location: true,
      coverImage: true,
    },
  });

  // إحصاءات مجمّعة
  const totalMembers = districts.reduce((s, d) => s + (d.members ?? 0), 0);
  const totalFamilies = districts.reduce((s, d) => s + (d.familiesCount ?? 0), 0);
  const totalContributions = districts.reduce((s, d) => s + (d.contributions ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="size-4" />
          الرئيسية
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {city.nameAr ?? city.name}
        </span>
      </div>

      {/* Hero Card */}
      <Card className="warm-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[280px]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="size-3" />
                    {city.region?.nameAr ?? city.region?.name ?? "المغرب"}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="size-3" />
                    مدينة
                  </Badge>
                  {city.isFeatured && (
                    <Badge className="gap-1">
                      <Award className="size-3" />
                      مميّزة
                    </Badge>
                  )}
                </div>
                <h1 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
                  {city.nameAr ?? city.name}
                </h1>
                {city.nameFr && (
                  <p className="mt-1 text-lg text-muted-foreground" dir="ltr">
                    {city.nameFr}
                  </p>
                )}
                {city.description && (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80 md:text-base">
                    {city.description}
                  </p>
                )}
                {city.population && city.population > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    التعداد السكاني التقريبي:{" "}
                    <span className="font-semibold">
                      {formatNumber(city.population)} نسمة
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="min-h-11 gap-2">
                  <Link href="/feed">
                    <Newspaper className="size-4" />
                    منشورات المدينة
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="min-h-11 gap-2">
                  <Link href="/community/members">
                    <Users className="size-4" />
                    تصفّح الأعضاء
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "الأحياء", value: districts.length, icon: Building2 },
          { label: "الأعضاء", value: totalMembers, icon: Users },
          { label: "الأسر", value: totalFamilies, icon: HomeIcon },
          { label: "المساهمات", value: totalContributions, icon: HandHeart },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-xl font-bold text-foreground md:text-2xl">
                    {formatNumber(stat.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <ZelligeDivider variant="diamond" className="my-8" />

      {/* Districts */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            أحياء {city.nameAr ?? city.name}
          </h2>
          <Badge variant="outline">{districts.length} حي</Badge>
        </div>

        {districts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 font-medium text-foreground">
                لا توجد أحياء مسجّلة في {city.nameAr ?? city.name} بعد
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                انضم كأول عضو في هذه المدينة
              </p>
              <Button asChild className="mt-4 min-h-11">
                <Link href="/register">سجّل الآن</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {districts.map((d) => (
              <Link
                key={d.id}
                href={`/c/${city.slug}/${d.slug}`}
                className="block"
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-heading text-lg font-bold text-foreground">
                          {d.nameAr ?? d.name}
                        </h3>
                        {d.nameFr && (
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {d.nameFr}
                          </p>
                        )}
                      </div>
                      {d.isDefault && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Award className="size-3" />
                          مركزي
                        </Badge>
                      )}
                    </div>
                    {d.description && (
                      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                        {d.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {formatNumber(d.members ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HomeIcon className="size-3" />
                        {formatNumber(d.familiesCount ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HandHeart className="size-3" />
                        {formatNumber(d.contributions ?? 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Two-column: Top members + Upcoming events */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-4 text-primary" />
              الأعضاء الأكثر نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {topUsers.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                لا يوجد أعضاء نشطون في {city.nameAr ?? city.name} بعد
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topUsers.map((u, idx) => (
                  <li key={u.id}>
                    <Link
                      href={`/u/${u.id}`}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-accent/5 transition-colors"
                    >
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <Avatar className="size-9">
                        <AvatarFallback>
                          {u.fullName.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {u.fullName}
                        </p>
                        {u.profession && (
                          <p className="truncate text-xs text-muted-foreground">
                            {u.profession}
                          </p>
                        )}
                      </div>
                      <div className="text-end">
                        <p className="font-heading text-sm font-bold text-primary">
                          {formatNumber(u.points)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          نقطة · مستوى {u.level}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-4 text-primary" />
              فعاليات قادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {upcomingEvents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                لا توجد فعاليات قادمة في {city.nameAr ?? city.name}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/community/events/${e.id}`}
                      className="block rounded-lg p-3 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-[10px] leading-none">
                            {new Date(e.startDate).toLocaleDateString(
                              "ar-MA",
                              { month: "short" }
                            )}
                          </span>
                          <span className="font-heading text-base font-bold leading-none">
                            {new Date(e.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {e.title}
                          </p>
                          {e.location && (
                            <p className="truncate text-xs text-muted-foreground">
                              {e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent feed */}
      {recentFeedItems.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              آخر منشورات المدينة
            </h2>
            <Button asChild variant="ghost" className="min-h-11 gap-2">
              <Link href="/feed">
                عرض الكل
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentFeedItems.map((item) => (
              <Link key={item.id} href="/feed" className="block">
                <Card className="h-full transition-all hover:border-primary/40">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {item.type}
                      </Badge>
                      <span>·</span>
                      <span>{item.user?.fullName ?? "مستخدم"}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground">
                      {item.content || "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>إعجابات: {item.likes}</span>
                      <span>تعليقات: {item.comments}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex justify-center">
        <Button asChild variant="outline" className="min-h-11 gap-2">
          <Link href="/">
            العودة للرئيسية
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
