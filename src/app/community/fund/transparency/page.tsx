import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { Coins, TrendingUp, TrendingDown, Wallet, Copy } from "lucide-react";
import { subMonths, format, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";
export const metadata = { title: "شفافية الصندوق" };

export default async function TransparencyPage() {
  const user = await getCurrentUser();

  const [confirmedContribs, disbursed, recentDonations, settings] = await Promise.all([
    db.contribution.aggregate({ where: { status: "CONFIRMED" }, _sum: { amount: true }, _count: true }),
    db.fundRequest.aggregate({ where: { status: { in: ["DISBURSED", "COMPLETED"] } }, _sum: { amountDisbursed: true } }),
    db.fundDonation.findMany({ where: { status: "CONFIRMED" }, orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { fullName: true } } } }),
    db.fundSettings.findFirst(),
  ]);

  if (settings?.publicTransparency === false) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            لوحة الشفافية غير متاحة حالياً. يرجى العودة لاحقاً.
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIn = confirmedContribs._sum.amount ?? 0;
  const totalOut = disbursed._sum.amountDisbursed ?? 0;
  const balance = totalIn - totalOut;

  // شهرياً لآخر 6 أشهر
  const now = new Date();
  const monthly: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(startOfMonth(now), i);
    const m = format(d, "yyyy-MM");
    const agg = await db.contribution.aggregate({ where: { status: "CONFIRMED", month: m }, _sum: { amount: true } });
    monthly.push({ month: format(d, "MMM"), total: agg._sum.amount ?? 0 });
  }
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  return (
    <div className="flex flex-col">
      <PageHero
        title="لوحة شفافية الصندوق"
        subtitle="كل درهم يدخل ويخرج من صندوق المعروف موثّق وشفّاف — بدون أسماء المستفيدين."
        image="https://images.unsplash.com/photo-1601598851547-4308f1d1fa0f?auto=format&fit=crop&w=1920&q=80"
        imageAlt="شفافية الصندوق"
        badge="بيانات مفتوحة"
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI: balance + in + out */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="lift-on-hover border-s-4 border-s-secondary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary"><Wallet className="size-5" /></span>
                <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/30">الرصيد</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي</p>
              <p className="font-heading font-extrabold text-secondary" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
                {formatNumber(balance)} <span className="text-sm font-normal text-muted-foreground">د.م</span>
              </p>
            </CardContent>
          </Card>
          <Card className="lift-on-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary"><TrendingUp className="size-5" /></span>
                <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">دخل</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">إجمالي المساهمات</p>
              <p className="font-heading font-extrabold text-secondary text-3xl tabular-nums">{formatNumber(totalIn)}</p>
              <p className="text-xs text-muted-foreground">{confirmedContribs._count} مساهمة مؤكّدة</p>
            </CardContent>
          </Card>
          <Card className="lift-on-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground"><TrendingDown className="size-5" /></span>
                <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30">صرف</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">إجمالي المصروف</p>
              <p className="font-heading font-extrabold text-accent text-3xl tabular-nums">{formatNumber(totalOut)}</p>
              <p className="text-xs text-muted-foreground">درهم صرف على الأسر</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly chart (CSS bars) */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="size-5 text-primary" />المساهمات الشهرية (6 أشهر)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted/40 rounded-t-lg flex items-end h-full">
                    <div className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all duration-700" style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? "8px" : "0" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                  <span className="text-xs font-bold text-foreground tabular-nums">{formatNumber(m.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent donations */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="size-5 text-primary" />آخر 20 تبرع مؤكّد</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {recentDonations.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">لا توجد تبرعات مؤكّدة بعد</li>
              ) : (
                recentDonations.map((d, i) => (
                  <li key={d.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <span className="grid size-8 place-items-center rounded-full bg-secondary/10 text-secondary text-xs font-bold shrink-0">
                      {d.user?.fullName?.slice(0, 1) ?? "؟"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {d.user?.fullName ? `${d.user.fullName.slice(0, 3)}**` : "متبرع مجهول"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateArabic(d.createdAt)}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-accent tabular-nums">{formatNumber(d.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{d.currency}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
