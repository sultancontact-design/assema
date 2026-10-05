// v72.0 — Reputation Leaderboard (الأنشط والأكثر ثقة)
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp, Award, Sparkles, Shield, Heart, MessageSquare, Coins, Car, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const LEVEL_META: Record<string, { label: string; color: string; icon: any }> = {
  newcomer: { label: "جديد", color: "text-slate-600 bg-slate-100 dark:bg-slate-900/30", icon: Sparkles },
  contributor: { label: "مساهم", color: "text-teal-700 bg-teal-100 dark:bg-teal-900/30", icon: TrendingUp },
  trusted: { label: "موثوق", color: "text-amber-700 bg-amber-100 dark:bg-amber-900/30", icon: Shield },
  expert: { label: "خبير", color: "text-rose-700 bg-rose-100 dark:bg-rose-900/30", icon: Star },
  luminary: { label: "منار", color: "text-purple-700 bg-purple-100 dark:bg-purple-900/30", icon: Trophy },
};

const ACTIVITY_META: Record<string, { label: string; icon: any; color: string }> = {
  endorsementsReceived: { label: "تأييدات", icon: Heart, color: "text-rose-600" },
  transactionsCompleted: { label: "صفقات بنك الوقت", icon: Coins, color: "text-amber-600" },
  ledgerEntriesCount: { label: "قيود مالية", icon: FileText, color: "text-teal-600" },
  pollsCreated: { label: "استطلاعات", icon: TrendingUp, color: "text-indigo-600" },
  lostFoundResolved: { label: "ضائع حُلّ", icon: Shield, color: "text-emerald-600" },
  carpoolsCompleted: { label: "رحلات", icon: Car, color: "text-cyan-600" },
  blogsPublished: { label: "مقالات", icon: MessageSquare, color: "text-purple-600" },
  daysActive: { label: "أيام نشطة", icon: Sparkles, color: "text-orange-600" },
};

export default async function ReputationLeaderboardPage() {
  const scores = await db.reputationScore.findMany({
    orderBy: [{ score: "desc" }],
    take: 30,
  });

  const stats = {
    total: scores.length,
    luminary: scores.filter(s => s.level === "luminary").length,
    expert: scores.filter(s => s.level === "expert").length,
    trusted: scores.filter(s => s.level === "trusted").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="v72.0 — الثقة" title="لوحة الأكثر نشاطاً وثقة" subtitle="من يحمل أرقى ألقاب الثقة في وَصَل — مغاربة فعلاً يبنون الوطن" />

      <section className="container mx-auto max-w-5xl px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center"><Trophy className="h-5 w-5 text-purple-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.luminary}</p><p className="text-xs text-muted-foreground">منار</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Star className="h-5 w-5 text-rose-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.expert}</p><p className="text-xs text-muted-foreground">خبير</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Shield className="h-5 w-5 text-amber-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.trusted}</p><p className="text-xs text-muted-foreground">موثوق</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 text-teal-700 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">إجمالي</p></CardContent></Card>
        </div>

        {/* Top 3 podium */}
        {scores.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
            {[1, 0, 2].map((idx) => {
              const s = scores[idx];
              if (!s) return null;
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
              const height = idx === 0 ? "md:h-44" : "md:h-36";
              const level = LEVEL_META[s.level] ?? LEVEL_META.newcomer;
              return (
                <Card key={s.id} className={`text-center ${height} ${idx === 0 ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20" : ""} flex flex-col items-center justify-end`}>
                  <CardContent className="p-4">
                    <div className="text-4xl mb-2">{medal}</div>
                    <p className="font-bold text-sm truncate">{s.userId.replace("demo-user-", "عضو ")}</p>
                    <p className="text-2xl font-bold mt-1">{s.score}</p>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${level.color}`}>{level.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Full leaderboard */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2"><Award className="h-5 w-5 text-amber-600" /> كل الأعضاء</h3>
            </div>
            <ul className="divide-y">
              {scores.map((s, i) => {
                const level = LEVEL_META[s.level] ?? LEVEL_META.newcomer;
                const Icon = level.icon;
                return (
                  <li key={s.id} className="p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                    <span className="text-sm font-bold w-6 text-muted-foreground">#{i+1}</span>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${level.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.userId.replace("demo-user-", "عضو ")}</p>
                      <Badge variant="outline" className={`text-[10px] ${level.color}`}>{level.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {Object.entries(ACTIVITY_META).slice(0, 4).map(([key, meta]) => {
                        const val = (s as any)[key];
                        if (!val) return null;
                        const I = meta.icon;
                        return (
                          <span key={key} className="flex items-center gap-1">
                            <I className={`h-3 w-3 ${meta.color}`} />
                            {val}
                          </span>
                        );
                      })}
                    </div>
                    <span className="font-bold text-teal-700 dark:text-teal-300">{s.score}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Activity legend */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold mb-3 text-muted-foreground">مؤشرات الثقة</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(ACTIVITY_META).map(([key, meta]) => {
                const I = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <I className={`h-4 w-4 ${meta.color}`} />
                    <span>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Users(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
