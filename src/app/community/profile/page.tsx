// ===================================================================
//  صفحة الملف الشخصي — /community/profile
//  Server Component تعرض ملف المستخدم الحالي + مساهماته + طلباته + فعالياته
// ===================================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Home as HomeIcon,
  Briefcase,
  Sparkles,
  Award,
  Heart,
  HandHeart,
  CalendarDays,
  Settings,
  Star,
  Hash,
  Users as UsersIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatMAD,
  formatDateArabic,
  ROLE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
  FUND_REQUEST_TYPE_LABELS,
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  HOME_DISTRICT,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { DashboardMotion } from "@/components/community/dashboard-motion";
import { cn } from "@/lib/utils";
import type {
  ContributionStatus,
  ContributionMethod,
  FundRequestStatus,
  FundRequestType,
  RegistrationStatus,
  Role,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// ===================================================================
//  أدوات مساعدة محلية
// ===================================================================

/** قناع الهاتف: 0612345678 → 0612-•••••• */
function maskPhone(phone: string): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return digits;
  const head = digits.slice(0, 4);
  const tail = "•".repeat(Math.max(0, digits.length - 4));
  return `${head}-${tail}`;
}

/** أحرف الاسم الأولى من fullName */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

/** لون الخلفية للصورة الرمزية بناءً على hash الاسم */
function avatarColor(fullName: string): string {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-secondary/15 text-secondary",
    "bg-accent/15 text-accent",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = (hash * 31 + fullName.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

/** تسمية المستوى بناءً على النقاط */
function levelLabel(points: number): string {
  if (points < 50) return "مبتدئ";
  if (points < 200) return "نشط";
  if (points < 500) return "فاعل";
  if (points < 1000) return "خبير";
  return "مرجع";
}

// ===================================================================
//  الصفحة
// ===================================================================

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/profile");
  }

  // 1) بيانات المستخدم الكاملة
  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      districtId: true,
      familyId: true,
      profession: true,
      skills: true,
      interests: true,
      points: true,
      level: true,
      createdAt: true,
      avatar: true,
    },
  });

  if (!profile) {
    redirect("/login?callbackUrl=/community/profile");
  }

  // 2) بيانات الحي والأسرة
  const [district, family] = await Promise.all([
    db.district.findUnique({
      where: { id: profile.districtId },
      select: { name: true, city: true },
    }),
    profile.familyId
      ? db.family.findUnique({
          where: { id: profile.familyId },
          select: { familyName: true },
        })
      : Promise.resolve(null),
  ]);

  // 3) المساهمات (آخر 5 + العدد الإجمالي)
  const [contributions, contributionsCount] = await Promise.all([
    db.contribution.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.contribution.count({ where: { userId: profile.id } }),
  ]);

  // 4) طلبات الصرف (آخر 5 + العدد)
  const [fundRequests, fundRequestsCount] = await Promise.all([
    db.fundRequest.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.fundRequest.count({ where: { userId: profile.id } }),
  ]);

  // 5) تسجيلات الفعاليات (آخر 3 + العدد)
  const [eventRegs, eventRegsCount] = await Promise.all([
    db.eventRegistration.findMany({
      where: { userId: profile.id },
      orderBy: { registeredAt: "desc" },
      take: 3,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
          },
        },
      },
    }),
    db.eventRegistration.count({ where: { userId: profile.id } }),
  ]);

  // بيانات مساعدة
  const roleLabel = ROLE_LABELS[profile.role as Role];
  const skillsList = profile.skills
    ? profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const interestsList = profile.interests
    ? profile.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <DashboardMotion>
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
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
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <UserIcon className="size-7 text-primary" />
              ملفّي الشخصي
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              هويتك، بياناتك، مساهماتك وفعالياتك — في مكان واحد.
            </p>
          </div>
        </section>

        <ZelligeDivider variant="diamond" />

        {/* بطاقة الملف الشخصي */}
        <section aria-labelledby="profile-card">
          <Card className="warm-shadow border-border bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* صورة رمزية + شارة الدور */}
                <div className="flex flex-col items-center gap-3 sm:items-start">
                  <Avatar className="size-24">
                    <AvatarFallback
                      className={cn(
                        "size-24 text-3xl font-heading font-bold",
                        avatarColor(profile.fullName)
                      )}
                    >
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant="outline"
                    className="bg-secondary/10 text-secondary border-secondary/30 self-center sm:self-start"
                  >
                    <Sparkles className="size-3.5" />
                    {roleLabel.label}
                  </Badge>
                </div>

                {/* بيانات أساسية */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2
                      id="profile-card"
                      className="font-heading text-2xl font-bold text-foreground"
                    >
                      {profile.fullName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      عضو منذ {formatDateArabic(profile.createdAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoRow
                      icon={Mail}
                      label="البريد"
                      value={profile.email}
                    />
                    <InfoRow
                      icon={Phone}
                      label="الهاتف"
                      value={maskPhone(profile.phone)}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="الحي"
                      value={`${district?.name ?? HOME_DISTRICT.name} — ${
                        district?.city ?? HOME_DISTRICT.city
                      }`}
                    />
                    <InfoRow
                      icon={HomeIcon}
                      label="الأسرة"
                      value={family?.familyName ?? "غير مربوط"}
                    />
                    <InfoRow
                      icon={Briefcase}
                      label="المهنة"
                      value={profile.profession ?? "غير محدّد"}
                    />
                    <InfoRow
                      icon={Star}
                      label="المستوى"
                      value={`${levelLabel(profile.points)} — مستوى ${
                        profile.level
                      }`}
                    />
                  </div>

                  {(skillsList.length > 0 || interestsList.length > 0) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {skillsList.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Sparkles className="size-3.5 text-accent" />
                              مهاراتي
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {skillsList.map((s) => (
                                <Badge
                                  key={s}
                                  variant="outline"
                                  className="bg-muted text-muted-foreground"
                                >
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {interestsList.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Heart className="size-3.5 text-primary" />
                              اهتماماتي
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {interestsList.map((i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="bg-muted text-muted-foreground"
                                >
                                  {i}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* نقاط اللعب (Gamification) */}
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-accent/5 p-3">
                    <div className="flex items-center gap-2">
                      <Award className="size-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          نقاط المعروف
                        </p>
                        <p className="font-heading text-xl font-bold text-foreground">
                          {profile.points}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-accent/10 text-accent border-accent/30"
                    >
                      <Star className="size-3.5" />
                      مستوى {profile.level}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* إحصاءاتي — 4 بطاقات */}
        <section aria-labelledby="my-stats" className="space-y-3">
          <h2
            id="my-stats"
            className="font-heading text-xl font-bold text-foreground"
          >
            إحصاءاتي
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStatCard
              label="مساهماتي"
              value={contributionsCount}
              icon={<Heart className="size-5 text-primary" />}
              bg="bg-primary/10"
            />
            <MiniStatCard
              label="طلباتي"
              value={fundRequestsCount}
              icon={<HandHeart className="size-5 text-secondary" />}
              bg="bg-secondary/10"
            />
            <MiniStatCard
              label="فعالياتي"
              value={eventRegsCount}
              icon={<CalendarDays className="size-5 text-accent" />}
              bg="bg-accent/10"
            />
            <MiniStatCard
              label="نقاطي"
              value={profile.points}
              icon={<Star className="size-5 text-accent" />}
              bg="bg-accent/10"
            />
          </div>
        </section>

        {/* مساهماتي + طلباتي — جنباً إلى جنب */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* مساهماتي */}
          <section aria-labelledby="my-contribs" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="my-contribs"
                className="font-heading text-lg font-bold text-foreground"
              >
                مساهماتي الأخيرة
              </h2>
              {contributionsCount > 0 && (
                <Button asChild variant="ghost" size="sm" className="h-9">
                  <Link href="/community/fund">
                    عرض الكل
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
            {contributions.length === 0 ? (
              <EmptyCard
                icon={<Heart className="size-8" />}
                title="لا توجد مساهمات بعد"
                description="ابدأ مساهمتك الأولى في صندوق المعروف."
                actionHref="/community/fund"
                actionLabel="ساهم الآن"
              />
            ) : (
              <Card className="warm-shadow border-border bg-card">
                <CardContent className="divide-y divide-border p-0">
                  {contributions.map((c) => {
                    const statusMeta =
                      CONTRIBUTION_STATUS_LABELS[
                        c.status as ContributionStatus
                      ];
                    const methodLabel =
                      CONTRIBUTION_METHOD_LABELS[
                        c.method as ContributionMethod
                      ];
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs text-primary">
                            {c.receiptNumber ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {methodLabel} · {c.month}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateArabic(c.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-heading font-bold text-foreground">
                            {formatMAD(c.amount)}
                          </span>
                          <ColoredBadge
                            color={contributionStatusColor(
                              c.status as ContributionStatus
                            )}
                          >
                            {statusMeta}
                          </ColoredBadge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </section>

          {/* طلباتي */}
          <section aria-labelledby="my-reqs" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="my-reqs"
                className="font-heading text-lg font-bold text-foreground"
              >
                طلباتي الأخيرة
              </h2>
              {fundRequestsCount > 0 && (
                <Button asChild variant="ghost" size="sm" className="h-9">
                  <Link href="/community/fund">
                    عرض الكل
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
            {fundRequests.length === 0 ? (
              <EmptyCard
                icon={<HandHeart className="size-8" />}
                title="لا توجد طلبات بعد"
                description="قدّم طلباً للصندوق عند الحاجة."
                actionHref="/community/fund"
                actionLabel="قدّم طلباً"
              />
            ) : (
              <Card className="warm-shadow border-border bg-card">
                <CardContent className="divide-y divide-border p-0">
                  {fundRequests.map((r) => {
                    const statusMeta =
                      FUND_REQUEST_STATUS_LABELS[
                        r.status as FundRequestStatus
                      ];
                    const typeMeta =
                      FUND_REQUEST_TYPE_LABELS[r.type as FundRequestType];
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">
                              {r.anonymousCode ?? "SY-???"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <span aria-hidden>{typeMeta.emoji}</span>
                              <span>{typeMeta.label}</span>
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateArabic(r.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-heading font-bold text-foreground">
                            {formatMAD(r.amountRequested)}
                          </span>
                          <ColoredBadge color={statusMeta.color}>
                            {statusMeta.label}
                          </ColoredBadge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        {/* فعالياتي */}
        <section aria-labelledby="my-events" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="my-events"
              className="font-heading text-lg font-bold text-foreground"
            >
              فعالياتي
            </h2>
            {eventRegsCount > 0 && (
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link href="/community/events">
                  عرض الكل
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
            )}
          </div>
          {eventRegs.length === 0 ? (
            <EmptyCard
              icon={<CalendarDays className="size-8" />}
              title="لا توجد فعاليات مسجّلة"
              description="تصفّح فعاليات الحي القادمة وسجّل حضورك."
              actionHref="/community/events"
              actionLabel="تصفّح الفعاليات"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {eventRegs.map((er) => {
                const statusLabel =
                  REGISTRATION_STATUS_LABELS[
                    er.status as RegistrationStatus
                  ];
                return (
                  <Card
                    key={er.id}
                    className="warm-shadow border-border bg-card"
                  >
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground"
                        >
                          <Hash className="size-3" />
                          <span className="font-mono text-xs">
                            {er.ticketCode}
                          </span>
                        </Badge>
                        <ColoredBadge
                          color={registrationStatusColor(
                            er.status as RegistrationStatus
                          )}
                        >
                          {statusLabel}
                        </ColoredBadge>
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground line-clamp-2">
                        {er.event.title}
                      </h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-primary" />
                          {formatDateArabic(er.event.startDate)}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary" />
                          <span className="line-clamp-1">
                            {er.event.location}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <ZelligeDivider variant="wave" />

        {/* الإعدادات */}
        <section aria-labelledby="settings-section" className="space-y-3">
          <h2
            id="settings-section"
            className="font-heading text-xl font-bold text-foreground"
          >
            الإعدادات
          </h2>
          <Card className="warm-shadow border-border bg-card">
            <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Settings className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    تعديل الملف الشخصي
                  </p>
                  <p className="text-xs text-muted-foreground">
                    حدّث مهاراتك، اهتماماتك، ومهنتك
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="h-11">
                <Link href="/community/profile/edit">
                  تعديل البيانات
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardMotion>
  );
}

// ===================================================================
//  مكوّنات مساعدة محلية
// ===================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground truncate" dir="auto">
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <Card className="warm-shadow border-border bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            bg
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card className="border-dashed border-border bg-card">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          {icon}
        </div>
        <h3 className="font-heading text-base font-bold text-foreground">
          {title}
        </h3>
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-11 mt-1"
        >
          <Link href={actionHref}>
            <UsersIcon className="size-4" />
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** خريطة لون->class لشارة ملوّنة */
function ColoredBadge({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };
  return (
    <Badge variant="outline" className={map[color] ?? map.slate}>
      {children}
    </Badge>
  );
}

function contributionStatusColor(status: ContributionStatus): string {
  const map: Record<ContributionStatus, string> = {
    PENDING: "amber",
    CONFIRMED: "emerald",
    REJECTED: "rose",
    REFUNDED: "slate",
  };
  return map[status] ?? "slate";
}

function registrationStatusColor(status: RegistrationStatus): string {
  const map: Record<RegistrationStatus, string> = {
    REGISTERED: "blue",
    ATTENDED: "emerald",
    CANCELLED: "slate",
    NO_SHOW: "rose",
  };
  return map[status] ?? "slate";
}
