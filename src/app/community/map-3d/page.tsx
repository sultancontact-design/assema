import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { MapPin, Users, Home } from "lucide-react";
import { ThreeDMap } from "@/components/map/three-d-map";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خريطة ثلاثية الأبعاد لمراكش",
  description:
    "استكشف أحياء مراكش على خريطة ثلاثية الأبعاد — مبانٍ 3D، صور قمر صناعي، وتضاريس.",
};

export default async function Map3DPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/map-3d");

  // نستخدم العدّادات المخزّنة (members / familiesCount) من جدول District
  // لتجنّب 10 استعلامات COUNT إضافية على كل تحميل صفحة (أداء أسرع)
  const districts = await db.district.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      nameAr: true,
      nameFr: true,
      slug: true,
      members: true,
      familiesCount: true,
    },
    orderBy: { members: "desc" },
    take: 5,
  });

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
      {districts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {districts.map((d, idx) => {
            const engagement = d.familiesCount > 0 ? Math.round((d.members / (d.familiesCount * 4)) * 100) : 0;
            return (
              <Card key={d.id} className="lift-on-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="size-4 text-primary" />
                    <h3 className="font-heading font-bold text-sm">{d.nameAr ?? d.name}</h3>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-[9px] ms-auto bg-primary/10 text-primary border-primary/20">
                        الأكبر
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <Users className="size-3" />
                      <span className="font-bold text-foreground">{d.members}</span> عضو
                    </p>
                    <p className="flex items-center gap-1">
                      <Home className="size-3" />
                      <span className="font-bold text-foreground">{d.familiesCount}</span> أسرة
                    </p>
                    <p className="flex items-center gap-1">
                      <span>نسبة الانخراط:</span>
                      <Badge variant="outline" className="text-[10px]">{Math.min(engagement, 100)}%</Badge>
                    </p>
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
