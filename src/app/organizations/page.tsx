// v70.0 Section 4 — Organizations Directory
// Server component showing Associations + Cooperatives + Wedadiat
// Open-Collective-style transparent ledger previews

import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { PageHero } from "@/components/community/page-hero";
import { Building2, Handshake, Users, TrendingUp, MapPin, CheckCircle2, Coins, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; color: string; icon: any; description: string }> = {
  ASSOCIATION: {
    label: "جمعية",
    color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
    icon: Handshake,
    description: "كيان قانوني وفقاً لقانون 75-00، غير ربحي، يخدم مصلحة عامة",
  },
  COOPERATIVE: {
    label: "تعاونية",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Building2,
    description: "مشروع اقتصادي اجتماعي، يسجل بمكتب تنمية التعاونية ODC",
  },
  WEDADIA: {
    label: "تعاضدية",
    color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    icon: Users,
    description: "كيان تضامني للتغطية الصحية والاجتماعية — الفدرالية الوطنية للتعاضديات",
  },
};

function formatMAD(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " مليون";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + " ألف";
  return String(n);
}

export default async function OrganizationsPage() {
  const orgs = await db.organization.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      region: { select: { nameAr: true, name: true } },
      province: { select: { nameAr: true, name: true } },
    },
    orderBy: [{ verifiedBadge: "desc" }, { membersCount: "desc" }],
  });

  const stats = {
    total: orgs.length,
    members: orgs.reduce((s, o) => s + (o.membersCount || 0), 0),
    raised: orgs.reduce((s, o) => s + (o.totalRaised || 0), 0),
    balance: orgs.reduce((s, o) => s + (o.balance || 0), 0),
  };

  const byType: Record<string, typeof orgs> = { ASSOCIATION: [], COOPERATIVE: [], WEDADIA: [] };
  for (const o of orgs) {
    if (!byType[o.type]) byType[o.type] = [];
    byType[o.type].push(o);
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v70.0 — المنظمات"
        title="منظمات وَصَل الوطنية"
        subtitle="جمعيات وتعاونيات وتعاضديات مغربية شفافة عبر التراب الوطني"
      />

      <section className="container mx-auto max-w-7xl px-4 py-12">
        {/* Aggregate stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="bg-gradient-to-br from-teal-50 to-background dark:from-teal-950/30 dark:to-background">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-teal-700 dark:text-teal-300" />
                </div>
                <span className="text-sm text-muted-foreground">المنظمات</span>
              </div>
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <span className="text-sm text-muted-foreground">المنخرطون</span>
              </div>
              <p className="text-3xl font-bold">{stats.members.toLocaleString("ar-MA")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <span className="text-sm text-muted-foreground">إجمالي المساهمات</span>
              </div>
              <p className="text-3xl font-bold">{formatMAD(stats.raised)} درهم</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                </div>
                <span className="text-sm text-muted-foreground">الرصيد الحالي</span>
              </div>
              <p className="text-3xl font-bold">{formatMAD(stats.balance)} درهم</p>
            </CardContent>
          </Card>
        </div>

        {/* By-type sections */}
        {Object.entries(TYPE_META).map(([typeKey, meta]) => {
          const orgsOfType = byType[typeKey] || [];
          if (orgsOfType.length === 0) return null;
          const Icon = meta.icon;
          return (
            <div key={typeKey} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${meta.color.split(" ").filter(c => c.startsWith("bg-")).join(" ")}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{meta.label}</h2>
                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                </div>
                <Badge variant="secondary" className="mr-auto">{orgsOfType.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orgsOfType.map((org) => (
                  <Link key={org.id} href={`/organizations/${org.slug}`} className="group block h-full">
                    <Card className="h-full hover:border-teal-400 transition-colors hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                              {org.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 line-clamp-2">
                              {org.mission || org.description?.slice(0, 90) + "…"}
                            </CardDescription>
                          </div>
                          {org.verifiedBadge && (
                            <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" aria-label="مؤسسة مؤكدة" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {org.province?.nameAr || org.province?.name}
                            {org.region ? " · " + org.region.nameAr : ""}
                          </span>
                        </div>

                        {/* Tags */}
                        {org.tags && (
                          <div className="flex flex-wrap gap-1">
                            {org.tags.split(",").slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Mini stats */}
                        <Separator />
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground">منخرط</p>
                            <p className="text-sm font-semibold">{org.membersCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">مُجمّع</p>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatMAD(org.totalRaised)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">رصيد</p>
                            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                              {formatMAD(org.balance)}
                            </p>
                          </div>
                        </div>

                        {org.utilitePublique && (
                          <div className="text-[10px] text-center text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded px-2 py-1 bg-amber-50 dark:bg-amber-950/20">
                            منفعة عامة
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <ZelligeDivider />

        <div className="text-center mt-10">
          <Button asChild variant="outline">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة إلى الرئيسية
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
