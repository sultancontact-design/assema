"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet as WalletIcon, Coins, TrendingUp, TrendingDown, ArrowUpDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { PageHero } from "@/components/community/page-hero";
import { Card3D } from "@/components/ui/3d-card";
import Link from "next/link";

interface WalletData {
  balance: number; points: number; currency: string;
}
interface Transaction {
  id: string; type: string; amount: number; currency: string;
  status: string; description: string | null; createdAt: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = React.useState<WalletData | null>(null);
  const [txns, setTxns] = React.useState<Transaction[]>([]);

  React.useEffect(() => {
    fetch("/api/wallet").then(r => r.json()).then(d => setWallet(d)).catch(() => setWallet({ balance: 0, points: 0, currency: "MAD" }));
    fetch("/api/wallet/transactions").then(r => r.json()).then(d => setTxns(Array.isArray(d) ? d : d.transactions ?? [])).catch(() => setTxns([]));
  }, []);

  const typeLabels: Record<string, string> = {
    TOPUP: "شحن", PURCHASE: "شراء", REFUND: "استرجاع", WITHDRAWAL: "سحب", REWARD: "مكافأة", TRANSFER: "تحويل",
  };
  const typeColors: Record<string, string> = {
    TOPUP: "text-secondary", PURCHASE: "text-accent", REFUND: "text-secondary", WITHDRAWAL: "text-primary", REWARD: "text-secondary", TRANSFER: "text-primary",
  };

  return (
    <div className="flex flex-col">
      <PageHero title="محفظتي" subtitle="رصيدك بالدرهم والنقاط — شحن، سحب، تحويل، وتتبّع كل المعاملات." image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80" imageAlt="المحفظة" badge={wallet ? `${wallet.balance} ${wallet.currency}` : "..."} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card3D className="rounded-2xl" intensity={5}>
            <Card className="h-full border-s-4 border-s-secondary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary/10 text-secondary"><WalletIcon className="size-5" /></span>
                  <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/30">رصيد الدرهم</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">الرصيد المتاح</p>
                <p className="font-heading font-extrabold text-secondary" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  {wallet ? new Intl.NumberFormat("ar-MA").format(wallet.balance) : "—"}
                  <span className="text-base font-normal text-muted-foreground ms-2">{wallet?.currency ?? "MAD"}</span>
                </p>
              </CardContent>
            </Card>
          </Card3D>
          <Card3D className="rounded-2xl" intensity={5}>
            <Card className="h-full border-s-4 border-s-accent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent-foreground"><Coins className="size-5" /></span>
                  <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30">رصيد النقاط</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">النقاط المكتسبة</p>
                <p className="font-heading font-extrabold text-accent" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  {wallet ? new Intl.NumberFormat("ar-MA").format(wallet.points) : "—"}
                  <span className="text-base font-normal text-muted-foreground ms-2">نقطة</span>
                </p>
              </CardContent>
            </Card>
          </Card3D>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button asChild size="lg" className="h-14"><Link href="/wallet/topup"><ArrowDownToLine className="size-5" />شحن المحفظة</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-14"><Link href="/wallet/withdraw"><ArrowUpFromLine className="size-5" />سحب</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-14"><Link href="/wallet/transfer"><ArrowUpDown className="size-5" />تحويل</Link></Button>
        </div>

        {/* Transactions */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpDown className="size-5 text-primary" />آخر المعاملات</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {txns.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">لا توجد معاملات بعد</li>
              ) : (
                txns.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className={`grid size-9 place-items-center rounded-xl ${t.type === "TOPUP" || t.type === "REWARD" || t.type === "REFUND" ? "bg-secondary/10 text-secondary" : "bg-accent/15 text-accent-foreground"}`}>
                      {t.type === "TOPUP" || t.type === "REWARD" || t.type === "REFUND" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{typeLabels[t.type] ?? t.type}</p>
                      <p className="text-xs text-muted-foreground">{t.description ?? "—"}</p>
                    </div>
                    <div className="text-end">
                      <p className={`font-bold tabular-nums ${typeColors[t.type] ?? "text-foreground"}`}>
                        {t.type === "TOPUP" || t.type === "REWARD" || t.type === "REFUND" ? "+" : "-"}
                        {new Intl.NumberFormat("ar-MA").format(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t.currency}</p>
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
