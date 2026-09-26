import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { MapPin, Users, Home } from "lucide-react";

// Lazy load map component (saves ~200KB initial bundle)
const ThreeDMap = dynamic(
  () => import("@/components/map/three-d-map").then((m) => m.ThreeDMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[70vh] min-h-[400px] bg-muted rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
        </div>
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خريطة ثلاثية الأبعاد لمراكش",
  description:
    "استكشف أحياء مراكش على خريطة ثلاثية الأبعاد — مبانٍ 3D، صور قمر صناعي، وتضاريس.",
};

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "sidi-youssef-ben-ali": [-7.970, 31.610],
  medina: [-7.989, 31.629],
  guelize: [-7.998, 31.643],
  menara: [-7.950, 31.600],
  annakhil: [-7.920, 31.650],
};

export default async function Map3DPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/map-3d");

  const districts = await db.district.findMany({
    select: { id: true, name: true, nameAr: true, slug: true },
    take: 10,
  });

  const districtStats = await Promise.all(
    districts.map(async (d) => {
      const [members, families] = await Promise.all([
        db.user.count({ where: { districtId: d.id, deletedAt: null } }),
        db.family.count({ where: { districtId: d.id } }),
      ]);
      return { ...d, members, families };
    })
  ).catch(() => []);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <header className="mb-8 text-center">
        <Badge variant="outline" className="mb-3 bg-primary/5 text-primary border-primary/20">
          <MapPin className="size-3" />
          خريطة ثلاثية الأبعاد
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold mb-2">
          <span className="shimmer-text">خريطة أحياء مراكش</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          استكشف أحياء المدينة الحمراء على خريطة ثلاثية الأبعاد مع مبانٍ 3D،
          صور قمر صناعي، وتضاريس تفصيلية.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* The 3D Map */}
      <ThreeDMap />

      {/* District stats */}
      {districtStats.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {districtStats.slice(0, 5).map((d) => {
            const coords = DISTRICT_COORDS[d.slug] ?? [-7.98, 31.63];
            const engagement = d.families > 0 ? Math.round((d.members / (d.families * 4)) * 100) : 0;
            return (
              <Card key={d.id} className="lift-on-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="size-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">{d.nameAr ?? d.name}</h3>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <Users className="size-3" />
                      <span className="font-bold text-foreground">{d.members}</span> عضو
                    </p>
                    <p>🏠 <span className="font-bold text-foreground">{d.families}</span> أسرة</p>
                    <p>📈 نسبة الانخراط: <Badge variant="outline" className="text-[10px]">{engagement}%</Badge></p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
