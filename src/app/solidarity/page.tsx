// v71.0 Section 7 — Solidarity Match Engine page
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, HandCoins, Clock, MapPin, Gift, Users, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  skill: { label: "مهارة", color: "text-teal-700 dark:text-teal-300" },
  good: { label: "بضاعة", color: "text-amber-700 dark:text-amber-300" },
  service: { label: "خدمة", color: "text-emerald-700 dark:text-emerald-300" },
  time: { label: "وقت", color: "text-rose-700 dark:text-rose-300" },
  shelter: { label: "إيواء", color: "text-violet-700 dark:text-violet-300" },
};

export default async function SolidarityPage() {
  const [offers, needs] = await Promise.all([
    db.solidarityOffer.findMany({
      where: { isActive: true, isFulfilled: false },
      take: 30,
      orderBy: [{ isUrgent: "desc" }, { publishedAt: "desc" }],
      include: { region: { select: { nameAr: true, name: true, slug: true } } },
    }),
    db.solidarityNeed.findMany({
      where: { isActive: true, isFulfilled: false },
      take: 30,
      orderBy: [{ isUrgent: "desc" }, { publishedAt: "desc" }],
      include: { region: { select: { nameAr: true, name: true, slug: true } } },
    }),
  ]);

  const stats = {
    offers: offers.length,
    needs: needs.length,
    urgent: [...offers, ...needs].filter((x) => x.isUrgent).length,
    hours: offers.reduce((s, o) => s + (o.estimatedValueHours ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — التضامن"
        title="محرّك التضامن"
        subtitle="بنك الوقت المغربي — تبادل العروض والاحتياجات بذكاء جغرافي"
      />

      <section className="container mx-auto max-w-7xl px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card>
            <CardContent className="p-5 text-center">
              <Gift className="h-6 w-6 mx-auto mb-1 text-teal-700" />
              <p className="text-2xl font-bold">{stats.offers}</p>
              <p className="text-xs text-muted-foreground">عروض تضامنية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 text-rose-700" />
              <p className="text-2xl font-bold">{stats.needs}</p>
              <p className="text-xs text-muted-foreground">احتياجات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Heart className="h-6 w-6 mx-auto mb-1 text-amber-700" />
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground">حالات عاجلة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-emerald-700" />
              <p className="text-2xl font-bold">{stats.hours}</p>
              <p className="text-xs text-muted-foreground">ساعات وقت متاحة</p>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: offers + needs */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Offers */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Gift className="h-5 w-5 text-teal-700 dark:text-teal-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold">عروض التضامن</h2>
                <p className="text-xs text-muted-foreground">ما يقدّمه أعضاء وَصَل</p>
              </div>
            </div>
            <div className="space-y-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="hover:border-teal-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{offer.title}</h3>
                      <Badge variant="outline" className={`text-xs ${CATEGORY_META[offer.category]?.color ?? ""}`}>
                        {CATEGORY_META[offer.category]?.label ?? offer.category}
                      </Badge>
                    </div>
                    {offer.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{offer.description}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {offer.region && (<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.region.nameAr || offer.region.name}</span>)}
                        {offer.estimatedValueHours && (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{offer.estimatedValueHours} ساعة</span>)}
                      </div>
                      {offer.isUrgent && (
                        <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950/30">عاجل</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Needs */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <HandCoins className="h-5 w-5 text-rose-700 dark:text-rose-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold">احتياجات</h2>
                <p className="text-xs text-muted-foreground">ما يبحث عنه الأعضاء</p>
              </div>
            </div>
            <div className="space-y-3">
              {needs.map((need) => (
                <Card key={need.id} className="hover:border-rose-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{need.title}</h3>
                      <Badge variant="outline" className={`text-xs ${CATEGORY_META[need.category]?.color ?? ""}`}>
                        {CATEGORY_META[need.category]?.label ?? need.category}
                      </Badge>
                    </div>
                    {need.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{need.description}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {need.region && (<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{need.region.nameAr || need.region.name}</span>)}
                        {need.estimatedValueHours && (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{need.estimatedValueHours} ساعة</span>)}
                      </div>
                      {need.isUrgent && (
                        <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950/30">عاجل</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <Card className="mt-10 bg-gradient-to-br from-teal-50/40 via-background to-amber-50/30 dark:from-teal-950/20 dark:via-background dark:to-amber-950/10">
          <CardContent className="p-8">
            <div className="flex items-start gap-3 mb-4">
              <Users className="h-8 w-8 text-teal-700 shrink-0" />
              <div>
                <h2 className="text-xl font-bold mb-1">كيف يعمل محرّك التضامن؟</h2>
                <p className="text-sm text-muted-foreground">ثلاث خطوات بسيطة — كأنك تطبّع قاعدة الوقت المغربية</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="h-8 w-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold mb-2">١</div>
                <h3 className="font-semibold mb-1">انشر عرضك أو احتياجك</h3>
                <p className="text-xs text-muted-foreground">اختر الفئة (مهارة، بضاعة، خدمة، وقت، إيواء) وأضف وصفاً قصيراً</p>
              </div>
              <div>
                <div className="h-8 w-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold mb-2">٢</div>
                <h3 className="font-semibold mb-1">الخوارزميات تربط الأطراف</h3>
                <p className="text-xs text-muted-foreground">محرّك التطابق يجد أفضل عروض لكل احتياج (40% مهارة + 30% جغرافيا + 30% ثقة)</p>
              </div>
              <div>
                <div className="h-8 w-8 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold mb-2">٣</div>
                <h3 className="font-semibold mb-1">سجّل في الدفتر</h3>
                <p className="text-xs text-muted-foreground">كل تبادل يُسجّل في دفتر الوقت — بنك الوقت التضامني المغربي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
