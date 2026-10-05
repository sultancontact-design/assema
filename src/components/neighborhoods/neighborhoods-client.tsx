"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Flame, TrendingUp, Heart, Calendar, Trophy, Users, MapPin, Star, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface District {
  id: string; districtId: string; districtName: string;
  prideScore: number; prideLevel: string;
  solidarityScore: number; activityScore: number;
  engagementScore: number; familyPrideScore: number; growthScore: number;
  achievements: string;
  cityRank: number; nationalRank: number;
  totalFamilies: number; totalMembers: number;
  weeksAsLeader: number; streak: number;
  lastActivityAt: string | null; updatedAt: string;
}

interface Family {
  id: string; familyId: string; familyName: string;
  districtId: string | null; districtName: string | null;
  city: string | null;
  prideScore: number; prideLevel: string;
  solidarityScore: number; activityScore: number;
  achievementsScore: number; generationsScore: number;
  districtRank: number; cityRank: number; nationalRank: number;
  totalMembers: number; weeksAsLeader: number; streak: number;
  lastActivityAt: string | null;
}

interface Challenge {
  id: string; title: string; description: string | null;
  type: string;
  challengerId: string; challengerName: string;
  challengedId: string | null; challengedName: string | null;
  goalDescription: string; metric: string; targetValue: number;
  challengerProgress: number; challengedProgress: number;
  startsAt: string; endsAt: string;
  status: string; rewardPoints: number;
  participants: string;
}

interface Story {
  id: string; districtId: string; districtName: string;
  familyName: string | null; authorName: string | null;
  title: string; content: string; category: string;
  prideBoost: number; likesCount: number; commentsCount: number;
  isFeatured: boolean; regionName: string | null;
  createdAt: string;
}

interface Badge {
  id: string; slug: string; name: string; nameAr: string;
  description: string | null; icon: string; color: string;
  category: string; rarity: string; pointsAwarded: number;
}

const LEVEL_META: Record<string, { emoji: string; gradient: string }> = {
  "جديد": { emoji: "🌱", gradient: "from-slate-400 to-slate-500" },
  "نشيط": { emoji: "🌿", gradient: "from-teal-500 to-teal-600" },
  "متضامن": { emoji: "🤝", gradient: "from-amber-500 to-amber-600" },
  "بطل": { emoji: "🏆", gradient: "from-rose-500 to-rose-600" },
  "أسطورة": { emoji: "👑", gradient: "from-purple-500 to-pink-500" },
};

const RARITY_COLOR: Record<string, string> = {
  common: "border-slate-300 bg-slate-50 dark:bg-slate-950/30",
  rare: "border-teal-300 bg-teal-50 dark:bg-teal-950/30",
  epic: "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  legendary: "border-purple-300 bg-purple-50 dark:bg-purple-950/30",
};

function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "انتهى";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days} يوم`;
  return `${hours} ساعة`;
}

interface Props {
  initialDistricts: District[];
  initialFamilies: Family[];
  initialChallenges: Challenge[];
  initialStories: Story[];
  initialBadges: Badge[];
  loggedIn: boolean;
  userId: string | null;
}

export function NeighborhoodsClient({ initialDistricts, initialFamilies, initialChallenges, initialStories, initialBadges, loggedIn, userId }: Props) {
  const [tab, setTab] = useState("districts");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 mb-6">
        <TabsTrigger value="districts" className="gap-1"><MapPin className="h-3.5 w-3.5" /> الأحياء</TabsTrigger>
        <TabsTrigger value="families" className="gap-1"><Users className="h-3.5 w-3.5" /> العائلات</TabsTrigger>
        <TabsTrigger value="challenges" className="gap-1"><Trophy className="h-3.5 w-3.5" /> التحدّيات</TabsTrigger>
        <TabsTrigger value="stories" className="gap-1"><Heart className="h-3.5 w-3.5" /> قصص</TabsTrigger>
        <TabsTrigger value="badges" className="gap-1"><Star className="h-3.5 w-3.5" /> الشارات</TabsTrigger>
      </TabsList>

      {/* Districts leaderboard */}
      <TabsContent value="districts">
        <div className="space-y-3">
          {initialDistricts.map((d, i) => {
            const meta = LEVEL_META[d.prideLevel] ?? LEVEL_META["جديد"];
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <Card key={d.id} className={`hover:border-teal-400 transition-colors ${i < 3 ? "border-amber-300/60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-10 shrink-0">
                      <p className="text-2xl font-bold text-muted-foreground">{medal ?? (i + 1)}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shrink-0`}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">{d.districtName}</h3>
                        <Badge variant="outline" className="text-[10px]">{d.prideLevel}</Badge>
                        {d.weeksAsLeader > 0 && (
                          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">
                            <Crown className="h-3 w-3" /> {d.weeksAsLeader} أسبوع
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {d.totalMembers} عضو</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {d.totalFamilies} عائلة</span>
                        {d.streak > 0 && <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {d.streak} يوم</span>}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{d.prideScore}</p>
                      <p className="text-[10px] text-muted-foreground">درجة فخر</p>
                    </div>
                  </div>
                  {/* Sub-scores */}
                  <div className="grid grid-cols-5 gap-1 mt-3">
                    {[
                      { label: "تضامن", val: d.solidarityScore, color: "bg-emerald-500" },
                      { label: "نشاط", val: d.activityScore, color: "bg-teal-500" },
                      { label: "تفاعل", val: d.engagementScore, color: "bg-amber-500" },
                      { label: "عائلات", val: d.familyPrideScore, color: "bg-rose-500" },
                      { label: "نمو", val: d.growthScore, color: "bg-purple-500" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="h-12 bg-muted rounded relative overflow-hidden flex items-end">
                          <div className={`${s.color} absolute inset-x-0 bottom-0`} style={{ height: `${(s.val / 200) * 100}%` }} />
                        </div>
                        <p className="text-[10px] mt-0.5">{s.label}</p>
                        <p className="text-xs font-bold">{s.val}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* Families leaderboard */}
      <TabsContent value="families">
        <div className="space-y-2">
          {initialFamilies.map((f, i) => {
            const meta = LEVEL_META[f.prideLevel] ?? LEVEL_META["نشيط"];
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <Card key={f.id} className="hover:border-amber-400 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold text-muted-foreground">{medal ?? (i + 1)}</div>
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-lg shrink-0`}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">عائلة {f.familyName}</h3>
                        <Badge variant="outline" className="text-[10px]">{f.prideLevel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {f.districtName ?? "—"} · {f.city ?? "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{f.prideScore}</p>
                      <p className="text-[10px] text-muted-foreground">{f.totalMembers} أفراد</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* Challenges */}
      <TabsContent value="challenges">
        <div className="space-y-3">
          {initialChallenges.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد تحدّيات نشطة حالياً</CardContent></Card>
          ) : initialChallenges.map((c) => {
            const challengerPct = Math.min(100, (c.challengerProgress / c.targetValue) * 100);
            const challengedPct = c.challengedProgress ? Math.min(100, (c.challengedProgress / c.targetValue) * 100) : 0;
            return (
              <Card key={c.id} className="hover:border-rose-400 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{c.title}</h3>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                        <span>· ينتهي خلال {formatCountdown(c.endsAt)}</span>
                        {c.rewardPoints > 0 && <span className="text-amber-600">+{c.rewardPoints} نقطة</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">🏆 {c.challengerName}</span>
                        <span>{c.challengerProgress}/{c.targetValue}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-teal-500 to-teal-700" style={{ width: `${challengerPct}%` }} />
                      </div>
                    </div>
                    {c.challengedName && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">⭐ {c.challengedName}</span>
                          <span>{c.challengedProgress}/{c.targetValue}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-rose-500 to-rose-700" style={{ width: `${challengedPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">🎯 {c.goalDescription}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* Stories */}
      <TabsContent value="stories">
        <div className="grid gap-3 md:grid-cols-2">
          {initialStories.length === 0 ? (
            <Card className="md:col-span-2"><CardContent className="p-8 text-center text-muted-foreground">لا توجد قصص بعد — كن أول من يُروي قصة حيه</CardContent></Card>
          ) : initialStories.map((s) => (
            <Card key={s.id} className="hover:border-emerald-400 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm leading-tight">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.districtName}{s.familyName ? " · عائلة " + s.familyName : ""}</p>
                  </div>
                  {s.isFeatured && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">⭐ مميز</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{s.content}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {s.likesCount}</span>
                  <span>· {s.category}</span>
                  {s.prideBoost > 0 && <span className="text-emerald-600 ml-auto">+{s.prideBoost} فخر</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Badges */}
      <TabsContent value="badges">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {initialBadges.map((b) => (
            <Card key={b.id} className={`hover:scale-105 transition-transform ${RARITY_COLOR[b.rarity] ?? RARITY_COLOR.common}`}>
              <CardContent className="p-4 text-center">
                <div className="text-4xl mb-2">{b.icon}</div>
                <h3 className="font-bold text-sm">{b.nameAr}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Badge variant="outline" className="text-[10px]">{b.category}</Badge>
                  <Badge variant="outline" className={`text-[10px] capitalize ${RARITY_COLOR[b.rarity] ?? ""}`}>
                    {b.rarity}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-amber-600 mt-2">+{b.pointsAwarded} نقطة</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
