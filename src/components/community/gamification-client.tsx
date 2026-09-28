"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Award, Crown, Flame, Gift, Sparkles, Star, Trophy, Users,
  TrendingUp, Lock, ChevronLeft, ArrowLeft, Target, Zap,
} from "lucide-react";
import { Card3D } from "@/components/ui/3d-card";

interface BadgeItem {
  id: string; name: string; slug: string; description: string;
  rarity: string; earned: boolean; currentRecipients: number;
}
interface ChallengeItem {
  id: string; title: string; description: string; type: string;
  pointsReward: number; requiredCount: number; endDate: string; startDate: string;
}
interface TopUser {
  id: string; fullName: string; points: number; level: number;
  districtName: string; isCurrentUser: boolean;
}
interface Level {
  level: number; name: string; minPoints: number; maxPoints: number;
  color: string; bgClass: string; icon: string;
}

interface GamificationClientProps {
  userPoints: number;
  userLevel: number;
  userRank: number;
  totalUsers: number;
  levels: readonly Level[];
  badges: BadgeItem[];
  challenges: ChallengeItem[];
  topUsers: TopUser[];
}

// خريطة ندرة الشارة → لون
const RARITY_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
  legendary: { label: "أسطورية", color: "text-amber-600", border: "border-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  epic: { label: "ملحمية", color: "text-purple-600", border: "border-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  rare: { label: "نادرة", color: "text-sky-600", border: "border-sky-400", bg: "bg-sky-100 dark:bg-sky-900/30" },
  common: { label: "عادية", color: "text-muted-foreground", border: "border-border", bg: "bg-muted/40" },
};

export function GamificationClient({
  userPoints, userLevel, userRank, totalUsers,
  levels, badges, challenges, topUsers,
}: GamificationClientProps) {
  // ابحث عن المستوى الحالي + التالي
  const currentLevel = levels.find((l) => l.level === userLevel) ?? levels[0];
  const nextLevel = levels.find((l) => l.level === userLevel + 1);
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100))
    : 100;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ━━━ مستوى المستخدم الحالي + progress bar ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* البطاقة الكبيرة: المستوى الحالي */}
        <Card3D className="lg:col-span-2 rounded-2xl">
          <div className={`rounded-2xl border-2 ${currentLevel.color.replace("text-", "border-")} ${currentLevel.bgClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">مستواك الحالي</p>
                <h2 className={`font-heading font-extrabold ${currentLevel.color}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  {currentLevel.name}
                </h2>
              </div>
              <div className="text-end">
                <p className="font-heading text-2xl font-bold text-foreground tabular-nums">{userPoints}</p>
                <p className="text-xs text-muted-foreground">نقطة</p>
              </div>
            </div>
            {/* progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{currentLevel.minPoints}</span>
                {nextLevel && <span className="text-muted-foreground">{nextLevel.minPoints} → {nextLevel.name}</span>}
                {!nextLevel && <span className="text-muted-foreground">المستوى الأعلى 🌟</span>}
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${currentLevel.bgClass.replace("/15", "/60").replace("/20", "/70")} transition-all duration-700`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextLevel
                  ? `تبقّى ${nextLevel.minPoints - userPoints} نقطة للوصول إلى "${nextLevel.name}"`
                  : "وصلت أعلى مستوى — أنت حكيم الحي!"}
              </p>
            </div>
          </div>
        </Card3D>

        {/* بطاقة الترتيب */}
        <Card className="lift-on-hover">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Trophy className="size-5" />
              </span>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                من أصل {totalUsers}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">ترتيبك في الحي</p>
            <p className="font-heading font-extrabold text-primary text-4xl tabular-nums">#{userRank}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {userRank <= 3 ? "أنت من أفضل 3 أعضاء! استمر" : userRank <= 10 ? "أنت ضمن أفضل 10 — انافس على المركز الأوّل" : "اصعد للمراكز العشرة الأولى"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ━━━ 7 مستويات (Levels) ━━━ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Star className="size-5 text-accent" />
          <h2 className="font-heading text-xl font-bold text-foreground">رحلة المستويات</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {levels.map((lvl) => {
            const isCurrent = lvl.level === userLevel;
            const isReached = userPoints >= lvl.minPoints;
            return (
              <Card
                key={lvl.level}
                className={`lift-on-hover relative ${isCurrent ? `ring-2 ring-primary ${lvl.bgClass}` : isReached ? lvl.bgClass : "opacity-60"}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">{lvl.icon}</div>
                  <p className={`font-heading font-bold text-sm ${isReached ? lvl.color : "text-muted-foreground"}`}>
                    {lvl.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lvl.minPoints}+ نقطة
                  </p>
                  {isCurrent && (
                    <Badge className="mt-2 bg-primary text-primary-foreground text-[9px]">أنت هنا</Badge>
                  )}
                  {!isCurrent && isReached && (
                    <div className="mt-2 text-secondary text-xs flex justify-center"><Award className="size-4" /></div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ━━━ المكافآت اليومية: Spin Wheel + Mystery Box ━━━ */}
      <DailyRewards />

      {/* ━━━ الشارات (20 badges) ━━━ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-secondary" />
            <h2 className="font-heading text-xl font-bold text-foreground">مجموعة الشارات</h2>
          </div>
          <Badge variant="secondary">
            {badges.filter((b) => b.earned).length} / {badges.length} مكتسبة
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {badges.map((badge) => {
            const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.common;
            return (
              <Card3D key={badge.id} className="rounded-xl" intensity={6} disableTilt={!badge.earned}>
                <Card className={`h-full ${badge.earned ? rarity.border : "border-dashed border-border opacity-70"} ${rarity.bg}`}>
                  <CardContent className="p-4 text-center">
                    <div className={`mx-auto mb-2 grid size-12 place-items-center rounded-full ${badge.earned ? rarity.color + " " + rarity.bg : "bg-muted text-muted-foreground"}`}>
                      {badge.earned ? <Award className="size-6" /> : <Lock className="size-5" />}
                    </div>
                    <p className={`font-heading font-bold text-xs ${badge.earned ? rarity.color : "text-muted-foreground"}`}>
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className={`text-[9px] ${badge.earned ? rarity.color + " " + rarity.border : ""}`}>
                        {rarity.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            );
          })}
        </div>
      </section>

      {/* ━━━ التحديات (4 challenges) ━━━ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Target className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">التحديات النشطة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {challenges.map((c) => {
            const typeLabel = c.type === "DAILY" ? "يومي" : c.type === "WEEKLY" ? "أسبوعي" : c.type === "SEASONAL" ? "موسمي" : "محدود";
            const typeIcon = c.type === "DAILY" ? Zap : c.type === "WEEKLY" ? Flame : Trophy;
            const TypeIcon = typeIcon;
            const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <Card key={c.id} className="lift-on-hover border-s-4 border-s-primary">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <TypeIcon className="size-4" />
                    </span>
                    <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-foreground">{c.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-accent font-bold">
                      <Gift className="size-3" />
                      {c.pointsReward} نقطة
                    </span>
                    <span className="text-muted-foreground">
                      {daysLeft > 0 ? `${daysLeft} يوم متبقّ` : "ينتهي اليوم"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ━━━ لوحة المتصدرين (Leaderboard) ━━━ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-accent" />
            <h2 className="font-heading text-xl font-bold text-foreground">لوحة المتصدرين</h2>
          </div>
          <Badge variant="secondary">أفضل 10</Badge>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {topUsers.map((u, idx) => {
                const rank = idx + 1;
                const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                return (
                  <li
                    key={u.id}
                    className={`flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors ${u.isCurrentUser ? "bg-primary/5 border-s-4 border-s-primary" : ""}`}
                  >
                    <div className="w-8 text-center">
                      {medal ? <span className="text-xl">{medal}</span> : <span className="font-heading font-bold text-muted-foreground">{rank}</span>}
                    </div>
                    <div className={`grid size-10 place-items-center rounded-full text-sm font-bold shrink-0 ${
                      rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                      : rank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-900/30"
                      : rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                      : "bg-primary/10 text-primary"
                    }`}>
                      {u.fullName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${u.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                        {u.fullName}
                        {u.isCurrentUser && <span className="text-[10px] text-primary ms-2">(أنت)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">حيّ {u.districtName} · مستوى {u.level}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-heading font-bold text-primary tabular-nums">{u.points}</p>
                      <p className="text-[10px] text-muted-foreground">نقطة</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ━━━ المكافآت اليومية: Spin Wheel + Mystery Box ━━━
function DailyRewards() {
  const [spinning, setSpinning] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<string | null>(null);
  const [canSpin, setCanSpin] = React.useState(true);

  const spin = async () => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    try {
      const r = await fetch("/api/community/rewards/spin-wheel", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الدوران");
      setLastResult(d.reward || "نقاط +5");
      toast.success(`ربحت: ${d.reward || "+5 نقاط"}`);
      setCanSpin(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل عجلة الحظ");
      setCanSpin(false);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Gift className="size-5 text-accent" />
        <h2 className="font-heading text-xl font-bold text-foreground">المكافآت اليومية</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* عجلة الحظ */}
        <Card3D className="rounded-2xl" intensity={4}>
          <Card className="h-full">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
                <Sparkles className={`size-8 ${spinning ? "animate-spin" : ""}`} />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">عجلة الحظ</h3>
              <p className="text-xs text-muted-foreground mb-4">درّها مرة يومياً لربح نقاط أو تجميدات أو شارات</p>
              {lastResult && (
                <div className="mb-3 p-2 rounded-lg bg-secondary/10 text-secondary text-sm font-bold">
                  آخر ربح: {lastResult}
                </div>
              )}
              <Button onClick={spin} disabled={spinning || !canSpin} className="w-full h-11">
                {spinning ? "يدور..." : canSpin ? "در العجلة" : "تمّ اليوم — عُد غداً"}
              </Button>
            </CardContent>
          </Card>
        </Card3D>

        {/* الصندوق الغامض */}
        <Card3D className="rounded-2xl" intensity={4}>
          <Card className="h-full">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <Gift className="size-8" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">الصندوق الغامض</h3>
              <p className="text-xs text-muted-foreground mb-4">يُفتح كل 5 مساهمات — يمنحك مكافأة عشوائية</p>
              <Button asChild variant="outline" className="w-full h-11">
                <a href="/community/fund">
                  ساهم لفتح الصندوق
                  <ArrowLeft className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </Card3D>
      </div>
    </section>
  );
}

export default GamificationClient;
