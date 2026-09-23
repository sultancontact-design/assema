// ===================================================================
//  صفحة الخريطة — /community/map
//  Server Component — خريطة مراكش التفاعلية + خريطة المغرب
//  (touch-2: forced HMR recompile after Prisma schema update)
//  - العنوان: "خريطة أحياء مراكش"
//  - خريطة مراكش الـ5 أحياء (MarrakechMap)
//  - إحصاءات مجمّعة (كل الأحياء)
//  - ZelligeDivider
//  - خريطة المغرب (MoroccoMap)
// ===================================================================

import Link from "next/link";
import {
  Users,
  Home as HomeIcon,
  HandHeart,
  MapPin,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { getFundStats } from "@/lib/fund-stats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  MarrakechMap,
  type MarrakechDistrictDatum,
} from "@/components/community/marrakech-map";
import {
  MoroccoMap,
  type MoroccoRegionDatum,
} from "@/components/community/morocco-map";
import {
  GeolocationButton,
  type GeolocationDistrictRef,
} from "@/components/community/geolocation-button";
import { MOROCCO_REGIONS } from "@/lib/morocco-regions";
import { formatMAD, formatNumber } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خريطة أحياء مراكش — سيدي يوسف بن علي العاصمة",
  description:
    "خريطة تفاعلية لأحياء مراكش الخمسة وخريطة المغرب الـ12 جهة — استكشف أحياء المدينة وانضمّ لحَيِّك.",
};

function statCard(
  label: string,
  value: string,
  icon: React.ReactNode,
  tone: "primary" | "secondary" | "accent"
) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "secondary"
        ? "text-secondary"
        : "text-accent";
  return (
    <Card className="warm-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted/60 p-2">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-heading text-2xl font-bold ${color}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MapPage() {
  // 1) جلب كل أحياء مراكش النشطة
  const districts = await db.district.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      slug: true,
      name: true,
      nameAr: true,
      nameFr: true,
      population: true,
      members: true,
      familiesCount: true,
      contributions: true,
      boundarySvg: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 2) تحويل البيانات لشكل MarrakechMap
  const marrakechData: MarrakechDistrictDatum[] = districts.map((d) => ({
    slug: d.slug,
    nameAr: d.nameAr ?? d.name,
    nameFr: d.nameFr ?? d.name,
    members: d.members,
    familiesCount: d.familiesCount,
    contributions: d.contributions,
    population: d.population,
    boundarySvg: d.boundarySvg ?? defaultBoundary(d.slug),
  }));

  // 3) إحصاءات مجمّعة لكل أحياء مراكش
  const totalMembers = marrakechData.reduce((s, d) => s + d.members, 0);
  const totalFamilies = marrakechData.reduce((s, d) => s + d.familiesCount, 0);
  const totalContributions = marrakechData.reduce(
    (s, d) => s + d.contributions,
    0
  );
  const totalPopulation = marrakechData.reduce(
    (s, d) => s + (d.population ?? 0),
    0
  );

  // 4) صندوق المعروف عبر كل الأحياء (نفس مصدر الإحصاء)
  const fundStats = await getFundStats();

  // 5) تجميع العدد حسب الجهة لخريطة المغرب
  // كل الأحياء في مراكش-آسفي — نعطيهم لمراكش-آسفي
  const membersByRegion: Record<string, number> = {};
  const districtsByRegion: Record<string, number> = {};
  for (const d of districts) {
    // منطق مبسّط: كل الأحياء المسجّلة حالياً في المنصة = جهة مراكش-آسفي
    const regionSlug = "marrakech-safi";
    membersByRegion[regionSlug] =
      (membersByRegion[regionSlug] ?? 0) + d.members;
    districtsByRegion[regionSlug] =
      (districtsByRegion[regionSlug] ?? 0) + 1;
  }

  const moroccoRegions: MoroccoRegionDatum[] = MOROCCO_REGIONS.map((r) => ({
    slug: r.slug,
    nameAr: r.nameAr,
    nameFr: r.nameFr,
    members: membersByRegion[r.slug] ?? 0,
    districtsCount: districtsByRegion[r.slug] ?? 0,
    boundarySvg: r.boundarySvg,
    isPrimary: r.isPrimary,
  }));

  // 6) مراجع الأحياء للزر GeolocationButton (يحسب المركز التقريبي لكل حي)
  const geolocationRefs: GeolocationDistrictRef[] = marrakechData.map((d) => {
    const c = centroidFromBoundary(d.boundarySvg);
    return {
      slug: d.slug,
      nameAr: d.nameAr,
      nameFr: d.nameFr,
      centerX: c?.x ?? 200,
      centerY: c?.y ?? 200,
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      {/* العنوان */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="size-3" />
              مراكش
            </Badge>
            <span className="text-xs text-muted-foreground">
              5 أحياء · 12 جهة
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            خريطة أحياء مراكش
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            استكشف أحياء المدينة العتيقة، اختر حيّك وانضمّ إلى مجتمعك المحلّي.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden min-h-11 sm:inline-flex"
        >
          <Link href="/community">
            <ChevronLeft className="size-4" />
            رجوع للمجتمع
          </Link>
        </Button>
      </div>

      {/* خريطة مراكش */}
      <Card className="warm-shadow">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              مراكش — أحياء المدينة
            </CardTitle>
            <GeolocationButton districts={geolocationRefs} />
          </div>
        </CardHeader>
        <CardContent>
          <MarrakechMap
            districts={marrakechData}
            className="max-w-2xl mx-auto"
          />
        </CardContent>
      </Card>

      {/* إحصاءات مجمّعة */}
      <section className="mt-6">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          إحصاءات مجمّعة عبر كل الأحياء
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCard(
            "إجمالي الأعضاء",
            formatNumber(totalMembers),
            <Users className="size-5 text-primary" />,
            "primary"
          )}
          {statCard(
            "إجمالي الأسر",
            formatNumber(totalFamilies),
            <HomeIcon className="size-5 text-secondary" />,
            "secondary"
          )}
          {statCard(
            "إجمالي المساهمات",
            formatMAD(totalContributions),
            <HandHeart className="size-5 text-accent" />,
            "accent"
          )}
          {statCard(
            "إجمالي السكان",
            formatNumber(totalPopulation),
            <Sparkles className="size-5 text-primary" />,
            "primary"
          )}
        </div>
      </section>

      {/* رصيد صندوق المعروف */}
      <Card className="mt-4 warm-shadow border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                رصيد صندوق المعروف (كل الأحياء)
              </p>
              <p className="font-heading text-2xl font-bold text-primary">
                {formatMAD(fundStats.balance)}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">
                مصروف هذا الشهر
              </p>
              <p className="font-heading text-lg font-bold text-accent">
                {formatMAD(fundStats.thisMonthDisbursed)}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="min-h-11"
            >
              <Link href="/community/fund">
                <HandHeart className="size-4" />
                تفاصيل الصندوق
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ZelligeDivider variant="stars" className="my-10" />

      {/* خريطة المغرب */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            خريطة المغرب
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            12 جهة حسب التقسيم الإداري 2015 — جهة مراكش-آسفي مُبرَزة.
          </p>
        </div>
        <Card className="warm-shadow">
          <CardContent className="p-4 md:p-6">
            <MoroccoMap regions={moroccoRegions} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

/** boundarySvg افتراضي لو لم يُعترَض في DB */
function defaultBoundary(slug: string): string {
  const map: Record<string, string> = {
    "sidi-youssef-ben-ali":
      "M 200 290 L 290 260 L 370 300 L 340 380 L 220 375 L 180 330 Z",
    medina: "M 160 130 L 270 130 L 290 200 L 250 250 L 170 250 L 140 200 Z",
    guelize: "M 30 30 L 170 40 L 180 160 L 90 170 L 30 110 Z",
    menara: "M 30 210 L 150 200 L 200 290 L 180 360 L 60 350 L 30 280 Z",
    annakhil: "M 290 90 L 380 100 L 390 240 L 300 250 L 280 170 Z",
  };
  return map[slug] ?? "M 0 0 L 100 0 L 100 100 L 0 100 Z";
}

/** يحسب المركز التقريبي لمسار SVG بسيط */
function centroidFromBoundary(
  path: string
): { x: number; y: number } | null {
  try {
    const tokens = path.match(/-?\d*\.?\d+(?:\s+-?\d*\.?\d+)?/g);
    if (!tokens || tokens.length === 0) return null;
    const nums: number[] = [];
    for (const t of tokens) {
      const parts = t.trim().split(/\s+|,/).filter(Boolean);
      for (const p of parts) {
        const n = parseFloat(p);
        if (!Number.isNaN(n)) nums.push(n);
      }
    }
    if (nums.length < 4 || nums.length % 2 !== 0) return null;
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (let i = 0; i < nums.length; i += 2) {
      sx += nums[i];
      sy += nums[i + 1];
      count += 1;
    }
    return { x: sx / count, y: sy / count };
  } catch {
    return null;
  }
}
