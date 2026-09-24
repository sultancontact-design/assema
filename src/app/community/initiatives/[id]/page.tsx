// ===================================================================
//  صفحة تفاصيل مبادرة — /community/initiatives/[id]
//  Server Component — مصادقة مطلوبة
//  - الوصف الكامل
//  - خطّ زمني للحالة (timeline)
//  - عدد الداعمين + زر التصويت
//  - لوحة إدارة (لـ SUPER_ADMIN/DISTRICT_MOD)
// ===================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Lightbulb,
  ChevronLeft,
  Calendar,
  Coins,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EmptyState } from "@/components/shared/empty-state";
import { InitiativeVoteButton } from "@/components/community/initiative-vote-button";
import { InitiativeStatusControls } from "@/components/community/initiative-status-controls";
import {
  INITIATIVE_CATEGORY_LABELS,
  INITIATIVE_STATUS_LABELS,
  INITIATIVE_STATUSES,
  formatDateArabic,
  formatMAD,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

// خط زمني مبسّط للحالة
function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const statuses = INITIATIVE_STATUSES;
  const currentIndex = statuses.findIndex((s) => s.value === currentStatus);
  return (
    <ol className="space-y-3">
      {statuses.map((s, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        const rejected = currentStatus === "rejected" && idx === currentIndex;
        return (
          <li key={s.value} className="flex items-start gap-3">
            <div className="shrink-0">
              {done ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : active && !rejected ? (
                <Clock className="size-5 text-primary" />
              ) : rejected ? (
                <XCircle className="size-5 text-rose-600" />
              ) : (
                <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1">
              <Badge
                variant="outline"
                className={COLOR_CLASSES[s.color] ?? COLOR_CLASSES.slate}
              >
                {s.label}
              </Badge>
              {active && (
                <span className="ms-2 text-[11px] text-primary font-medium">
                  الحالة الحالية
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function InitiativeDetailPage({
  params,
}: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="مطلوب تسجيل الدخول"
        message="سجّل دخولك لعرض المبادرة والتصويت عليها"
        actionLabel="تسجيل الدخول"
        actionHref="/login?callbackUrl=/community/initiatives"
      />
    );
  }

  const { id } = await params;
  if (!id) notFound();

  const initiative = await db.initiative.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      votes: true,
      budget: true,
      targetDate: true,
      createdAt: true,
      updatedAt: true,
      proposer: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          profession: true,
        },
      },
      supporters: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              profession: true,
            },
          },
        },
      },
    },
  });

  if (!initiative) notFound();

  // هل المستخدم صوّت؟
  const myVote = await db.initiativeVote.findUnique({
    where: {
      initiativeId_userId: {
        initiativeId: id,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  // إجمالي الداعمين
  const supportersCount = await db.initiativeVote.count({
    where: { initiativeId: id },
  });

  // التحقّق من صلاحية الإدارة
  const canManage =
    user.role === "SUPER_ADMIN" || user.role === "DISTRICT_MOD";

  const cat = INITIATIVE_CATEGORY_LABELS[initiative.category] ?? {
    label: initiative.category,
    icon: "💡",
    color: "slate",
  };
  const st = INITIATIVE_STATUS_LABELS[initiative.status] ?? {
    label: initiative.status,
    color: "slate",
  };

  const proposerInitials = initiative.proposer.fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s.charAt(0))
    .join("");

  const isClosed =
    initiative.status === "completed" || initiative.status === "rejected";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* مسار */}
      <section>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>المجتمع</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/community/initiatives"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>المبادرات</span>
          </Link>
        </div>
      </section>

      {/* بطاقة المبادرة */}
      <Card className="warm-shadow border-border bg-card">
        <CardContent className="p-6 sm:p-8 space-y-4">
          {/* شارات */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.slate}
              >
                <span className="me-1">{cat.icon}</span>
                {cat.label}
              </Badge>
              <Badge
                variant="outline"
                className={COLOR_CLASSES[st.color] ?? COLOR_CLASSES.slate}
              >
                {st.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {formatDateArabic(initiative.updatedAt)}
            </span>
          </div>

          {/* العنوان */}
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {initiative.title}
          </h1>

          {/* المُقترِح */}
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {initiative.proposer.avatar ? (
                <AvatarImage
                  src={initiative.proposer.avatar}
                  alt={initiative.proposer.fullName}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {proposerInitials || "م"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {initiative.proposer.fullName}
              </span>
              {initiative.proposer.profession && (
                <span className="text-xs text-muted-foreground">
                  {initiative.proposer.profession}
                </span>
              )}
            </div>
          </div>

          {/* الوصف */}
          <article className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {initiative.description}
            </p>
          </article>

          {/* المعلومات */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border">
              <Calendar className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">الموعد المقترح</p>
                <p className="text-sm font-medium text-foreground">
                  {initiative.targetDate
                    ? formatDateArabic(initiative.targetDate)
                    : "غير محدّد"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border">
              <Coins className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">الميزانية المقترحة</p>
                <p className="text-sm font-medium text-foreground">
                  {initiative.budget ? formatMAD(initiative.budget) : "غير محدّدة"}
                </p>
              </div>
            </div>
          </div>

          <ZelligeDivider variant="minimal" />

          {/* التصويت */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <UsersIcon className="size-4 text-secondary" />
                <span className="font-bold text-foreground">{supportersCount}</span>
                <span className="text-muted-foreground">داعم</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold text-primary">{initiative.votes}</span>
                <span className="text-muted-foreground">صوت</span>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-md">
              <InitiativeVoteButton
                initiativeId={initiative.id}
                initialVotes={initiative.votes}
                initialSupporters={supportersCount}
                hasVoted={!!myVote}
                disabled={isClosed}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* خطّ زمني للحالة */}
      <Card className="warm-shadow border-border bg-card">
        <CardContent className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            مسار المبادرة
          </h2>
          <StatusTimeline currentStatus={initiative.status} />
        </CardContent>
      </Card>

      {/* لوحة إدارة الحالة */}
      {canManage && (
        <Card className="warm-shadow border-accent/30 bg-accent/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5 text-accent" />
              <h2 className="font-heading text-lg font-bold text-foreground">
                لوحة إدارة الحالة
              </h2>
              <Badge
                variant="outline"
                className="border-accent/30 bg-accent/10 text-accent ms-auto"
              >
                {user.role === "SUPER_ADMIN" ? "مشرف عام" : "مشرف الحي"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              غيّر حالة المبادرة بحسب تقدّمها. سيُحدّث تلقائياً خطّ الزمن.
            </p>
            <InitiativeStatusControls
              initiativeId={initiative.id}
              currentStatus={initiative.status}
            />
          </CardContent>
        </Card>
      )}

      {/* قائمة الداعمين */}
      {initiative.supporters.length > 0 && (
        <Card className="warm-shadow border-border bg-card">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <UsersIcon className="size-5 text-secondary" />
              آخر الداعمين ({Math.min(20, supportersCount)})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {initiative.supporters.map((s) => {
                const initials = s.user.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((x) => x.charAt(0))
                  .join("");
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border"
                  >
                    <Avatar className="size-7 shrink-0">
                      {s.user.avatar ? (
                        <AvatarImage
                          src={s.user.avatar}
                          alt={s.user.fullName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {initials || "م"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground truncate">
                      {s.user.fullName}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
