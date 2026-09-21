// ===================================================================
//  صفحة تفاصيل الفعالية — /community/events/[id]
//  Server Component — يعرض الفعالية + التسجيلات + التقييمات
//  يُولّد رمز QR محلياً عبر generateQrCodeDataUrl
// ===================================================================

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  UserCircle,
  Star,
  ImageIcon,
  ScanLine,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQrCodeDataUrl } from "@/lib/qr-code";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  EventDetailClient,
  type EventDetailClientProps,
} from "@/components/community/event-detail-client";
import { EventRating } from "@/components/community/event-rating";
import {
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  formatDateArabic,
  formatDateTimeArabic,
} from "@/lib/constants";
import { hasPermission } from "@/lib/roles";
import type {
  EventType,
  EventStatus,
  RegistrationStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ===================================================================
//  أنواع مساعدة
// ===================================================================

interface RatingEntry {
  id: string;
  rating: number;
  comment: string | null;
  anonymous: boolean;
  actorName: string | null;
  createdAt: string;
}

interface RegistrationRow {
  id: string;
  ticketCode: string;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt: string | null;
  user: { id: string; fullName: string };
}

// ===================================================================
//  خريطة SVG افتراضية بدبوس موقع
// ===================================================================

function DefaultMap({ location }: { location: string }) {
  const truncated =
    location.length > 40 ? location.slice(0, 40) + "…" : location;
  return (
    <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
      <svg
        viewBox="0 0 400 240"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label={`خريطة الموقع: ${location}`}
      >
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBF6EE" />
            <stop offset="100%" stopColor="#F5E9D5" />
          </linearGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5D9C0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="240" fill="url(#mapBg)" />
        <rect width="400" height="240" fill="url(#grid)" />
        {/* طرق */}
        <path d="M 0 130 Q 100 100, 200 130 T 400 130" stroke="#D4C5A8" strokeWidth="6" fill="none" />
        <path d="M 200 0 Q 220 80, 200 130 T 220 240" stroke="#D4C5A8" strokeWidth="4" fill="none" />
        {/* معالم */}
        <circle cx="80" cy="80" r="6" fill="#2D5A3D" opacity="0.6" />
        <circle cx="320" cy="180" r="5" fill="#2D5A3D" opacity="0.6" />
        <circle cx="300" cy="60" r="4" fill="#2D5A3D" opacity="0.6" />
        {/* الدبوس */}
        <g transform="translate(195, 100)">
          <path
            d="M15 0 C24 0 30 6 30 15 C30 25 15 45 15 45 C15 45 0 25 0 15 C0 6 6 0 15 0 Z"
            fill="#B8492B"
            stroke="#1F1A17"
            strokeWidth="1"
          />
          <circle cx="15" cy="15" r="6" fill="#FBF6EE" />
        </g>
        <text
          x="200"
          y="200"
          textAnchor="middle"
          fill="#1F1A17"
          style={{ fontSize: "12px", fontFamily: "Tajawal, sans-serif" }}
        >
          {truncated}
        </text>
      </svg>
    </div>
  );
}

// ===================================================================
//  الصفحة
// ===================================================================

export default async function EventDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/events");
  }

  const { id } = await params;

  // 1) جلب الفعالية مع التسجيلات
  const event = await db.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true },
          },
        },
        orderBy: { registeredAt: "desc" },
      },
      group: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!event || event.deletedAt) {
    notFound();
  }

  // 2) جلب المنظِّم (organizerId بدون علاقة named — استعلام مستقل)
  const organizer = event.organizerId
    ? await db.user.findUnique({
        where: { id: event.organizerId },
        select: { id: true, fullName: true, avatar: true },
      })
    : null;

  // 3) جلب تقييمات الفعالية من AuditLog
  //    التقييمات تُخزَّن كـ AuditLog: action=event.rated, entity=Event, entityId=eventId
  //    metadata = JSON({rating, comment, anonymous})
  const ratingLogs = await db.auditLog.findMany({
    where: {
      action: "event.rated",
      entity: "Event",
      entityId: event.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, fullName: true } },
    },
  });

  const ratings: RatingEntry[] = ratingLogs.map((log) => {
    let meta: { rating?: number; comment?: string | null; anonymous?: boolean } = {};
    try {
      meta = JSON.parse(log.metadata ?? "{}");
    } catch {
      meta = {};
    }
    return {
      id: log.id,
      rating: typeof meta.rating === "number" ? meta.rating : 0,
      comment: meta.comment ?? null,
      anonymous: !!meta.anonymous,
      actorName: log.actor?.fullName ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  });

  // 4) تقييم المستخدم الحالي
  const myRatingLog = ratingLogs.find((log) => log.actorId === user.id);
  let myRating: RatingEntry | null = null;
  if (myRatingLog) {
    let meta: { rating?: number; comment?: string | null; anonymous?: boolean } = {};
    try {
      meta = JSON.parse(myRatingLog.metadata ?? "{}");
    } catch {
      meta = {};
    }
    myRating = {
      id: myRatingLog.id,
      rating: typeof meta.rating === "number" ? meta.rating : 0,
      comment: meta.comment ?? null,
      anonymous: !!meta.anonymous,
      actorName: myRatingLog.actor?.fullName ?? null,
      createdAt: myRatingLog.createdAt.toISOString(),
    };
  }

  // 5) تسجيل المستخدم الحالي (إن وُجد)
  const myRegistration = event.registrations.find(
    (r) => r.userId === user.id && (r.status === "REGISTERED" || r.status === "ATTENDED")
  );

  // 6) توليد QR لتذكرة المستخدم (من ticketCode)
  let myQrDataUrl = "";
  if (myRegistration) {
    // qrCode field stores the same string as ticketCode (per design — frontend renders it as QR image)
    myQrDataUrl = await generateQrCodeDataUrl(
      myRegistration.qrCode || myRegistration.ticketCode
    );
  }

  // 7) إحصاءات
  const registeredCount = event.registrations.filter(
    (r) => r.status === "REGISTERED" || r.status === "ATTENDED"
  ).length;
  const attendedCount = event.registrations.filter(
    (r) => r.status === "ATTENDED"
  ).length;
  const maxAttendees = event.maxAttendees ?? 0;
  const spotsRemaining = maxAttendees > 0 ? Math.max(0, maxAttendees - registeredCount) : 0;
  const seatsFull = maxAttendees > 0 && registeredCount >= maxAttendees;
  const fillPercent = maxAttendees > 0 ? Math.min(100, (registeredCount / maxAttendees) * 100) : 0;

  // متوسط التقييم
  const validRatings = ratings.filter((r) => r.rating > 0);
  const avgRating =
    validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length
      : 0;

  // 8) صلاحيات
  const isStaff = hasPermission(user.role, "event.manage-registrations");
  const isOrganizer = event.organizerId === user.id;
  const canSeeRegistrations = isStaff || isOrganizer;
  const canScan = isStaff || isOrganizer;

  // 9) حالات المنطق
  const status = event.status as EventStatus;
  const type = event.type as EventType;
  const typeMeta = EVENT_TYPE_LABELS[type];
  const statusLabel = EVENT_STATUS_LABELS[status] ?? status;
  const isCompleted = status === "COMPLETED";
  const isOngoing = status === "ONGOING";

  // هل يمكن للمستخدم التسجيل الآن؟
  const registrationOpen =
    event.isRegistrationOpen &&
    !myRegistration &&
    (status === "PUBLISHED" || status === "ONGOING") &&
    !seatsFull;

  // هل المستخدم حاضر الفعالية؟ (يحقّ له التقييم)
  const hasAttended = myRegistration?.status === "ATTENDED";
  const canRate = isCompleted && hasAttended;

  // 10) معالجة galleryImages (JSON string array)
  let galleryImages: string[] = [];
  if (event.galleryImages) {
    try {
      const parsed = JSON.parse(event.galleryImages);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.filter((s): s is string => typeof s === "string");
      }
    } catch {
      galleryImages = [];
    }
  }

  // 11) تجهيز قائمة التسجيلات للموظفين
  const registrationRows: RegistrationRow[] = canSeeRegistrations
    ? event.registrations
        .filter((r) => r.status !== "CANCELLED")
        .map((r) => ({
          id: r.id,
          ticketCode: r.ticketCode,
          status: r.status as RegistrationStatus,
          registeredAt:
            r.registeredAt instanceof Date
              ? r.registeredAt.toISOString()
              : String(r.registeredAt),
          attendedAt: r.attendedAt
            ? r.attendedAt instanceof Date
              ? r.attendedAt.toISOString()
              : String(r.attendedAt)
            : null,
          user: { id: r.user.id, fullName: r.user.fullName },
        }))
    : [];

  // 12) props للعميل
  const clientProps: EventDetailClientProps = {
    eventId: event.id,
    eventTitle: event.title,
    eventDateLabel: formatDateArabic(event.startDate),
    eventLocation: event.location,
    registrationOpen,
    seatsFull,
    isRegistered: !!myRegistration,
    registration: myRegistration
      ? {
          ticketCode: myRegistration.ticketCode,
          status: myRegistration.status as RegistrationStatus,
          qrDataUrl: myQrDataUrl,
        }
      : null,
  };

  // 13) عرض الحالة Badge ملون
  const statusBadgeClass = isOngoing
    ? "bg-emerald-500 text-white border-transparent animate-pulse"
    : isCompleted
    ? "bg-slate-600 text-white border-transparent"
    : status === "CANCELLED"
    ? "bg-rose-600 text-white border-transparent"
    : "bg-primary text-primary-foreground border-transparent";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* رأس الصفحة — breadcrumb */}
      <section>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community/events"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>فعاليات الحي</span>
          </Link>
        </div>
      </section>

      {/* ===== القسم البطولي (Hero) ===== */}
      <section>
        <Card className="warm-shadow overflow-hidden">
          {/* صورة الغلاف أو placeholder بتدرّج */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 flex items-center justify-center">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={`صورة ${event.title}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <span className="text-7xl opacity-80" aria-hidden>
                {typeMeta.emoji}
              </span>
            )}
            {/* أوسمة فوق الصورة */}
            <div className="absolute top-4 inset-x-4 flex flex-wrap items-center justify-between gap-2">
              <Badge className={statusBadgeClass}>{statusLabel}</Badge>
              {isOngoing && (
                <Badge className="bg-emerald-500 text-white border-transparent">
                  ● جارٍ الآن
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* نوع + مجموعة */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                <span aria-hidden>{typeMeta.emoji}</span>
                <span>{typeMeta.label}</span>
              </Badge>
              {event.group && (
                <Link href="/community/groups">
                  <Badge
                    variant="outline"
                    className="bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20"
                  >
                    {event.group.name}
                  </Badge>
                </Link>
              )}
            </div>

            {/* العنوان */}
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {event.title}
            </h1>

            {/* معلومات سريعة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="font-medium text-foreground">
                    {formatDateArabic(event.startDate)}
                    {event.endDate && (
                      <span className="text-muted-foreground">
                        {" "}— {formatDateArabic(event.endDate)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الوقت</p>
                  <p className="font-medium text-foreground">
                    {new Intl.DateTimeFormat("ar-MA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(event.startDate))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <MapPin className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">المكان</p>
                  <p className="font-medium text-foreground">{event.location}</p>
                </div>
              </div>
              {organizer && (
                <div className="flex items-center gap-2 text-sm sm:col-span-2">
                  <UserCircle className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">المنظِّم</p>
                    <p className="font-medium text-foreground">
                      {organizer.fullName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* ===== الأزرار + التذكرة ===== */}
      <section className="space-y-4">
        <EventDetailClient {...clientProps} />
      </section>

      <ZelligeDivider variant="wave" />

      {/* ===== الوصف ===== */}
      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="size-6 text-accent" />
          عن الفعالية
        </h2>
        <Card className="warm-shadow">
          <CardContent className="p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {event.description.split("\n").map((para, i) => (
                <p key={i} className="text-foreground/90 leading-loose mb-3">
                  {para.trim() || "\u00A0"}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <ZelligeDivider variant="minimal" />

      {/* ===== الخريطة ===== */}
      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="size-6 text-primary" />
          الموقع على الخريطة
        </h2>
        <Card className="warm-shadow">
          <CardContent className="p-4">
            {event.locationMapSvg ? (
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: event.locationMapSvg }}
              />
            ) : (
              <DefaultMap location={event.location} />
            )}
            <p className="mt-3 text-sm text-muted-foreground text-center">
              {event.location}
            </p>
          </CardContent>
        </Card>
      </section>

      <ZelligeDivider variant="stars" />

      {/* ===== الإحصاءات ===== */}
      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="size-6 text-accent" />
          إحصاءات التسجيل
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="الحد الأقصى"
            value={maxAttendees > 0 ? String(maxAttendees) : "∞"}
            icon={<UsersIcon className="size-5" />}
          />
          <StatCard
            label="المسجّلون"
            value={String(registeredCount)}
            icon={<CheckCircle2 className="size-5" />}
            color="text-emerald-600"
          />
          <StatCard
            label="الحاضرون"
            value={String(attendedCount)}
            icon={<CheckCircle2 className="size-5" />}
            color="text-primary"
          />
          <StatCard
            label="مقاعد متاحة"
            value={maxAttendees > 0 ? String(spotsRemaining) : "∞"}
            icon={<XCircle className="size-5" />}
            color="text-amber-600"
          />
        </div>
        {maxAttendees > 0 && (
          <Card className="warm-shadow">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">نسبة الإشغال</span>
                <span className="font-bold text-foreground">
                  {fillPercent.toFixed(0)}%
                </span>
              </div>
              <Progress value={fillPercent} className="h-3" />
            </CardContent>
          </Card>
        )}
      </section>

      {/* ===== قائمة التسجيلات (للموظفين فقط) ===== */}
      {canSeeRegistrations && registrationRows.length > 0 && (
        <>
          <ZelligeDivider variant="diamond" />
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
                <UsersIcon className="size-6 text-primary" />
                قائمة المسجّلين
              </h2>
              {canScan && (
                <Button asChild size="sm" variant="outline" className="h-10">
                  <Link href="/admin/events/scan">
                    <ScanLine className="size-4" />
                    مسح QR للحضور
                  </Link>
                </Button>
              )}
            </div>
            <Card className="warm-shadow">
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 sticky top-0 z-10">
                      <tr>
                        <th className="text-start font-medium text-muted-foreground p-3">
                          الاسم
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-3">
                          رقم التذكرة
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-3">
                          الحالة
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-3 hidden sm:table-cell">
                          التسجيل
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrationRows.map((r) => {
                        const rStatus = r.status as RegistrationStatus;
                        const rStatusLabel =
                          REGISTRATION_STATUS_LABELS[rStatus] ?? rStatus;
                        const statusBadge =
                          rStatus === "ATTENDED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : rStatus === "REGISTERED"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : rStatus === "NO_SHOW"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-800 border-slate-200";
                        return (
                          <tr
                            key={r.id}
                            className="border-t border-border hover:bg-muted/20"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {r.user.fullName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {r.user.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {r.ticketCode}
                            </td>
                            <td className="p-3">
                              <Badge className={statusBadge} variant="outline">
                                {rStatusLabel}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                              {formatDateTimeArabic(r.registeredAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ===== معرض الصور (إن اكتملت الفعالية) ===== */}
      {isCompleted && galleryImages.length > 0 && (
        <>
          <ZelligeDivider variant="wave" />
          <section className="space-y-3">
            <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="size-6 text-accent" />
              معرض الصور
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img, i) => (
                <Card key={i} className="warm-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <img
                      src={img}
                      alt={`صورة ${i + 1} من ${event.title}`}
                      className="w-full h-40 object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ===== التقييم ===== */}
      {isCompleted && (
        <>
          <ZelligeDivider variant="diamond" />
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Star className="size-6 text-amber-500" />
              التقييمات
            </h2>

            {/* متوسط التقييم */}
            {validRatings.length > 0 ? (
              <Card className="warm-shadow">
                <CardContent className="p-6 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">متوسط التقييم</p>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-7 ${
                          s <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {avgRating.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ 5
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    من {validRatings.length} تقييم
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="warm-shadow border-dashed">
                <CardContent className="p-6 text-center space-y-1">
                  <Star className="size-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    لا توجد تقييمات بعد. كن أول من يُقيّم!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* نموذج التقييم (لمن حضر فقط) */}
            {canRate ? (
              <EventRating eventId={event.id} currentRating={myRating} />
            ) : isCompleted && !hasAttended ? (
              <Card className="warm-shadow border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-center text-sm text-amber-800">
                  التقييم متاح فقط لمن سجّل حضوره في هذه الفعالية.
                </CardContent>
              </Card>
            ) : null}

            {/* قائمة التقييمات */}
            {validRatings.length > 0 && (
              <div className="space-y-3">
                {validRatings.map((r) => (
                  <Card key={r.id} className="warm-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {r.anonymous
                                ? "؟"
                                : (r.actorName ?? "؟").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {r.anonymous
                                ? "تقييم مجهول"
                                : (r.actorName ?? "—")}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`size-3.5 ${
                                    s <= r.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-transparent text-muted-foreground/40"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateArabic(r.createdAt)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-foreground/80 leading-relaxed ps-10">
                          {r.comment}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Separator />

      {/* تذييل صغير */}
      <section className="text-center text-sm text-muted-foreground">
        <p>
          عن ابن عمر رضي الله عنهما أنّ النبيّ صلى الله عليه وسلم قال: «المسلم
          أخو المسلم، لا يظلمه ولا يُسلمه».
        </p>
      </section>
    </div>
  );
}

// ===================================================================
//  مكوّن بطاقة إحصائية صغيرة
// ===================================================================

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="warm-shadow">
      <CardContent className="p-4 space-y-1">
        <div
          className={`flex items-center gap-1.5 text-muted-foreground ${
            color ?? ""
          }`}
        >
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
