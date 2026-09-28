import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, Wallet, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "تحويل" };

export default async function WalletTransferPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/wallet/transfer");

  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId: user.id } });
  }
  const balance = wallet.balance;
  const points = wallet.points;

  return (
    <div className="flex flex-col">
      <PageHero
        title="تحويل"
        subtitle="حوّل دراهم أو نقاط لمستخدم آخر في الحي — بدون رسوم."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="تحويل"
        badge={`${balance} درهم · ${points} نقطة`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUpDown className="size-5 text-primary" />تحويل لمستخدم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/10 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" />درهم</span>
                <span className="font-bold text-secondary tabular-nums">{balance}</span>
              </div>
              <div className="p-3 rounded-lg bg-accent/15 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" />نقطة</span>
                <span className="font-bold text-accent tabular-nums">{points}</span>
              </div>
            </div>
            {balance < 50 && points < 50 ? (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                الحد الأدنى للتحويل هو 50 (درهم أو نقاط). شحن محفظتك أولاً.
              </div>
            ) : (
              <form action="/api/wallet/transfer" method="POST" className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">المستلم (البريد أو رقم الهاتف)</Label>
                  <Input name="recipient" required placeholder="admin@syba-community.ma أو 06XXXXXXXX" className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">المبلغ</Label>
                    <Input name="amount" type="number" min="50" required placeholder="50" className="h-10 tabular-nums" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">العملة</Label>
                    <select name="currency" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="MAD">درهم</option>
                      <option value="POINTS">نقاط</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11"><ArrowUpDown className="size-4" />تحويل</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
