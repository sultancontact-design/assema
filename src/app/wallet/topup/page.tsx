import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/constants";
import { Coins, Check } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "شحن المحفظة" };

export default async function WalletTopupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/wallet/topup");

  const packages = await db.pointPackage.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="flex flex-col">
      <PageHero
        title="شحن المحفظة"
        subtitle="اختر باقة النقاط المناسبة وادفع عبر CashPlus أو تحويل بنكي."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="شحن المحفظة"
        badge={`${packages.length} باقة`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((p) => (
            <Card key={p.id} className={`lift-on-hover relative ${p.isPopular ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""}`}>
              {p.isPopular && (
                <Badge className="absolute -top-2 inset-x-0 mx-auto w-fit bg-primary text-primary-foreground">
                  الأكثر شعبية
                </Badge>
              )}
              <CardContent className="p-6 text-center">
                <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
                  <Coins className="size-6" />
                </div>
                <p className="font-heading font-bold text-lg text-foreground">{p.name}</p>
                <div className="my-4">
                  <span className="font-heading font-extrabold text-primary text-4xl tabular-nums">{formatNumber(p.points)}</span>
                  <span className="text-sm text-muted-foreground ms-1">نقطة</span>
                </div>
                {p.bonus > 0 && (
                  <Badge variant="outline" className="mb-3 bg-secondary/10 text-secondary border-secondary/30">
                    +{formatNumber(p.bonus)} مكافأة
                  </Badge>
                )}
                <div className="border-t border-border pt-4 mt-2">
                  <p className="font-heading font-bold text-foreground text-2xl">{formatNumber(p.price)}</p>
                  <p className="text-xs text-muted-foreground">درهم</p>
                </div>
                <Button asChild className="w-full mt-4 h-10" variant={p.isPopular ? "default" : "outline"}>
                  <Link href={`/wallet/topup?package=${p.id}`}>
                    <Check className="size-4" />
                    اختيار
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
