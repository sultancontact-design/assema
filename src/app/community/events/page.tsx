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
  ChevronLeft,
  CheckCircle2,
  Ticket,
  AlertCircle,
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
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EventsFilterBar } from "@/components/community/events-filter-bar";
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
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>المجتمع</span>
          </Link>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="size-7 text-primary" />
              فعاليات الحي
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ملتقيات، قوافل تضامنية، أمسيات ثقافية، ومناسبات تجمع أبناء
              الحي على قلب رجل واحد.
            </p>
          </div>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* شريط الفلترة */}
      <Suspense
        fallback={
          <div className="h-12 rounded-md bg-muted/40 animate-pulse" />
        }
      >
        <EventsFilterBar total={total} filteredCount={events.length} />
      </Suspense>

      {/* شبكة الفعاليات */}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const typeMeta = EVENT_TYPE_LABELS[ev.type as EventType];
            const statusMeta =
              EVENT_STATUS_LABELS[ev.status as EventStatus];
            const isCompleted = ev.status === "COMPLETED";
            const isOngoing = ev.status === "ONGOING";
            const isRegistered = myRegSet.has(ev.id);
            const registrationOpen =
              ev.isRegistrationOpen && !isCompleted && !isRegistered;
            const seatsFull =
              ev.maxAttendees !== null &&
              ev.maxAttendees > 0 &&
              false; // placeholder: ستُحسب لاحقاً
            // لمسجّلات الحضور
            const registeredCount = 0; // placeholder

            return (
              <Link
                key={ev.id}
                href={`/community/events/${ev.id}`}
                className="block group"
              >
                <Card className="warm-shadow overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg h-full">
                  {/* صورة الغلاف */}
                  <div
                    className="relative h-40 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="text-5xl opacity-80">
                      {typeMeta.emoji}
                    </span>
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
                  </div>

                  <CardContent className="space-y-3 p-5 flex-1 flex flex-col">
                    {/* نوع + حالة */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground"
                      >
                        <span aria-hidden>{typeMeta.emoji}</span>
                        <span>{typeMeta.label}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {statusMeta}
                      </span>
                    </div>

                    {/* عنوان */}
                    <h3 className="font-heading text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {ev.title}
                    </h3>

                    {/* وصف */}
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
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
                          <span>
                            الحد الأقصى: {ev.maxAttendees} مشارك
                          </span>
                          {registeredCount > 0 && (
                            <span className="ms-1">
                              ({registeredCount} مسجّل)
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* زر أو شارة */}
                    <div className="pt-2">
                      {isRegistered ? (
                        <Badge
                          variant="outline"
                          className="bg-secondary/10 text-secondary border-secondary/30 w-full justify-center py-2"
                        >
                          <CheckCircle2 className="size-4" />
                          أنت مسجّل
                        </Badge>
                      ) : isCompleted ? (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground w-full justify-center py-2"
                        >
                          <Ticket className="size-4" />
                          فعالية منتهية
                        </Badge>
                      ) : registrationOpen ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-11 w-full"
                          asChild
                        >
                          <Link href={`/community/events/${ev.id}`}>
                            سجّل الآن
                          </Link>
                        </Button>
                      ) : seatsFull ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-200 w-full justify-center py-2"
                        >
                          المقاعد ممتلئة
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 w-full"
                          asChild
                        >
                          <Link href={`/community/events/${ev.id}`}>
                            عرض التفاصيل
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <ZelligeDivider variant="wave" />

      {/* تذييل صغير */}
      <section className="text-center text-sm text-muted-foreground">
        <p>
          عن أبي هريرة رضي الله عنه أنّ النبيّ صلى الله عليه وسلم قال: «من
          نفّس عن مؤمن كربةً من كرب الدنيا، نفّس الله عنه كربةً من كرب يوم
          القيامة».
        </p>
      </section>
    </div>
  );
}
