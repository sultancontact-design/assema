// v73 — Neighborhoods page (الأحياء المتنافسة - من طنجة لكويرة)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NeighborhoodsClient } from "@/components/neighborhoods/neighborhoods-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, MapPin, Crown, Flame, Heart, Star, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "الأحياء المتنافسة | وَصَل", description: "منافسة شريفة بين أحياء المغرب — من طنجة لكويرة" };

const LEVELS: Record<string, { label: string; color: string; emoji: string }> = {
  "جديد": { label: "جديد", color: "from-slate-400 to-slate-500", emoji: "🌱" },
  "نشيط": { label: "نشيط", color: "from-teal-500 to-teal-600", emoji: "🌿" },
  "متضامن": { label: "متضامن", color: "from-amber-500 to-amber-600", emoji: "🤝" },
  "بطل": { label: "بطل", color: "from-rose-500 to-rose-600", emoji: "🏆" },
  "أسطورة": { label: "أسطورة", color: "from-purple-500 to-pink-500", emoji: "👑" },
};

export default async function NeighborhoodsPage() {
  const me = await getCurrentUser();

  const [districts, families, challenges, stories, badges] = await Promise.all([
    db.districtPride.findMany({ orderBy: [{ prideScore: "desc" }], take: 50 }),
    db.familyPride.findMany({ orderBy: [{ prideScore: "desc" }], take: 30 }),
    db.districtChallenge.findMany({ where: { status: "active" }, orderBy: [{ endsAt: "asc" }], take: 10 }),
    db.neighborhoodStory.findMany({ where: { isApproved: true }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 6 }),
    db.achievementBadge.findMany({ orderBy: [{ rarity: "desc" }, { pointsAwarded: "desc" }], take: 20 }),
  ]);

  // Serialize
  const districtsSerialized = districts.map((d) => ({
    ...d,
    lastActivityAt: d.lastActivityAt?.toISOString() ?? null,
    updatedAt: d.updatedAt.toISOString(),
  }));
  const familiesSerialized = families.map((f) => ({
    ...f,
    lastActivityAt: f.lastActivityAt?.toISOString() ?? null,
    updatedAt: f.updatedAt.toISOString(),
  }));
  const challengesSerialized = challenges.map((c) => ({
    ...c,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  const storiesSerialized = stories.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const stats = {
    districts: districts.length,
    families: families.length,
    activeChallenges: challenges.length,
    stories: stories.length,
    badges: badges.length,
    totalPride: districts.reduce((s, d) => s + d.prideScore, 0),
    topScore: districts[0]?.prideScore ?? 0,
    leaderName: districts[0]?.districtName ?? "—",
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="v73 — منافسة الأحياء" title="الأحياء المتنافسة" subtitle="من طنجة لكويرة — أحياء المغرب يتنافسون شرفاً وتضامناً ومرحاً" />

      <section className="container mx-auto max-w-7xl px-4 py-10">
        {/* Hero stats — top performer */}
        {districts[0] && (
          <Card className={`mb-8 bg-gradient-to-l ${LEVELS[districts[0].prideLevel]?.color ?? "from-amber-400 to-amber-500"} text-white border-0 shadow-xl`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="text-5xl">{LEVELS[districts[0].prideLevel]?.emoji ?? "🏆"}</div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-90">حي الشهر — البطل الوطني</p>
                <h2 className="text-2xl md:text-3xl font-bold">{districts[0].districtName}</h2>
                <p className="text-sm opacity-90 mt-1">درجة فخر {districts[0].prideScore} · {districts[0].streak} يوم نشاط متتالي</p>
              </div>
              <div className="text-center">
                <Crown className="h-10 w-10 mx-auto" />
                <p className="text-xs mt-1">#1</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center">
            <MapPin className="h-5 w-5 text-teal-700 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.districts}</p>
            <p className="text-xs text-muted-foreground">حي منافِس</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.families}</p>
            <p className="text-xs text-muted-foreground">عائلة فخورة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-rose-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.activeChallenges}</p>
            <p className="text-xs text-muted-foreground">تحدّي نشط</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalPride.toLocaleString("ar-MA")}</p>
            <p className="text-xs text-muted-foreground">نقاط فخر وطنية</p>
          </CardContent></Card>
        </div>

        <NeighborhoodsClient
          initialDistricts={districtsSerialized}
          initialFamilies={familiesSerialized}
          initialChallenges={challengesSerialized}
          initialStories={storiesSerialized}
          initialBadges={badges}
          loggedIn={!!me}
          userId={me?.id ?? null}
        />
      </section>
    </div>
  );
}
