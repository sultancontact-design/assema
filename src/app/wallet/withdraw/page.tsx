import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUpFromLine, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "سحب من المحفظة" };

export default async function WalletWithdrawPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/wallet/withdraw");

  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId: user.id } });
  }
  const balance = wallet.balance;

  return (
    <div className="flex flex-col">
      <PageHero
        title="سحب من المحفظة"
        subtitle="اسحب رصيدك بالدرهم — الحد الأدنى 100 درهم، رسوم 5%."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="سحب من المحفظة"
        badge={`رصيدك: ${balance} درهم`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUpFromLine className="size-5 text-primary" />طلب سحب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 rounded-lg bg-muted/40 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" />الرصيد المتاح</span>
              <span className="font-heading font-bold text-foreground text-lg tabular-nums">{balance} درهم</span>
            </div>
            {balance < 100 ? (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                الحد الأدنى للسحب هو 100 درهم. رصيدك الحالي {balance} درهم.
              </div>
            ) : (
              <form action="/api/wallet/withdraw" method="POST" className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">المبلغ (درهم)</Label>
                  <Input name="amount" type="number" min="100" max={balance} required placeholder="100" className="h-10 tabular-nums" />
                  <p className="text-[10px] text-muted-foreground">رسوم السحب: 5% — ستحصل على المبلغ بعد الخصم</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">طريقة السحب</Label>
                  <select name="method" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="CASHPLUS">CashPlus / Wafacash</option>
                    <option value="BANK_TRANSFER">تحويل بنكي (RIB)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">معلومات الحساب / الهاتف</Label>
                  <Input name="accountInfo" required placeholder="06XXXXXXXX أو RIB" className="h-10" />
                </div>
                <Button type="submit" className="w-full h-11"><ArrowUpFromLine className="size-4" />طلب السحب</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
