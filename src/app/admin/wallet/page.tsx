import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/constants";
import { Wallet, Coins, Users, Package, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة المحافظ" };

export default async function AdminWalletPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/wallet");

  const [walletCount, totalBalance, totalPoints, pendingTopups, pendingWithdrawals, packages] = await Promise.all([
    db.wallet.count(),
    db.wallet.aggregate({ _sum: { balance: true } }),
    db.wallet.aggregate({ _sum: { points: true } }),
    db.walletTransaction.count({ where: { type: "TOPUP", status: "PENDING" } }),
    db.withdrawalRequest.count({ where: { status: "PENDING" } }),
    db.pointPackage.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHero title="إدارة المحافظ" subtitle="نظرة عامة على محافظ المستخدمين، الشحن، السحب، والباقات." image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80" imageAlt="إدارة المحافظ" badge={`${walletCount} محفظة`} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><Wallet className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">عدد المحافظ</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{walletCount}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><Coins className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">إجمالي الرصيد</p>
            <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{formatNumber(totalBalance._sum.balance ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">درهم</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 mb-2"><TrendingUp className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">شحنات معلّقة</p>
            <p className="font-heading font-extrabold text-amber-600 text-2xl tabular-nums">{pendingTopups}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2"><Users className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">سحوبات معلّقة</p>
            <p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{pendingWithdrawals}</p>
          </CardContent></Card>
        </div>

        {/* Point Packages */}
        <div>
          <div className="mb-3 flex items-center gap-2"><Package className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold text-foreground">باقات النقاط</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {packages.map((p) => (
              <Card key={p.id} className={`lift-on-hover ${p.isPopular ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  {p.isPopular && <Badge className="mb-2 bg-primary text-primary-foreground">الأكثر شعبية</Badge>}
                  <p className="font-heading font-bold text-lg text-foreground">{p.name}</p>
                  <div className="my-3">
                    <span className="font-heading font-extrabold text-accent text-3xl tabular-nums">{p.points}</span>
                    {p.bonus > 0 && <span className="text-sm text-secondary ms-2">+{p.bonus} مكافأة</span>}
                  </div>
                  <p className="font-bold text-foreground text-lg">{formatNumber(p.price)} <span className="text-xs text-muted-foreground">درهم</span></p>
                  <Badge variant="outline" className={`mt-2 ${p.isActive ? "bg-secondary/10 text-secondary border-secondary/30" : "bg-muted"}`}>
                    {p.isActive ? "نشط" : "متوقّف"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
