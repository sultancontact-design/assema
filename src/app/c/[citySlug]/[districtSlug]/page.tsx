// ===================================================================
//  /c/[citySlug]/[districtSlug] — صفحة الحيّ ضمن مدينة
//  تعرض معلومات الحيّ + إحصاءات + زر الانضمام
// ===================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Users,
  Home as HomeIcon,
  HandHeart,
  CalendarDays,
  TrendingUp,
  Award,
  ChevronLeft,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFundStats } from "@/lib/fund-stats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { JoinDistrictButton } from "@/components/community/join-district-button";
import { formatNumber, formatMAD } from "@/lib/constants";
import type { EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ citySlug: string; districtSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { citySlug, districtSlug } = await params;
  const district = await db.district.findUnique({
    where: { slug: districtSlug },
    select: {
      name: true,
      nameAr: true,
      nameFr: true,
      city: true,
      cityId: true,
    },
  });
  if (!district) return { title: "الحي غير موجود" };
  // تأكد أن الحي تابع للمدينة المطلوبة
  const city = district.cityId
    ? await db.city.findUnique({
        where: { id: district.cityId },
        select: { slug: true, name: true, nameAr: true },
      })
    : await db.city.findUnique({
        where: { slug: citySlug },
        select: { slug: true, name: true, nameAr: true },
      });
  if (!city || city.slug !== citySlug) {
    return { title: "الحي غير موجود في هذه المدينة" };
  }
  return {
    title: `${district.nameAr ?? district.name} — ${
      city.nameAr ?? city.name
    } — سيدي يوسف بن علي العاصمة`,
    description: `حيّ ${district.nameAr ?? district.name} في ${
      city.nameAr ?? city.name
    }.`,
  };
}

export default async function CityDistrictPage({ params }: PageProps) {
  const { citySlug, districtSlug } = await params;

  // 1) جلب المدينة بالـslug
  const city = await db.city.findUnique({
    where: { slug: citySlug },
    select: {
      id: true,
      name: true,
      nameAr: true,
      nameFr: true,
      slug: true,
      region: { select: { nameAr: true, name: true, slug: true } },
    },
  });
  if (!city || !city.isActive) {
    notFound();
  }

  // 2) جلب الحيّ
  const district = await db.district.findUnique({
    where: { slug: districtSlug },
    include: {
      _count: {
        select: {
          users: { where: { deletedAt: null, status: "ACTIVE" } },
          families: { where: { deletedAt: null, isActive: true } },
          events: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (
    !district ||
    district.deletedAt ||
    !district.isActive
  ) {
    notFound();
  }

  // 3) التحقق أن الحي تابع للمدينة المطلوبة (cityId أو city field)
  const belongsToCity =
    district.cityId === city.id ||
    district.city === city.name ||
    district.city === city.nameAr;
  if (!belongsToCity) {
    notFound();
  }

  // 4) المستخدم الحالي
  const currentUser = await getCurrentUser();
  const currentDistrict = currentUser?.districtId
    ? await db.district.findUnique({
        where: { id: currentUser.districtId },
        select: { slug: true, nameAr: true, name: true },
      })
    : null;
  const isSameDistrict = currentDistrict?.slug === district.slug;

  // 5) إحصاءات الصندوق
  const fundStats = await getFundStats(district.id);

  // 6) أحدث 3 فعاليات في الحي
  const now = new Date();
  const upcomingEvents = await db.event.findMany({
    where: {
      districtId: district.id,
      deletedAt: null,
      status: { in: ["PUBLISHED", "ONGOING"] as EventStatus[] },
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

  // 7) أكثر 5 أعضاء نشاطاً
  const topMembers = await db.user.findMany({
    where: {
      districtId: district.id,
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
    },
  });

  // 8) نسبة المشاركة
  const population = district.population ?? 0;
  const participationRate =
    population > 0 ? Math.round((district.members / population) * 1000) / 10 : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="size-4" />
          الرئيسية
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href={`/c/${city.slug}`}
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          {city.nameAr ?? city.name}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {district.nameAr ?? district.name}
        </span>
      </div>

      {/* Hero */}
      <Card className="warm-shadow">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-[260px]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="size-3" />
                  {city.nameAr ?? city.name}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="size-3" />
                  {city.region?.nameAr ?? "المغرب"}
                </Badge>
                {district.isDefault && (
                  <Badge className="gap-1">
                    <Award className="size-3" />
                    الحي المركزي
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                {district.nameAr ?? district.name}
              </h1>
              {district.nameFr && (
                <p className="mt-1 text-lg text-muted-foreground" dir="ltr">
                  {district.nameFr}
                </p>
              )}
              {district.description && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/80 md:text-base">
                  {district.description}
                </p>
              )}
              {population > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  التعداد التقريبي للسكان:{" "}
                  <span className="font-semibold">
                    {formatNumber(population)} نسمة
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <JoinDistrictButton
                targetSlug={district.slug}
                targetName={district.nameAr ?? district.name}
                currentDistrictSlug={currentDistrict?.slug ?? null}
                currentDistrictName={
                  currentDistrict?.nameAr ?? currentDistrict?.name ?? null
                }
                isAuthenticated={!!currentUser}
              />
              <Button asChild variant="outline" className="min-h-11 gap-2">
                <Link href={`/c/${city.slug}`}>
                  <MapPin className="size-4" />
                  عودة للمدينة
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          {
            label: "الأعضاء النشطون",
            value: formatNumber(district._count.users),
            icon: Users,
          },
          {
            label: "الأسر",
            value: formatNumber(district._count.families),
            icon: HomeIcon,
          },
          {
            label: "المساهمات",
            value: formatNumber(district.contributions ?? 0),
            icon: HandHeart,
          },
          {
            label: "رصيد الصندوق",
            value: formatMAD(fundStats.balance),
            icon: TrendingUp,
          },
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
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {population > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                نسبة المشاركة المجتمعية
              </span>
              <span className="font-heading text-sm font-bold text-primary">
                {participationRate}%
              </span>
            </div>
            <Progress value={Math.min(participationRate, 100)} className="h-2" />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {formatNumber(district.members)} عضو من أصل{" "}
              {formatNumber(population)} نسمة
            </p>
          </CardContent>
        </Card>
      )}

      <ZelligeDivider variant="diamond" className="my-8" />

      {/* Two columns */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-4 text-primary" />
              الأعضاء الأكثر نشاطاً في الحي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {topMembers.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                لا يوجد أعضاء نشطون في هذا الحي بعد
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topMembers.map((u, idx) => (
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
              فعاليات قادمة في الحي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {upcomingEvents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                لا توجد فعاليات قادمة في هذا الحي
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
                            {new Date(e.startDate).toLocaleDateString("ar-MA", {
                              month: "short",
                            })}
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

      {!isSameDistrict && (
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="min-h-11 gap-2">
            <Link href={`/community/districts/${district.slug}`}>
              عرض صفحة الحي الكاملة
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
