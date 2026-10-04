// v70.0 Section 5 — Network Discovery Page (server component)
// Shows: how networking works + (when logged in) recommendations
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NetworkClient } from "@/components/network/network-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, MapPin, Tags, Users, Building2, GitBranch } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const me = await getCurrentUser();

  // If logged in, fetch initial recommendations server-side
  let initialRecs: any[] = [];
  if (me) {
    const meFull = await db.user.findUnique({
      where: { id: me.id },
      select: {
        id: true,
        name: true,
        regionId: true,
        cityId: true,
        profileTags: { take: 20 },
      },
    });

    if (meFull) {
      const myTagSet = new Set(
        meFull.profileTags.map((t) => `${t.tagType}:${t.tag.toLowerCase()}`)
      );

      const myOrgs = await db.organizationMember.findMany({
        where: { userId: me.id, isActive: true },
        select: { organizationId: true },
        take: 10,
      });
      const myOrgSet = new Set(myOrgs.map((o) => o.organizationId));

      const myFollowsRaw = await db.follow.findMany({
        where: { followerId: me.id },
        select: { followingId: true },
        take: 200,
      });
      const myFollowSet = new Set(myFollowsRaw.map((f) => f.followingId));

      const candidatesRaw = await db.user.findMany({
        where: {
          id: { not: me.id },
          isActive: true,
          OR: [
            { profileTags: { some: {} } },
            ...(meFull.regionId ? [{ regionId: meFull.regionId }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          bio: true,
          avatar: true,
          regionId: true,
          cityId: true,
          region: { select: { id: true, nameAr: true, name: true, slug: true } },
          city: { select: { id: true, nameAr: true, name: true, slug: true } },
          profileTags: { take: 10 },
          organizationMembers: {
            take: 5,
            select: { organizationId: true, role: true },
          },
        },
        take: 50,
      });

      initialRecs = candidatesRaw
        .filter((c) => !myFollowSet.has(c.id))
        .map((c) => {
          const theirTagSet = new Set(
            c.profileTags.map((t) => `${t.tagType}:${t.tag.toLowerCase()}`)
          );
          const sharedTags = [...myTagSet].filter((t) => theirTagSet.has(t));
          const scoreTags = myTagSet.size > 0 ? sharedTags.length / Math.max(1, myTagSet.size) : 0;
          let scoreGeo = 0;
          if (meFull.regionId && c.regionId === meFull.regionId) scoreGeo += 0.5;
          if (meFull.cityId && c.cityId === meFull.cityId) scoreGeo += 0.5;
          const sharedOrgs = c.organizationMembers.filter((om) => myOrgSet.has(om.organizationId));
          const scoreOrg = Math.min(sharedOrgs.length * 0.3, 1.0);
          const score = scoreTags * 0.4 + scoreGeo * 0.3 + scoreOrg * 0.2;

          const reasons: string[] = [];
          if (sharedTags.length > 0) reasons.push(`${sharedTags.length} اهتمام مشترك`);
          if (meFull.regionId && c.regionId === meFull.regionId) reasons.push("نفس الجهة");
          if (meFull.cityId && c.cityId === meFull.cityId) reasons.push("نفس المدينة");
          if (sharedOrgs.length > 0) reasons.push(`${sharedOrgs.length} منظمة مشتركة`);

          return {
            userId: c.id,
            name: c.name,
            avatar: c.avatar,
            bio: c.bio,
            region: c.region,
            city: c.city,
            score: Number(score.toFixed(3)),
            reasons: reasons.join(" · ") || "توصياتك",
            sharedTags: sharedTags.slice(0, 3),
          };
        })
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
    }
  }

  // For guests — show featured public figures / influencers on the platform
  const publicFigures = me
    ? []
    : await db.user.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          bio: true,
          avatar: true,
          region: { select: { nameAr: true, name: true, slug: true } },
          city: { select: { nameAr: true, name: true, slug: true } },
        },
      });

  // Stats
  const stats = {
    members: await db.user.count({ where: { isActive: true } }),
    organizations: await db.organization.count({ where: { isActive: true } }),
    regions: await db.region.count(),
    communes: await db.commune.count(),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v70.0 — التعارف الوطني"
        title="شبكة وَصَل الوطنية"
        subtitle="تعرّف على مغاربة يشاركونك الاهتمامات والجهة والمنظمات"
      />

      <section className="container mx-auto max-w-7xl px-4 py-12">
        {/* How it works */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Tags, title: "تصفية تعاونية", desc: "نطابق الاهتمامات والمهارات المشتركة", color: "text-teal-700" },
            { icon: MapPin, title: "قرب جغرافي", desc: "نفس الجهة أو المدينة أو الجماعة", color: "text-amber-600" },
            { icon: Building2, title: "منظمات مشتركة", desc: "نفس الجمعية أو التعاونية", color: "text-rose-600" },
            { icon: GitBranch, title: "رسم بياني", desc: "أصدقاء أصدقائك (درجة ثانية)", color: "text-emerald-600" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-muted/40 hover:border-teal-300 transition-colors">
                <CardContent className="p-5">
                  <Icon className={`h-8 w-8 ${f.color} mb-3`} />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Network stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 text-teal-700 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.members}</p><p className="text-xs text-muted-foreground">عضو</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Building2 className="h-5 w-5 text-amber-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.organizations}</p><p className="text-xs text-muted-foreground">منظمة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><MapPin className="h-5 w-5 text-rose-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.regions}</p><p className="text-xs text-muted-foreground">جهة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Network className="h-5 w-5 text-emerald-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.communes}</p><p className="text-xs text-muted-foreground">جماعة</p></CardContent></Card>
        </div>

        {/* Recommendations (auth required) */}
        {me ? (
          <NetworkClient initialRecs={initialRecs} />
        ) : (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-teal-50 to-background dark:from-teal-950/30">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">سجّل دخول لتحصل على توصيات مخصّصة</h2>
                <p className="text-muted-foreground mb-4">نحتاج لمعرفة اهتماماتك وجهتك لإيجاد مغاربة يشاركونك المسار</p>
                <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-teal-700 text-white hover:bg-teal-800 transition-colors">
                  دخول
                </a>
                <span className="mx-2 text-muted-foreground text-sm">أو</span>
                <a href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-teal-700 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors">
                  حساب جديد
                </a>
              </CardContent>
            </Card>

            {/* Public figures preview */}
            <div>
              <h3 className="text-lg font-semibold mb-3">بعض أعضاء وَصَل</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicFigures.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-semibold text-lg">
                          {(u.name || "؟").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{u.name || "مجهول"}</p>
                          {u.region && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{u.region.nameAr || u.region.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {u.bio && <p className="text-sm text-muted-foreground line-clamp-3">{u.bio}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
