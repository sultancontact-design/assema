import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/constants";
import { Users, UserPlus, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "المتابعة" };

export default async function FollowingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/following");

  const [following, followers] = await Promise.all([
    db.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, fullName: true, district: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, fullName: true, district: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHero title="المتابعة" subtitle="من تتابع ومن يتابعك — اكتشف أبناء الحي وتواصل معهم." image="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=80" imageAlt="المتابعة" badge={`${following.length} متابَع · ${followers.length} متابِع`} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Following */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2"><UserCheck className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold text-foreground">من أتابع ({following.length})</h2></div>
            <CardContent className="p-0">
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {following.length === 0 ? (
                  <li className="p-6 text-center text-sm text-muted-foreground">لا تتابع أحداً بعد</li>
                ) : (
                  following.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{f.following.fullName.slice(0, 1)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{f.following.fullName}</p>
                        <p className="text-xs text-muted-foreground">{f.following.district?.name ?? "—"}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2"><Users className="size-5 text-secondary" /><h2 className="font-heading text-lg font-bold text-foreground">من يتابعني ({followers.length})</h2></div>
            <CardContent className="p-0">
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {followers.length === 0 ? (
                  <li className="p-6 text-center text-sm text-muted-foreground">لا يوجد متابعون بعد</li>
                ) : (
                  followers.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <span className="grid size-10 place-items-center rounded-full bg-secondary/10 text-secondary text-sm font-bold shrink-0">{f.follower.fullName.slice(0, 1)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{f.follower.fullName}</p>
                        <p className="text-xs text-muted-foreground">{f.follower.district?.name ?? "—"}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
