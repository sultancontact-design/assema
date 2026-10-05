// ===================================================================
//  /geo — صفحة استكشاف التقسيم الإداري المغربي
//  تعرض هرمياً: الجهات → الأقاليم/العمالات → الجماعات
//  Server Component — يصل مباشرة لـ Prisma، بدون "use client".
// ===================================================================

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, Landmark, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, { ar: string; cls: string }> = {
  urban: { ar: "حضرية", cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800" },
  rural: { ar: "قروية", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  arrondissement: { ar: "مقاطعة", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
};

export default async function GeoPage() {
  // Parallel queries — three trees of the GIS hierarchy
  const [regions, provinces, communes] = await Promise.all([
    db.region.findMany({
      orderBy: { nameAr: "asc" },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        code: true,
        population: true,
        latitude: true,
        longitude: true,
        _count: { select: { provinces: true, communes: true, cities: true } },
      },
    }),
    db.province.findMany({
      orderBy: { nameAr: "asc" },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        regionId: true,
        _count: { select: { communes: true, cities: true } },
      },
    }),
    db.commune.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { nameAr: "asc" }],
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        type: true,
        population: true,
        provinceId: true,
      },
    }),
  ]);

  // Build lookup maps
  const communesByProvince = new Map<string, typeof communes>();
  for (const c of communes) {
    const arr = communesByProvince.get(c.provinceId) ?? [];
    arr.push(c);
    communesByProvince.set(c.provinceId, arr);
  }
  const provincesByRegion = new Map<string, typeof provinces>();
  for (const p of provinces) {
    const arr = provincesByRegion.get(p.regionId) ?? [];
    arr.push(p);
    provincesByRegion.set(p.regionId, arr);
  }

  const totalCommunes = communes.length;
  const totalProvinces = provinces.length;
  const totalRegions = regions.length;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* ===== Hero ===== */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
          <MapPin className="w-5 h-5" aria-hidden />
          <span className="text-sm font-medium tracking-wide uppercase">
            النظام الجغرافي الوطني — v70.0
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          التقسيم الإداري للمملكة المغربية
        </h1>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          استكشف الجهات الـ 12 والأقاليم/العمالات والجماعات (1,503 جماعة على المستوى الوطني).
          النظام الهرمي: الجهة ← الإقليم/العمالة ← الجماعة (حضرية / قروية / مقاطعة).
        </p>
      </header>

      {/* ===== KPI cards ===== */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Landmark className="w-4 h-4" aria-hidden />}
          label="الجهات"
          value={totalRegions}
          accent="text-teal-700 dark:text-teal-300"
        />
        <StatCard
          icon={<Building2 className="w-4 h-4" aria-hidden />}
          label="الأقاليم / العمالات"
          value={totalProvinces}
          accent="text-teal-700 dark:text-teal-300"
        />
        <StatCard
          icon={<MapPin className="w-4 h-4" aria-hidden />}
          label="الجماعات"
          value={totalCommunes}
          accent="text-teal-700 dark:text-teal-300"
        />
        <StatCard
          icon={<Users className="w-4 h-4" aria-hidden />}
          label="إجمالي السكان"
          value={communes.reduce((s, c) => s + (c.population ?? 0), 0)}
          accent="text-teal-700 dark:text-teal-300"
          format
        />
      </section>

      {/* ===== Legend ===== */}
      <Card className="bg-card/60">
        <CardContent className="flex flex-wrap gap-3 text-sm pt-0">
          <span className="font-medium text-muted-foreground self-center">المفتاح:</span>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <span
              key={k}
              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium ${v.cls}`}
            >
              {v.ar} — {k}
            </span>
          ))}
        </CardContent>
      </Card>

      {/* ===== Hierarchical tree: Region → Provinces → Communes ===== */}
      <div className="space-y-8">
        {regions.map((region) => {
          const regionProvinces = provincesByRegion.get(region.id) ?? [];
          const regionCommunesCount = region._count.communes;

          return (
            <section
              key={region.id}
              id={`region-${region.slug}`}
              className="scroll-mt-24"
              aria-labelledby={`region-${region.slug}-title`}
            >
              {/* Region header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-teal-700/30 dark:border-teal-300/20">
                <div className="flex-1">
                  <h2
                    id={`region-${region.slug}-title`}
                    className="text-2xl font-bold text-teal-700 dark:text-teal-300 flex items-baseline gap-2 flex-wrap"
                  >
                    <span>{region.nameAr}</span>
                    {region.nameFr && (
                      <span className="text-base font-normal text-muted-foreground">
                        / {region.nameFr}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {region._count.provinces} إقليم/عمالة • {regionCommunesCount} جماعة
                    {region._count.cities > 0 && ` • ${region._count.cities} مدينة`}
                    {region.population ? ` • ${region.population.toLocaleString("en-US")} نسمة` : ""}
                  </p>
                </div>
                {region.code && (
                  <span className="text-xs font-mono text-muted-foreground/70 border border-border px-2 py-1 rounded">
                    HCP: {region.code}
                  </span>
                )}
              </div>

              {/* Provinces grid */}
              {regionProvinces.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-4">
                  لا توجد أقاليم مسجلة بعد لهذه الجهة.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regionProvinces.map((p) => {
                    const pCommunes = communesByProvince.get(p.id) ?? [];
                    return (
                      <Card
                        key={p.id}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-baseline justify-between gap-2">
                            <span className="text-lg text-foreground">
                              {p.nameAr}
                            </span>
                            <span className="text-xs font-normal text-teal-700 dark:text-teal-300 shrink-0">
                              {p._count.communes} جماعة
                            </span>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {p.nameFr ?? p.name}
                            {p._count.cities > 0 && ` • ${p._count.cities} مدينة`}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {pCommunes.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                              لا جماعات مسجلة.
                            </p>
                          ) : (
                            <ul
                              className="space-y-1.5 max-h-64 overflow-y-auto pr-1
                                         [&::-webkit-scrollbar]:w-1.5
                                         [&::-webkit-scrollbar-thumb]:rounded-full
                                         [&::-webkit-scrollbar-thumb]:bg-teal-700/30 dark:[&::-webkit-scrollbar-thumb]:bg-teal-300/30
                                         [&::-webkit-scrollbar-track]:bg-transparent"
                              role="list"
                            >
                              {pCommunes.map((c) => {
                                const t = TYPE_LABELS[c.type] ?? TYPE_LABELS.rural;
                                return (
                                  <li
                                    key={c.id}
                                    className="flex items-center justify-between gap-2 py-1 border-b border-border/40 last:border-0"
                                  >
                                    <a
                                      href={`/api/geo/communes/${c.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm hover:text-teal-700 dark:hover:text-teal-300 transition-colors truncate"
                                    >
                                      <span className="font-medium">{c.nameAr}</span>
                                      {c.nameFr && c.nameFr !== c.name && (
                                        <span className="text-xs text-muted-foreground ms-2">
                                          {c.nameFr}
                                        </span>
                                      )}
                                    </a>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${t.cls}`}
                                      aria-label={`النوع: ${t.ar}`}
                                    >
                                      {t.ar}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ===== Footer note ===== */}
      <Card className="bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/40">
        <CardContent className="text-sm text-muted-foreground leading-relaxed pt-0">
          <p className="font-medium text-teal-700 dark:text-teal-300 mb-1">
            ملاحظة حول البيانات
          </p>
          <p>
            البيانات المعروضة عيّنة تمثيلية (~{totalCommunes} جماعة من أصل 1,503 جماعة على المستوى الوطني).
            تستند الأرقام الإدارية إلى التقسيم الرسمي للمملكة (HCP — المندوبية السامية للتخطيط، 2015+).
            يمكنك الاطلاع على تفاصيل أي جماعة عبر نقطة النهاية{" "}
            <code className="text-xs px-1 py-0.5 rounded bg-muted font-mono">
              GET /api/geo/communes/&lt;slug&gt;
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================================================================
//  StatCard — small KPI tile
// ===================================================================
function StatCard({
  icon,
  label,
  value,
  accent,
  format = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  format?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-0">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${accent}`}>
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {format
            ? value.toLocaleString("en-US")
            : value}
        </div>
      </CardContent>
    </Card>
  );
}
