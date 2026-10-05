// v71.0 Section D — Map of Organizations
// Server component — shows all organizations grouped by region on a map-like grid layout
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/community/page-hero";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { Building2, MapPin, Users, Coins, ArrowLeft, Phone, Mail, Globe, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_COLOR: Record<string, string> = {
  ASSOCIATION: "bg-teal-500",
  COOPERATIVE: "bg-amber-500",
  WEDADIA: "bg-rose-500",
};

const TYPE_LABEL: Record<string, string> = {
  ASSOCIATION: "جمعية",
  COOPERATIVE: "تعاونية",
  WEDADIA: "تعاضدية",
};

export default async function MapOrgsPage() {
  const [orgs, regions] = await Promise.all([
    db.organization.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        region: { select: { id: true, nameAr: true, name: true, slug: true } },
        province: { select: { id: true, nameAr: true, name: true } },
      },
      orderBy: [{ region: { nameAr: "asc" } }, { membersCount: "desc" }],
    }),
    db.region.findMany({
      where: { provinces: { some: {} } },
      orderBy: { nameAr: "asc" },
      select: { id: true, nameAr: true, name: true, slug: true },
    }),
  ]);

  // Group orgs by region
  const byRegion = new Map<string, typeof orgs>();
  for (const o of orgs) {
    const rid = o.regionId ?? "unknown";
    if (!byRegion.has(rid)) byRegion.set(rid, []);
    byRegion.get(rid)!.push(o);
  }

  const stats = {
    total: orgs.length,
    members: orgs.reduce((s, o) => s + (o.membersCount || 0), 0),
    balance: orgs.reduce((s, o) => s + (o.balance || 0), 0),
    regions: byRegion.size,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — خريطة المنظمات"
        title="خريطة المنظمات الوطنية"
        subtitle="25 منظمة مغربية موزعة عبر 12 جهة — استكشف بالقرب منك"
      />

      <section className="container mx-auto max-w-7xl px-4 py-10">
        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 text-teal-700 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">منظمة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.members.toLocaleString("ar-MA")}</p>
            <p className="text-xs text-muted-foreground">منخرط</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Coins className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{(stats.balance / 1000).toFixed(0)} ألف</p>
            <p className="text-xs text-muted-foreground">رصيد (درهم)</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <MapPin className="h-5 w-5 text-rose-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.regions}</p>
            <p className="text-xs text-muted-foreground">جهة</p>
          </CardContent></Card>
        </div>

        {/* Region cards grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => {
            const regionOrgs = byRegion.get(region.id) ?? [];
            if (regionOrgs.length === 0) return null;

            return (
              <Card key={region.id} className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-teal-700 dark:text-teal-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{region.nameAr}</h3>
                      <p className="text-xs text-muted-foreground">{regionOrgs.length} منظمة في الجهة</p>
                    </div>
                  </div>

                  {/* Mini-map: dots representing orgs */}
                  <div className="relative h-24 bg-gradient-to-br from-teal-50 to-background dark:from-teal-950/30 dark:to-background rounded-md mb-3 overflow-hidden border border-teal-200/40 dark:border-teal-900/40">
                    {/* Decorative grid lines */}
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(15,118,110,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                    {/* Org dots positioned pseudo-randomly */}
                    {regionOrgs.map((o, i) => {
                      const x = (i * 17 + 15) % 80 + 10;
                      const y = (i * 23 + 25) % 60 + 15;
                      return (
                        <span
                          key={o.id}
                          title={o.name}
                          className={`absolute h-3 w-3 rounded-full ${TYPE_COLOR[o.type]} ring-2 ring-background shadow-sm`}
                          style={{ left: `${x}%`, top: `${y}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Org list (compact) */}
                  <ul className="space-y-1.5">
                    {regionOrgs.slice(0, 4).map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/organizations/${o.slug}`}
                          className="flex items-center gap-2 text-xs hover:bg-muted/40 rounded px-1 py-1 transition-colors"
                        >
                          <span className={`h-2 w-2 rounded-full ${TYPE_COLOR[o.type]}`} />
                          <span className="flex-1 truncate font-medium">{o.name}</span>
                          {o.verifiedBadge && (
                            <CheckCircle2 className="h-3 w-3 text-teal-600 shrink-0" />
                          )}
                        </Link>
                      </li>
                    ))}
                    {regionOrgs.length > 4 && (
                      <li className="text-xs text-muted-foreground px-1">+ {regionOrgs.length - 4} منظمة أخرى</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ZelligeDivider />

        <div className="text-center mt-8 space-x-2">
          <Button asChild variant="outline">
            <Link href="/organizations" className="gap-2">
              <Building2 className="h-4 w-4" />
              كل المنظمات
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
