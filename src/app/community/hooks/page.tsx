// ===================================================================
//  /community/hooks — صفحة حلقة الانتماء (Hook Loop)
//  تمثيل بصري: Trigger → Action → Variable Reward → Investment
//  + إحصائيات المستخدم في كل مرحلة + اقتراحات للتحسين
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Flame,
  Gift,
  Users,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStreakStatus } from "@/lib/streak-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { HookLoopVisual } from "@/components/community/hook-loop-visual";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "حلقة الانتماء",
};

export default async function HookLoopPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/hooks");
  }

  // 1) Triggers — الإشعارات + السلاسل
  const [triggersCount, actionsCount, rewardsCount, investmentsCount, userData] =
    await Promise.all([
      // Triggers: إشعارات + سلسلة
      db.smartNotification.count({ where: { userId: user.id } }),
      // Actions: logins + contributions + registrations
      db.userActivity.count({
        where: { userId: user.id, type: { in: ["LOGIN", "CONTRIBUTION"] } },
      }),
      // Rewards: نقاط + مكافآت متغيرة
      db.variableReward.count({ where: { userId: user.id } }),
      // Investments: شارات + أصدقاء + أنشطة
      db.userBadge.count({ where: { userId: user.id } }),
      // جلب نقاط المستخدم من DB (Session لا يحويها)
      db.user.findUnique({
        where: { id: user.id },
        select: { points: true, level: true },
      }),
    ]);

  const userPoints = userData?.points ?? 0;

  const streak = await getStreakStatus(user.id);
  const followerCount = await db.userRelationship.count({
    where: { followingId: user.id, status: "active" },
  });
  const followingCount = await db.userRelationship.count({
    where: { followerId: user.id, status: "active" },
  });
  const contributionCount = await db.contribution.count({
    where: { userId: user.id, status: "CONFIRMED" },
  });
  const profileComplete = Boolean(user.name) ? 60 : 30;

  const phases: HookPhase[] = [
    {
      id: "trigger",
      title: "1. المُحفّز (Trigger)",
      emoji: "🔔",
      color: "text-primary",
      bg: "bg-primary/10",
      description:
        "إشعار، تذكير سلسلة، أو حدث قادم — كلّها إشارات تُدفَع لك لتدخل.",
      stats: [
        { label: "إشعارات استقبلت", value: triggersCount },
        { label: "حالة السلسلة", value: streak.currentStreak > 0 ? `${streak.currentStreak} يوم` : "—" },
      ],
      suggestion:
        "فعّل تنبيهات السلسلة والإلحاح — لن تجدَ التذكير مُزعجاً بل هو فرصة.",
    },
    {
      id: "action",
      title: "2. الفعل (Action)",
      emoji: "✅",
      color: "text-secondary",
      bg: "bg-secondary/10",
      description:
        "أبسط ما يمكنك فعله: تسجيل الدخول اليومي، مساهمة بسيطة، أو الانضمام لفعالية.",
      stats: [
        { label: "أنشطة علنية", value: actionsCount },
        { label: "مساهمات مؤكّدة", value: contributionCount },
      ],
      suggestion:
        "سجّل دخولك اليومي حتى لو لم تردّ فعل شيء — فعل بسيط يبني العادة.",
    },
    {
      id: "reward",
      title: "3. المكافأة المتغيرة (Reward)",
      emoji: "🎁",
      color: "text-accent",
      bg: "bg-accent/10",
      description:
        "صندوق غامض، عجلة مكافآت، أو شارة. العشوائية هي ما يُبقي الاهتمام.",
      stats: [
        { label: "مكافآت مفتوحة", value: rewardsCount },
        { label: "نقاطك الحالية", value: userPoints },
      ],
      suggestion:
        "ساهم 5 مرّات لتفتح صندوقاً غامضاً — قد تربح شارة نادرة!",
    },
    {
      id: "investment",
      title: "4. الاستثمار (Investment)",
      emoji: "💎",
      color: "text-foreground",
      bg: "bg-muted",
      description:
        "كلّما أضفت للمنصة (شارات، أصدقاء، ملفّك)، زاد ارتباطك وأصعب تركها.",
      stats: [
        { label: "شاراتك", value: investmentsCount },
        { label: "متابِعون", value: followerCount },
        { label: "تتابع", value: followingCount },
      ],
      suggestion:
        "أكمل ملفّك بنسبة 100% (المتبقّي 40%) واحصل على شارة 'مؤسس'.",
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* الرأس */}
      <header className="space-y-2">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          <Flame className="size-3" />
          حلقة الانتماء (Hook Model)
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          كيف تجذبك المنصة — بشفافية
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          حلقة الانتماء (Hook Model من Nir Eyal) تصف العادات: كلّما مررت بهذه
          المراحل الأربع، زاد ارتباطك بالمنصة. هذه الصفحة تُريك مكانك في كل
          مرحلة واقتراحات للتحسين — بصدق وشفافية.
        </p>
      </header>

      <ZelligeDivider variant="diamond" />

      {/* التمثيل البصري */}
      <section>
        <HookLoopVisual
          phases={phases.map((p) => ({ title: p.title, emoji: p.emoji, color: p.color }))}
        />
      </section>

      {/* المراحل الأربع */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {phases.map((phase) => (
          <Card key={phase.id} className="warm-shadow">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center rounded-xl ${phase.bg} ${phase.color} text-2xl`}>
                  {phase.emoji}
                </div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  {phase.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {phase.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`font-heading text-lg font-bold ${phase.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                <TrendingUp className="size-4 mt-0.5 text-secondary shrink-0" />
                <p className="text-xs text-foreground">{phase.suggestion}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* اكمال الملف */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                اكتمال ملفّك: {profileComplete}%
              </h2>
              <p className="text-sm text-muted-foreground">
                كلّما أكملت، زادت فرصك في الحصول على شارات وفرص حصرية.
              </p>
            </div>
            <Button asChild size="sm" className="h-11">
              <Link href="/community/profile">
                أكمل ملفّك
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* شفافية أخلاقية */}
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <Users className="mx-auto size-8 text-secondary" />
          <h2 className="font-heading text-lg font-bold text-foreground">
            هذا ليس استغلالاً — بل عادة إيجابية
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            الهدف ليس أن تجلس ساعات أمام المنصة، بل أن تبني عادة يومية بسيطة:
            تذكّر، تسجّل، ساهم بـ10 درهم، أدر عجلة. في أي لحظة يمكنك أخذ استراحة
            من <Link href="/ethics" className="text-primary underline">صفحة الأخلاق</Link>.
          </p>
          <Button asChild variant="outline" size="sm" className="h-11">
            <Link href="/ethics">
              اعرف أكثر عن تصميمنا الأخلاقي
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface HookStat {
  label: string;
  value: string | number;
}
interface HookPhase {
  id: string;
  title: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  stats: HookStat[];
  suggestion: string;
}
