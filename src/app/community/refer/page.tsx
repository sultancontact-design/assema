// ===================================================================
//  صفحة الإحالة — /community/refer
//  Server Component — مصادقة مطلوبة
//  - رمز الإحالة كبير وقابل للنسخ (ReferralCodeBox)
//  - أزرار المشاركة (ShareButtons)
//  - إحصاءات (إجمالي، نشط، نقاط)
//  - لائحة الصدارة (أعلى 10 مُحيلين)
//  - شرح آلية العمل (3 خطوات بأيقونات)
// ===================================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  Coins,
  Trophy,
  ArrowRight,
  Share2,
  Gift,
  ChevronLeft,
  Medal,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getReferralStats,
  getReferralLeaderboard,
  buildReferralUrl,
} from "@/lib/referral-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EmptyState } from "@/components/shared/empty-state";
import { ReferralCodeBox } from "@/components/community/referral-code-box";
import { ShareButtons } from "@/components/community/share-buttons";

export const dynamic = "force-dynamic";
export const metadata = { title: "نظام الإحالة" };

interface HowItWorks {
  icon: typeof Share2;
  step: number;
  title: string;
  description: string;
  color: string;
}

const HOW_IT_WORKS: HowItWorks[] = [
  {
    icon: Share2,
    step: 1,
    title: "شارك رمزك",
    description:
      "أرسل رمز الإحالة الخاص بك لأصدقائك وعائلتك عبر واتساب أو فيسبوك أو تيليغرام أو نسخ الرابط مباشرة.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: UserCheck,
    step: 2,
    title: "سجّل صديقك",
    description:
      "عندما يُسجّل صديقك دخولاً للمنصة برمزك، يُحتسب له الحي ويُربط بك كإحالة ناجحة.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Coins,
    step: 3,
    title: "اربح 50 نقطة",
    description:
      "بمجرد إكمال تسجيل صديقك، تحصل على 50 نقطة تُضاف لرصيدك في المنصة وتُسجَّل في سجلّك.",
    color: "bg-accent/10 text-accent",
  },
];

export default async function ReferPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/refer");
  }

  // 1) توليد رمز (إن لم يوجد) + الإحصاءات (متوازية)
  const [stats, leaderboard] = await Promise.all([
    getReferralStats(user.id),
    getReferralLeaderboard(10),
  ]);

  const code = stats.code ?? "PENDING";
  const referralUrl =
    typeof window !== "undefined"
      ? buildReferralUrl(code, window.location.origin)
      : `/register?ref=${code}`;

  // بطاقات الإحصاءات
  const statCards = [
    {
      label: "إجمالي الإحالات",
      value: stats.totalReferrals,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "إحالات نشطة",
      value: stats.activeReferrals,
      icon: UserCheck,
      color: "bg-secondary/10 text-secondary",
    },
    {
      label: "بانتظار التسجيل",
      value: stats.pendingReferrals,
      icon: Sparkles,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "النقاط المكتسبة",
      value: stats.pointsEarned,
      icon: Coins,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* ─────────── الترويسة ─────────── */}
      <header className="text-center mb-8">
        <Badge
          variant="secondary"
          className="bg-accent/10 text-accent border-accent/20 mb-3"
        >
          <Gift className="size-3 ms-1.5" />
          نظام الإحالة
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground mb-2">
          ادعُ أهل الحي، اربح النقاط
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          كل صديق يدخل المنصة برمزك يمنحك <strong className="text-primary">50 نقطة</strong> تُضاف لرصيدك.
          النقاط تتفتح بها مكافآت متغيّرة، تجميد سلسلة، شارات حصرية، ومزايا
          أخرى في الحي.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ─────────── رمز الإحالة ─────────── */}
        <ReferralCodeBox code={code} />

        {/* ─────────── أزرار المشاركة ─────────── */}
        <Card className="warm-shadow border-border/60">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="font-heading flex items-center gap-2">
              <Share2 className="size-5 text-primary" />
              شارك الرابط
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                رابط الإحالة الكامل:
              </p>
              <code
                dir="ltr"
                className="block font-mono text-xs text-foreground bg-muted/40 border border-border rounded-md px-3 py-2 break-all"
              >
                {referralUrl}
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                اختر وسيلة المشاركة:
              </p>
              <ShareButtons
                url={referralUrl}
                title="انضمّ لمجتمعنا الرقمي في حي سيدي يوسف بن علي"
                text={`سجّل في منصة «سيدي يوسف بن علي العاصمة» برمز الإحالة ${code} واربح مكافآت.`}
                variant="default"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────── بطاقات الإحصاءات ─────────── */}
      <section aria-labelledby="stats-heading" className="mb-10">
        <h2 id="stats-heading" className="font-heading text-xl font-bold text-foreground mb-4">
          إحصاءاتك
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="warm-shadow border-border/60">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className={`grid place-items-center size-10 rounded-xl mb-2 ${s.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-2xl font-extrabold text-foreground">
                    {s.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─────────── لائحة الصدارة ─────────── */}
      <section aria-labelledby="leaderboard-heading" className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" />
          <h2 id="leaderboard-heading" className="font-heading text-xl font-bold text-foreground">
            لائحة الصدارة
          </h2>
          <Badge variant="outline" className="ms-2">
            أعلى 10 مُحيلين
          </Badge>
        </div>
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="لا توجد إحالات بعد"
            message="كن أول من يدعو أهل الحي ويتربّع على رأس لائحة الصدارة!"
            divider
          />
        ) : (
          <Card className="warm-shadow border-border/60">
            <CardContent className="p-0">
              <ol className="divide-y divide-border/60">
                {leaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankIcon = isTop3 ? (
                    <Medal
                      className={
                        rank === 1
                          ? "size-5 text-accent fill-accent/30"
                          : rank === 2
                          ? "size-5 text-muted-foreground fill-muted-foreground/30"
                          : "size-5 text-primary fill-primary/30"
                      }
                    />
                  ) : null;
                  return (
                    <li
                      key={entry.userId}
                      className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <span
                        className={`grid place-items-center size-10 rounded-full text-sm font-bold shrink-0 ${
                          isTop3
                            ? "bg-accent/15 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rankIcon ?? rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.fullName}
                          {entry.userId === user.id && (
                            <span className="text-xs text-primary ms-2">(أنت)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.activeReferrals} إحالة نشطة من {entry.totalReferrals}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="font-bold text-primary">{entry.pointsEarned}</p>
                        <p className="text-xs text-muted-foreground">نقطة</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ─────────── كيف تعمل الإحالة ─────────── */}
      <section aria-labelledby="how-heading" className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <h2 id="how-heading" className="font-heading text-xl font-bold text-foreground">
            كيف تعمل الإحالة؟
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.step}
                className="warm-shadow border-border/60 h-full"
              >
                <CardContent className="p-5 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`grid place-items-center size-12 rounded-xl ${s.color}`}>
                      <Icon className="size-6" />
                    </span>
                    <span className="text-2xl font-extrabold text-muted-foreground/40">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <ZelligeDivider variant="diamond" className="opacity-60 my-8" />

      {/* ─────────── CTA سفلي ─────────── */}
      <Card className="warm-shadow border-secondary/30 bg-secondary/5">
        <CardContent className="p-6 text-center">
          <h3 className="font-heading text-xl font-bold text-foreground mb-2">
            ابدأ بدعوة أصدقائك الآن
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md mx-auto">
            كل صديق تدعوه هو خطوة نحو مجتمع رقمي متضامن. كل نقطة تربحها
            تفتح لك باباً جديداً من المكافآت.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 gap-2">
              <Link href="/community/refer">
                <Share2 className="size-4" />
                <span>شارك الآن</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 gap-2">
              <Link href="/community">
                <span>لوحة المجتمع</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href="/community">
            <ChevronLeft className="size-4" />
            <span>العودة للوحة المجتمع</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
