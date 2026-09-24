// ===================================================================
//  صفحة الخريطة ثلاثية الأبعاد — /community/map-3d
//  Server Component — يعرض Map3D + جدول إحصاءات الأحياء + رابط للخريطة 2D
// ===================================================================

import Link from "next/link";
import { ChevronLeft, Map as MapIcon, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { Map3D, type DistrictMarker } from "@/components/community/map-3d";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خريطة ثلاثية الأبعاد لمراكش",
  description:
    "استكشف أحياء مراكش على خريطة ثلاثية الأبعاد — 5 أحياء مع علامات نابضة ومعلومات الأعضاء.",
};

// إحداثيات أحياء مراكش (افتراضية قابلة للتحديث من قاعدة البيانات لاحقاً)
const DISTRICT_COORDS: Record<
  string,
  { latitude: number; longitude: number; nameFr: string }
> = {
  "sidi-youssef-ben-ali": {
    latitude: 31.6295,
    longitude: -7.9811,
    nameFr: "Sidi Youssef Ben Ali",
  },
  medina: {
    latitude: 31.6320,
    longitude: -7.9890,
    nameFr: "Médina",
  },
  guelize: {
    latitude: 31.6340,
    longitude: -8.0089,
    nameFr: "Guéliz",
  },
  menara: {
    latitude: 31.6160,
    longitude: -8.0200,
    nameFr: "Ménara",
  },
  annakhil: {
    latitude: 31.6530,
    longitude: -7.9900,
    nameFr: "Annakhil",
  },
};

export default async function Map3DPage() {
  // جلب الأحياء من قاعدة البيانات
  const allDistricts = await db.district
    .findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        slug: true,
        name: true,
        nameAr: true,
        nameFr: true,
        members: true,
        familiesCount: true,
        population: true,
        contributions: true,
      },
      orderBy: { createdAt: "asc" },
    })
    .catch(() => [] as never[]);

  // بناء بيانات العلامات
  const markers: DistrictMarker[] = (allDistricts as any[]).map((d) => {
    const coords = DISTRICT_COORDS[d.slug] ?? {
      latitude: 31.6295,
      longitude: -7.9811,
      nameFr: d.nameFr ?? "",
    };
    return {
      slug: d.slug,
      name: d.nameAr ?? d.name,
      nameFr: d.nameFr ?? coords.nameFr,
      members: d.members ?? 0,
      families: d.familiesCount ?? 0,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  });

  const totalMembers = markers.reduce((s, m) => s + m.members, 0);
  const totalFamilies = markers.reduce((s, m) => s + m.families, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      {/* رأس الصفحة */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link
          href="/community/map"
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="size-4" />
          خريطة ثنائية الأبعاد
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">خريطة ثلاثية الأبعاد</span>
      </div>

      <header className="text-center mb-6">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 mb-3"
        >
          <MapIcon className="size-3 ms-1.5" />
          خريطة ثلاثية الأبعاد
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
          خريطة ثلاثية الأبعاد لمراكش
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          استكشف أحياء مراكش بتجسيم ثلاثي الأبعاد. انقر على علامة الحيّ لعرض
          معلومات الأعضاء والأسر. تكبير/تصغير/تدوير عبر أزرار التحكّم.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* الخريطة */}
      <Card className="warm-shadow">
        <CardHeader className="border-b border-border pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapIcon className="size-4 text-primary" />
            أحياء مراكش — عرض ثلاثي الأبعاد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Map3D districts={markers} desktopHeight={500} mobileHeight={300} />
        </CardContent>
      </Card>

      {/* إحصاءات مختصرة */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">عدد الأحياء</p>
            <p className="font-heading text-xl font-bold text-primary">
              {formatNumber(markers.length)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">إجمالي الأعضاء</p>
            <p className="font-heading text-xl font-bold text-secondary">
              {formatNumber(totalMembers)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">إجمالي الأسر</p>
            <p className="font-heading text-xl font-bold text-accent">
              {formatNumber(totalFamilies)}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* جدول الإحصاءات لكل حي */}
      <Card className="mt-6 warm-shadow">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ArrowRight className="size-4 text-accent" />
            إحصاءات الأحياء
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-start">الحي</TableHead>
                  <TableHead className="text-start">الأعضاء</TableHead>
                  <TableHead className="text-start">الأسر</TableHead>
                  <TableHead className="text-start">السكان التقريبيون</TableHead>
                  <TableHead className="text-start">نسبة الانخراط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-6"
                    >
                      لا توجد أحياء بعد.
                    </TableCell>
                  </TableRow>
                ) : (
                  markers.map((d) => {
                    const population =
                      (allDistricts as any[]).find(
                        (x) => x.slug === d.slug
                      )?.population ?? 0;
                    const rate =
                      population > 0
                        ? Math.round((d.members / population) * 1000) / 10
                        : 0;
                    return (
                      <TableRow key={d.slug}>
                        <TableCell>
                          <Link
                            href={`/community/districts/${d.slug}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {d.name}
                          </Link>
                          {d.nameFr && (
                            <p className="text-[11px] text-muted-foreground" dir="ltr">
                              {d.nameFr}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatNumber(d.members)}
                        </TableCell>
                        <TableCell className="font-semibold text-secondary">
                          {formatNumber(d.families)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {population > 0 ? formatNumber(population) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              rate > 5
                                ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700"
                                : rate > 1
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                  : "border-zinc-500/30 bg-zinc-500/10 text-zinc-700"
                            }
                          >
                            {rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* أزرار سفلى */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline" className="h-11 gap-2">
          <Link href="/community/map">
            <MapIcon className="size-4" />
            <span>عرض الخريطة ثنائية الأبعاد</span>
          </Link>
        </Button>
        <Button asChild className="h-11 gap-2">
          <Link href="/community">
            <span>العودة للمجتمع</span>
          </Link>
        </Button>
      </div>
    </main>
  );
}
