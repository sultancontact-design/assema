import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Home, Flame, Heart, Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/discover");

  const [existingFollows, suggestedUsers, families, trendingFeed] = await Promise.all([
    db.follow.findMany({ where: { followerId: user.id, targetType: "USER" }, select: { followingId: true } }),
    db.user.findMany({ where: { id: { not: user.id, notIn: [] }, deletedAt: null, status: "ACTIVE" }, select: { id: true, fullName: true, avatar: true, bio: true, followersCount: true, district: { select: { name: true, nameAr: true } } }, take: 12, orderBy: { followersCount: "desc" } }),
    db.family.findMany({ take: 6, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" } }),
    db.feedItem.findMany({ where: { visibility: { in: ["PUBLIC", "DISTRICT"] } }, orderBy: { likes: "desc" }, take: 6, include: { user: { select: { id: true, fullName: true, avatar: true } } } }),
  ]);

  const followingIds = new Set(existingFollows.map(f => f.followingId));
  const filtered = suggestedUsers.filter(u => !followingIds.has(u.id));

  return (
    <div className="flex flex-col">
      <PageHero title="اكتشف" subtitle="جيران قد تعرفهم + عائلات الحي + الأكثر تفاعلاً" image="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80" imageAlt="اكتشف" badge="اقتراحات" />
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8 space-y-6">
        <Card><CardContent className="p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Users className="size-5 text-primary" />جيران قد تعرفهم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30">
                <Link href={`/u/${u.id}`}><div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">{u.avatar ? <img src={u.avatar} alt={u.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{u.fullName.slice(0,1)}</div>}</div></Link>
                <div className="flex-1 min-w-0"><Link href={`/u/${u.id}`} className="font-bold text-sm hover:underline block truncate">{u.fullName}</Link><p className="text-xs text-muted-foreground truncate">{u.district?.nameAr ?? u.district?.name ?? "—"} · {u.followersCount} متابع</p></div>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Home className="size-5 text-amber-600" />عائلات الحي</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {families.map(f => (
              <Link key={f.id} href={`/families/${f.id}`} className="p-4 rounded-xl border border-border hover:bg-muted/30 text-center transition-colors">
                <Home className="size-8 mx-auto mb-2 text-amber-600" />
                <p className="font-bold text-sm">{f.familyName}</p>
                <p className="text-xs text-muted-foreground">{f._count.members} أعضاء</p>
              </Link>
            ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Flame className="size-5 text-orange-500" />الأكثر تفاعلاً</h2>
          <div className="space-y-3">
            {trendingFeed.map(item => (
              <Link key={item.id} href="/feed" className="block p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">{item.user?.avatar ? <img src={item.user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{item.user?.fullName?.slice(0,1)}</div>}</div>
                  <span className="font-bold text-sm">{item.user?.fullName || "مستخدم"}</span>
                </div>
                <p className="text-sm line-clamp-2">{item.content || "(لا نصص)"}</p>
                <div className="text-xs text-muted-foreground mt-1 flex gap-3"><span className="flex items-center gap-1"><Heart className="size-3" />{item.likes}</span><span className="flex items-center gap-1"><Eye className="size-3" />{item.views}</span></div>
              </Link>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
