// v71.0 Section E — Time Bank page (بنك الوقت)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TimeBankClient } from "@/components/timebank/timebank-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, HandHeart, ArrowRightLeft, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "بنك الوقت — وَصَل | وَصَل",
  description: "تبادل المهارات بالوقت بدل المال — كل ساعة تساوي ساعة",
};

export default async function TimeBankPage() {
  const me = await getCurrentUser();

  const [offers, requests, ledgers] = await Promise.all([
    db.timeOffer.findMany({
      where: { status: "open" },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    }),
    db.timeRequest.findMany({
      where: { status: "open" },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    db.timeLedger.count(),
  ]);

  const stats = {
    offers: offers.length,
    requests: requests.length,
    ledgers,
    hoursAvailable: offers.reduce((s, o) => s + (o.hoursOffered || 0), 0),
    hoursNeeded: requests.reduce((s, r) => s + (r.hoursNeeded || 0), 0),
  };

  // Serialize dates
  const offersSerialized = offers.map((o) => ({
    ...o,
    createdAt: o.createdAt?.toISOString() ?? null,
    updatedAt: o.updatedAt?.toISOString() ?? null,
  }));
  const requestsSerialized = requests.map((r) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — بنك الوقت"
        title="بنك الوقت"
        subtitle="تبادل المهارات بالوقت بدل المال — كل ساعة تساوي ساعة"
      />

      <section className="container mx-auto max-w-6xl px-4 py-10">
        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {[
            { icon: HandHeart, color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-900/30", title: "1. قدّم مهارة", desc: "أنشئ عرضاً: أعطي درساً، أساعد في نقل، أرافق لمريض..." },
            { icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", title: "2. تبادل", desc: "اطلب مهارة مقابل ذلك. النظام يقترح المطابقات" },
            { icon: Clock, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30", title: "3. ساعة = ساعة", desc: "كل ساعة تُعطيها تُسجّل في رصيدك. تأخذها متى شئت" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center">
            <HandHeart className="h-5 w-5 text-teal-700 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.offers}</p>
            <p className="text-xs text-muted-foreground">عروض مفتوحة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.requests}</p>
            <p className="text-xs text-muted-foreground">طلبات مساعدة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.hoursAvailable.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">ساعات متاحة</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <ArrowRightLeft className="h-5 w-5 text-rose-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.hoursNeeded.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">ساعات مطلوبة</p>
          </CardContent></Card>
        </div>

        <TimeBankClient
          initialOffers={offersSerialized}
          initialRequests={requestsSerialized}
          loggedIn={!!me}
          userId={me?.id ?? null}
        />

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          ⚠️ بنك الوقت تبادل اجتماعي تضامني — غير مُلزِم قانونياً. وَصَل يربط الأعضاء فقط ولا يضمن جودة الخدمة.
        </p>
      </section>
    </div>
  );
}
