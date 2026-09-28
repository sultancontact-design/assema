import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { ShoppingCart, Coins, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة التبرعات" };

export default async function FundDonationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/fund/donations");

  const [donations, stats] = await Promise.all([
    db.fundDonation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { fullName: true, district: { select: { name: true } } } } },
    }),
    db.fundDonation.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: { status: "CONFIRMED" },
    }),
  ]);

  const pending = donations.filter(d => d.status === "PENDING").length;
  const confirmed = donations.filter(d => d.status === "CONFIRMED").length;
  const totalConfirmed = stats._sum.amount ?? 0;

  const METHOD_LABELS: Record<string, string> = {
    BANK_TRANSFER: "تحويل بنكي", CASHPLUS: "CashPlus", PAYPAL: "PayPal",
    CASH: "نقداً", INWI_MONEY: "Inwi Money",
  };

  return (
    <div className="flex flex-col">
      <PageHero title="إدارة التبرعات" subtitle="مراجعة تبرعات الأعضاء — قبول/رفض مع تتبّع كامل." image="https://images.unsplash.com/photo-1601598851547-4308f1d1fa0f?auto=format&fit=crop&w=1920&q=80" imageAlt="إدارة التبرعات" badge={`${donations.length} تبرع`} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><ShoppingCart className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">إجمالي التبرعات</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{donations.length}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 mb-2"><Clock className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">قيد الانتظار</p>
            <p className="font-heading font-extrabold text-amber-600 text-2xl tabular-nums">{pending}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><CheckCircle2 className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مؤكّدة</p>
            <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{confirmed}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2"><Coins className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">إجمالي مؤكّد (درهم)</p>
            <p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{formatNumber(totalConfirmed)}</p>
          </CardContent></Card>
        </div>

        {/* Donations table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">المتبرع</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">المبلغ</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">الطريقة</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">المرجع</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {donations.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد تبرعات بعد</td></tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-foreground text-xs">{d.user?.fullName ?? "مجهول"}</p>
                          <p className="text-[10px] text-muted-foreground">{d.user?.district?.name ?? "—"}</p>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-accent tabular-nums">{formatNumber(d.amount)}</span>
                          <span className="text-xs text-muted-foreground ms-1">{d.currency}</span>
                        </td>
                        <td className="p-3 text-xs">{METHOD_LABELS[d.method] ?? d.method}</td>
                        <td className="p-3 text-xs text-muted-foreground tabular-nums">{d.reference ?? "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={
                            d.status === "CONFIRMED" ? "bg-secondary/10 text-secondary border-secondary/30"
                            : d.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30"
                          }>
                            {d.status === "CONFIRMED" ? "مؤكّد" : d.status === "PENDING" ? "معلّق" : "مرفوض"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDateArabic(d.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
