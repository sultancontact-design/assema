import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Crown, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "لوحة المتصدرين",
  description: "ترتيب أعضاء الحي حسب النقاط — الأسبوعي والشهري والسنوي.",
};

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/leaderboard");

  const [topUsers, totalUsers, districtLeaders] = await Promise.all([
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { points: "desc" },
      take: 10,
      select: {
        id: true, fullName: true, points: true, level: true,
        district: { select: { name: true, nameAr: true } },
      },
    }),
    db.user.count({ where: { deletedAt: null } }),
    db.district.findMany({
      where: { isActive: true },
      orderBy: { members: "desc" },
      select: { id: true, name: true, nameAr: true, members: true, slug: true },
    }),
  ]);

  const userRank = topUsers.findIndex((u) => u.id === user.id) + 1;

  return (
    <div className="flex flex-col">
      <PageHero
        title="لوحة المتصدرين"
        subtitle="ترتيب أعضاء الحي حسب النقاط — منافسة شريفة على الخير والعطاء."
        image="https://images.unsplash.com/photo-1551269901-5c5e14c25b58?auto=format&fit=crop&w=1920&q=80"
        imageAlt="لوحة المتصدرين — منافسة على الخير"
        badge={`${totalUsers} عضو`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ترتيب المستخدم الحالي */}
        {userRank > 0 && userRank <= 10 && (
          <Card className="border-s-4 border-s-primary bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="size-6 text-accent" />
                <div>
                  <p className="font-heading font-bold text-foreground">أنت في المرتبة #{userRank}</p>
                  <p className="text-xs text-muted-foreground">من أصل {totalUsers} عضو في الحي</p>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground">{user.points} نقطة</Badge>
            </CardContent>
          </Card>
        )}

        {/* Bento: Top 10 (8-col) + district leaders (4-col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Top 10 leaderboard */}
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="size-5 text-accent" />
              <h2 className="font-heading text-lg font-bold text-foreground">أفضل 10 أعضاء</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {topUsers.map((u, idx) => {
                    const rank = idx + 1;
                    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                    const isCurrentUser = u.id === user.id;
                    return (
                      <li
                        key={u.id}
                        className={`flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors ${isCurrentUser ? "bg-primary/5 border-s-4 border-s-primary" : ""}`}
                      >
                        <div className="w-10 text-center">
                          {medal ? <span className="text-2xl">{medal}</span> : <span className="font-heading font-extrabold text-muted-foreground text-lg">{rank}</span>}
                        </div>
                        <div className={`grid size-11 place-items-center rounded-full text-base font-bold shrink-0 ${
                          rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                          : rank === 2 ? "bg-slate-200 text-slate-700 dark:bg-slate-900/30"
                          : rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                          : "bg-primary/10 text-primary"
                        }`}>
                          {u.fullName.slice(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                            {u.fullName}
                            {isCurrentUser && <span className="text-[10px] text-primary ms-2">(أنت)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            مستوى {u.level} · {u.district?.nameAr ?? u.district?.name ?? "—"}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="font-heading font-extrabold text-primary tabular-nums text-lg">{u.points}</p>
                          <p className="text-[10px] text-muted-foreground">نقطة</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* District leaders sidebar */}
          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-5 text-secondary" />
              <h2 className="font-heading text-lg font-bold text-foreground">ترتيب الأحياء</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {districtLeaders.map((d, idx) => {
                    const rank = idx + 1;
                    return (
                      <li key={d.id} className="flex items-center gap-3 p-4">
                        <div className="w-8 text-center">
                          <span className="font-heading font-bold text-muted-foreground">{rank}</span>
                        </div>
                        <div className="grid size-9 place-items-center rounded-full bg-secondary/10 text-secondary text-xs font-bold shrink-0">
                          <MapPin className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground">{d.nameAr ?? d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.members} عضو</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
