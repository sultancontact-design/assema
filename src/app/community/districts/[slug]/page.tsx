// ===================================================================
//  صفحة تفاصيل الحيّ — /community/districts/[slug]
//  Server Component — عرض شامل لحيّ محدّد:
//  - اسم الحيّ (عربي + فرنسي) + وصف
//  - إحصاءات: أعضاء + أسر + مساهمات + سكان + رصيد الصندوق
//  - خريطة مصغّرة تُبرز الحيّ
//  - أحدث 3 فعاليات قادمة في الحيّ
//  - أكثر 5 أعضاء نشاطاً (النقاط) — أسماء عامّة فقط
//  - زر "انضمام لهذا الحي" (لو الحي مختلف عن حيّ المستخدم)
//  - ZelligeDivider بين الأقسام
// ===================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Home as HomeIcon,
  HandHeart,
  MapPin,
  CalendarDays,
  TrendingUp,
  Award,
  ChevronLeft,
  ArrowRight,
  Wallet,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { maskPhone, shouldMaskPhone } from "@/lib/privacy";
import { getFundStats } from "@/lib/fund-stats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  MarrakechMap,
  type MarrakechDistrictDatum,
} from "@/components/community/marrakech-map";
import { JoinDistrictButton } from "@/components/community/join-district-button";
import {
  formatMAD,
  formatNumber,
  formatDateArabic,
  EVENT_TYPE_LABELS,
} from "@/lib/constants";
import type { EventType, EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const district = await db.district.findUnique({
    where: { slug },
    select: { nameAr: true, nameFr: true, name: true, city: true },
  });
  if (!district) {
    return { title: "الحي غير موجود" };
  }
  return {
    title: `${district.nameAr ?? district.name} — ${
      district.nameFr ?? district.name
    } — سيدي يوسف بن علي العاصمة`,
    description: `حيّ ${district.nameAr ?? district.name} (${
      district.nameFr ?? ""
    }) في ${district.city}.`,
  };
}

export default async function DistrictDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1) جلب الحيّ بالـslug
  const district = await db.district.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          users: { where: { deletedAt: null, status: "ACTIVE" } },
          families: { where: { deletedAt: null, isActive: true } },
          events: { where: { deletedAt: null } },
          groups: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!district || district.deletedAt || !district.isActive) {
    notFound();
  }

  // 2) المستخدم الحالي (إن وُجد)
  const currentUser = await getCurrentUser();
  const currentDistrict = currentUser?.districtId
    ? await db.district.findUnique({
        where: { id: currentUser.districtId },
        select: { slug: true, nameAr: true, nameFr: true, name: true },
      })
    : null;
  const isSameDistrict = currentDistrict?.slug === district.slug;

  // 3) إحصاءات حيّة لهذا الحيّ
  const fundStats = await getFundStats(district.id);

  // 4) أحدث 3 فعاليات قادمة في هذا الحيّ
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
      endDate: true,
      location: true,
      coverImage: true,
      maxAttendees: true,
      isRegistrationOpen: true,
      _count: {
        select: { registrations: true },
      },
    },
  });

  // 5) أكثر 5 أعضاء نشاطاً في الحيّ (حسب النقاط) — أسماء عامّة فقط
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
      phone: true,
    },
  });

  // تحديد سياسة إخفاء الهاتف بناءً على دور المستخدم الحالي
  const hidePhone = shouldMaskPhone(currentUser?.role);

  // 6) كل أحياء مراكش للخريطة المصغّرة (نُبرز هذا الحيّ)
  const allDistricts = await db.district.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      slug: true,
      name: true,
      nameAr: true,
      nameFr: true,
      members: true,
      familiesCount: true,
      contributions: true,
      population: true,
      boundarySvg: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const marrakechData: MarrakechDistrictDatum[] = allDistricts.map((d) => ({
    slug: d.slug,
    nameAr: d.nameAr ?? d.name,
    nameFr: d.nameFr ?? d.name,
    members: d.members,
    familiesCount: d.familiesCount,
    contributions: d.contributions,
    population: d.population,
    boundarySvg: d.boundarySvg ?? defaultBoundary(d.slug),
  }));

  // 7) نسب المشاركة
  const population = district.population ?? 0;
  const participationRate =
    population > 0 ? Math.round((district.members / population) * 1000) / 10 : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      {/* رأس الصفحة */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link
          href="/community/map"
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="size-4" />
          خريطة الأحياء
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {district.nameAr ?? district.name}
        </span>
      </div>

      {/* بطاقة العنوان */}
      <Card className="warm-shadow">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-[260px]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="size-3" />
                  {district.city}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="size-3" />
                  {district.region}
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
                <Link href="/community/map">
                  <MapPin className="size-4" />
                  عودة للخريطة
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصاءات الحيّ */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="الأعضاء النشطون"
          value={formatNumber(district.members)}
          icon={<Users className="size-5 text-primary" />}
          tone="primary"
        />
        <StatCard
          label="الأسر"
          value={formatNumber(district.familiesCount)}
          icon={<HomeIcon className="size-5 text-secondary" />}
          tone="secondary"
        />
        <StatCard
          label="إجمالي المساهمات"
          value={formatMAD(district.contributions)}
          icon={<HandHeart className="size-5 text-accent" />}
          tone="accent"
        />
        <StatCard
          label="رصيد الصندوق"
          value={formatMAD(fundStats.balance)}
          icon={<Wallet className="size-5 text-primary" />}
          tone="primary"
        />
      </section>

      {/* نسبة المشاركة + إحصاءات حيّة */}
      <Card className="mt-3 warm-shadow">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                نسبة المشاركة (من السكان)
              </p>
              <p className="font-heading text-xl font-bold text-primary">
                {participationRate}%
              </p>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Progress value={Math.min(100, participationRate)} className="h-2.5" />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {district.members} عضو من أصل {formatNumber(population)} نسمة
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">
                فعالية قادمة في الحيّ
              </p>
              <p className="font-heading text-xl font-bold text-secondary">
                {formatNumber(upcomingEvents.length)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ZelligeDivider variant="diamond" className="my-8" />

      {/* الخريطة المصغّرة + الأعضاء الأكثر نشاطاً */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-5 text-primary" />
              موقع الحيّ على خريطة مراكش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarrakechMap
              districts={marrakechData}
              highlightSlug={district.slug}
              className="mx-auto"
            />
          </CardContent>
        </Card>

        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="size-5 text-accent" />
              أكثر الأعضاء نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMembers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا يوجد أعضاء في هذا الحيّ بعد — كن أوّل من ينضمّ!
              </p>
            ) : (
              <ul className="space-y-2">
                {topMembers.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/40 p-2"
                  >
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-accent text-accent-foreground"
                          : i === 1
                            ? "bg-primary/80 text-primary-foreground"
                            : i === 2
                              ? "bg-secondary/80 text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {m.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.profession ?? "عضو"} · مستوى {m.level}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-heading text-sm font-bold text-accent">
                        {formatNumber(m.points)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        نقطة
                      </p>
                      {m.phone && (
                        <p
                          className="mt-1 text-[10px] text-muted-foreground font-mono"
                          dir="ltr"
                        >
                          {hidePhone ? maskPhone(m.phone) : m.phone}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[10px] text-muted-foreground">
              تُعرض الأسماء العامّة فقط — لا بيانات حسّاسة.
              {hidePhone
                ? " أرقام الهواتف مُخفاة (06XX-XX-XX-XX) للمشرفين فقط."
                : " أنت مشرف — تُظهر الأرقام كاملة."}
            </p>
          </CardContent>
        </Card>
      </div>

      <ZelligeDivider variant="stars" className="my-8" />

      {/* الفعاليات القادمة */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
            فعاليات قادمة في {district.nameAr ?? district.name}
          </h2>
          <Button asChild variant="ghost" size="sm" className="min-h-11 gap-1">
            <Link href="/community/events">
              كل الفعاليات
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card className="warm-shadow">
            <CardContent className="p-8 text-center">
              <CalendarDays className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                لا توجد فعاليات قادمة في هذا الحيّ حالياً.
              </p>
              <Button asChild className="mt-4 min-h-11">
                <Link href="/community/events">تصفّح كل الفعاليات</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingEvents.map((event) => {
              const typeInfo = EVENT_TYPE_LABELS[event.type as EventType];
              const seatsFilled = event._count.registrations;
              const seatsTotal = event.maxAttendees ?? 0;
              const fillPct =
                seatsTotal > 0
                  ? Math.min(100, (seatsFilled / seatsTotal) * 100)
                  : 0;
              return (
                <Card
                  key={event.id}
                  className="warm-shadow overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {typeInfo?.emoji} {typeInfo?.label}
                      </Badge>
                      {event.isRegistrationOpen && (
                        <Badge variant="secondary" className="text-[10px]">
                          التسجيل مفتوح
                        </Badge>
                      )}
                    </div>
                    <Link
                      href={`/community/events/${event.id}`}
                      className="block"
                    >
                      <h3 className="font-heading text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </Link>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {formatDateArabic(event.startDate)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {event.location}
                      </p>
                    </div>
                    {seatsTotal > 0 && (
                      <div className="mt-3">
                        <Progress value={fillPct} className="h-1.5" />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {seatsFilled} / {seatsTotal} مسجَّل
                        </p>
                      </div>
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="mt-3 min-h-11 w-full gap-1.5"
                    >
                      <Link href={`/community/events/${event.id}`}>
                        <TrendingUp className="size-3.5" />
                        تفاصيل الفعالية
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA سفلي */}
      {!isSameDistrict && (
        <Card className="mt-8 warm-shadow border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-heading text-lg font-bold text-foreground">
              هل أنت من سكان {district.nameAr ?? district.name}؟
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              انضمّ إلى حيّك لمتابعة آخر الأخبار والفعاليات والمساهمات.
            </p>
            <div className="mt-4 flex justify-center">
              <JoinDistrictButton
                targetSlug={district.slug}
                targetName={district.nameAr ?? district.name}
                currentDistrictSlug={currentDistrict?.slug ?? null}
                currentDistrictName={
                  currentDistrict?.nameAr ?? currentDistrict?.name ?? null
                }
                isAuthenticated={!!currentUser}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

// -------------------------------------------------------------------
//  مكوّن إحصائية مصغّرة
// -------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "primary" | "secondary" | "accent";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "secondary"
        ? "text-secondary"
        : "text-accent";
  return (
    <Card className="warm-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-muted/60 p-1.5">{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-muted-foreground">
              {label}
            </p>
            <p className={`font-heading text-lg font-bold ${color}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** boundarySvg افتراضي لو لم يُعترَض في DB */
function defaultBoundary(slug: string): string {
  const map: Record<string, string> = {
    "sidi-youssef-ben-ali":
      "M 200 290 L 290 260 L 370 300 L 340 380 L 220 375 L 180 330 Z",
    medina: "M 160 130 L 270 130 L 290 200 L 250 250 L 170 250 L 140 200 Z",
    guelize: "M 30 30 L 170 40 L 180 160 L 90 170 L 30 110 Z",
    menara: "M 30 210 L 150 200 L 200 290 L 180 360 L 60 350 L 30 280 Z",
    annakhil: "M 290 90 L 380 100 L 390 240 L 300 250 L 280 170 Z",
  };
  return map[slug] ?? "M 0 0 L 100 0 L 100 100 L 0 100 Z";
}
