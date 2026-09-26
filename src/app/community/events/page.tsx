// ===================================================================
//  صفحة الفعاليات — /community/events
//  Server Component يقرأ searchParams من URL ويُرجّع فعاليات مفلترة
// ===================================================================

import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarDays,
  MapPin,
  Users as UsersIcon,
  Clock,
  CheckCircle2,
  Ticket,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatDateTimeArabic,
  formatDateArabic,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/community/page-hero";
import { EventsFilterBar } from "@/components/community/events-filter-bar";
import { AdPlacement } from "@/components/ads/ad-placement";
import type { EventType, EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// ===================================================================
//  الصفحة
// ===================================================================

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // استرجاع فلترات الـURL
  const search =
    typeof params.q === "string" ? params.q.trim() : "";
  const typeFilter =
    typeof params.type === "string" ? params.type : "ALL";
  const statusFilter =
    typeof params.status === "string" ? params.status : "ALL";

  // 1) استرجاع كل الفعاليات (PUBLISHED + ONGOING + COMPLETED)
  // مرتبة تنازلياً حسب تاريخ البداية
  const whereClause = {
    districtId: user?.districtId ?? undefined,
    status: {
      in: ["PUBLISHED", "ONGOING", "COMPLETED"] as EventStatus[],
    },
    deletedAt: null,
    ...(typeFilter !== "ALL" ? { type: typeFilter as EventType } : {}),
    ...(statusFilter !== "ALL"
      ? { status: statusFilter as EventStatus }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, events] = await Promise.all([
    db.event.count({
      where: {
        districtId: user?.districtId ?? undefined,
        status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
        deletedAt: null,
      },
    }),
    db.event.findMany({
      where: whereClause,
      orderBy: { startDate: "desc" },
      take: 50,
    }),
  ]);

  // 2) تسجيلات المستخدم (إن مسجّلاً)
  const myRegistrations = user
    ? await db.eventRegistration.findMany({
        where: { userId: user.id, status: { in: ["REGISTERED", "ATTENDED"] } },
        select: { eventId: true, status: true, ticketCode: true },
      })
    : [];
  const myRegSet = new Set(myRegistrations.map((r) => r.eventId));

  return (
    <div className="flex flex-col">
      {/* ━━━ Hero بصورة فعالية ━━━ */}
      <PageHero
        title="فعاليات الحي"
        subtitle="ملتقيات، قوافل تضامنية، أمسيات ثقافية، ومناسبات تجمع أبناء الحي على قلب رجل واحد."
        image="https://images.unsplash.com/photo-1530024015-8b8a3c9c8e3c?auto=format&fit=crop&w=1920&q=80"
        imageAlt="فعاليات الحي — ملتقيات ومناسبات"
        badge={`${total} فعالية`}
      />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* شريط الفلترة */}
        <Suspense
          fallback={
            <div className="h-12 rounded-md bg-muted/40 animate-pulse" />
          }
        >
          <EventsFilterBar total={total} filteredCount={events.length} />
        </Suspense>

        {/* بانر إعلاني علوي */}
        <aside className="flex justify-center" aria-label="مساحة إعلانية">
          <AdPlacement
            placement="sidebar-top"
            className="w-full max-w-[300px] md:max-w-[728px]"
          />
        </aside>

        {/* ━━━ Bento Grid: فعالية مميّزة (col-span-2) + شبكة صغيرة ━━━ */}
        {events.length === 0 ? (
          <Card className="border-dashed warm-shadow">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <AlertCircle className="size-8" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                لا توجد فعاليات مطابقة
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                جرّب تعديل الفلاتر أو امسحها لعرض كل الفعاليات. قد يكون
                القادم أحلى!
              </p>
              <Button asChild variant="outline" size="lg" className="h-11 mt-2">
                <Link href="/community/events">مسح الفلاتر</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.flatMap((ev, idx) => {
              const typeMeta = EVENT_TYPE_LABELS[ev.type as EventType];
              const statusMeta = EVENT_STATUS_LABELS[ev.status as EventStatus];
              const isCompleted = ev.status === "COMPLETED";
              const isOngoing = ev.status === "ONGOING";
              const isRegistered = myRegSet.has(ev.id);
              const registrationOpen = ev.isRegistrationOpen && !isCompleted && !isRegistered;
              const isFeatured = idx === 0; // أول فعالية = مميّزة

              const eventCard = (
                <Link
                  key={ev.id}
                  href={`/community/events/${ev.id}`}
                  className={`block group ${isFeatured ? "md:col-span-2 md:row-span-2" : ""}`}
                >
                  <Card className={`warm-shadow overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg h-full ${isFeatured ? "flex flex-col" : ""}`}>
                    {/* صورة الغلاف — تدرّج لوني بدون emoji */}
                    <div
                      className={`relative ${isFeatured ? "h-64 md:h-80" : "h-40"} bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 flex items-center justify-center`}
                      aria-hidden
                    >
                      <CalendarDays className={`text-foreground/40 ${isFeatured ? "size-16" : "size-10"}`} />
                      {isOngoing && (
                        <span className="absolute top-3 end-3">
                          <Badge className="bg-emerald-500 text-white border-transparent animate-pulse">
                            جارٍ الآن
                          </Badge>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="absolute top-3 end-3">
                          <Badge className="bg-slate-600 text-white border-transparent">
                            منتهي
                          </Badge>
                        </span>
                      )}
                      {isFeatured && (
                        <span className="absolute bottom-3 start-3">
                          <Badge className="bg-primary text-primary-foreground border-transparent">
                            مميّزة
                          </Badge>
                        </span>
                      )}
                    </div>

                    <CardContent className={`space-y-3 ${isFeatured ? "p-6 flex-1 flex flex-col" : "p-5 flex-1 flex flex-col"}`}>
                      {/* نوع + حالة */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <span>{typeMeta.label}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {statusMeta}
                        </span>
                      </div>

                      {/* عنوان */}
                      <h3 className={`font-heading font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors ${isFeatured ? "text-2xl md:text-3xl" : "text-lg"}`}>
                        {ev.title}
                      </h3>

                      {/* وصف */}
                      <p className={`text-muted-foreground line-clamp-2 flex-1 ${isFeatured ? "text-sm md:text-base" : "text-sm"}`}>
                        {ev.description}
                      </p>

                      {/* معلومات */}
                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                        <p className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-primary" />
                          <span>{formatDateArabic(ev.startDate)}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary" />
                          <span className="line-clamp-1">{ev.location}</span>
                        </p>
                        {ev.maxAttendees !== null && (
                          <p className="flex items-center gap-1.5">
                            <UsersIcon className="size-3.5 text-primary" />
                            <span>الحد الأقصى: {ev.maxAttendees} مشارك</span>
                          </p>
                        )}
                      </div>

                      {/* زر أو شارة */}
                      <div className="pt-2">
                        {isRegistered ? (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30 w-full justify-center py-2">
                            <CheckCircle2 className="size-4" />
                            أنت مسجّل
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground w-full justify-center py-2">
                            <Ticket className="size-4" />
                            فعالية منتهية
                          </Badge>
                        ) : registrationOpen ? (
                          <Button variant="default" size="sm" className="h-11 w-full" asChild>
                            <Link href={`/community/events/${ev.id}`}>
                              سجّل الآن
                              <ArrowLeft className="size-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-11 w-full" asChild>
                            <Link href={`/community/events/${ev.id}`}>عرض التفاصيل</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );

              // إعلان داخل التغذية بعد الفعالية الثالثة
              const inFeedAd =
                idx === 2 ? (
                  <div key={`in-feed-ad-${idx}`} className="md:col-span-1 flex justify-center">
                    <AdPlacement placement="in-feed" className="w-full max-w-[300px]" />
                  </div>
                ) : null;

              return [eventCard, inFeedAd];
            })}
          </div>
        )}

        {/* تذييل */}
        <section className="text-sm text-muted-foreground border-t border-border pt-6">
          <p className="leading-relaxed max-w-3xl">
            عن أبي هريرة رضي الله عنه أنّ النبيّ صلى الله عليه وسلم قال: «من
            نفّس عن مؤمن كربةً من كرب الدنيا، نفّس الله عنه كربةً من كرب يوم
            القيامة».
          </p>
        </section>
      </div>
    </div>
  );
}
