import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Coins, TrendingUp, Package } from "lucide-react";
import { formatNumber, formatDateArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "طلبات المتجر",
};

export default async function StoreOrdersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/store/orders");

  const [orders, stats] = await Promise.all([
    db.storeOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { fullName: true, district: { select: { name: true } } } },
        item: { select: { name: true, type: true, icon: true } },
      },
    }),
    db.storeOrder.aggregate({
      _sum: { pricePaid: true },
      _count: { _all: true },
    }),
  ]);

  // إحصاءات الأكثر مبيعاً — اجلب كل الطلبات ثم اجمعها في JS (أكثر أماناً مع Prisma)
  const allOrders = await db.storeOrder.findMany({
    select: { itemId: true, pricePaid: true },
  });
  const itemMap = new Map<string, { count: number; revenue: number }>();
  for (const o of allOrders) {
    const cur = itemMap.get(o.itemId) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.pricePaid;
    itemMap.set(o.itemId, cur);
  }
  const topItems = Array.from(itemMap.entries())
    .map(([itemId, stats]) => ({ itemId, _count: { _all: stats.count }, _sum: { pricePaid: stats.revenue } }))
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5);
  const topItemIds = topItems.map((t) => t.itemId);
  const topItemsData = await db.storeItem.findMany({
    where: { id: { in: topItemIds } },
    select: { id: true, name: true, icon: true, type: true },
  });
  const topItemsMap = new Map(topItemsData.map((i) => [i.id, i]));
  const topItemsMerged = topItems.map((t) => ({
    ...t,
    item: topItemsMap.get(t.itemId),
  }));

  const TYPE_LABELS: Record<string, string> = {
    FREEZE: "تجميد", BADGE: "شارة", FEATURE: "ميزة", DISCOUNT: "خصم", DIGITAL: "رقمي",
  };

  return (
    <div className="flex flex-col">
      <PageHero
        title="طلبات المتجر"
        subtitle="جدول كل عمليات الشراء في المنصة — إحصاءات الإيرادات والأكثر مبيعاً."
        image="https://images.unsplash.com/photo-1607082348824-0cd0a4ab1c0d?auto=format&fit=crop&w=1920&q=80"
        imageAlt="طلبات المتجر — إدارة المشتريات"
        badge={`${stats._count._all} طلب`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 4 KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover">
            <CardContent className="p-4">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
                <ShoppingCart className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">إجمالي الطلبات</p>
              <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{stats._count._all}</p>
            </CardContent>
          </Card>
          <Card className="lift-on-hover">
            <CardContent className="p-4">
              <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2">
                <Coins className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">إجمالي الإيراد</p>
              <p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{formatNumber(stats._sum.pricePaid ?? 0)}</p>
              <p className="text-[10px] text-muted-foreground">نقطة</p>
            </CardContent>
          </Card>
          <Card className="lift-on-hover">
            <CardContent className="p-4">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2">
                <TrendingUp className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">متوسط الطلب</p>
              <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">
                {stats._count._all > 0 ? Math.round((stats._sum.pricePaid ?? 0) / stats._count._all) : 0}
              </p>
              <p className="text-[10px] text-muted-foreground">نقطة/طلب</p>
            </CardContent>
          </Card>
          <Card className="lift-on-hover">
            <CardContent className="p-4">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
                <Package className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">منتجات نشطة</p>
              <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">
                {new Set(orders.map((o) => o.itemId)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bento: جدول الطلبات (8-col) + الأكثر مبيعاً (4-col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* جدول الطلبات */}
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-foreground">آخر 50 طلب</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="text-start p-3 font-medium text-muted-foreground">المنتج</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">المشتري</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">السعر</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">الحالة</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            لا توجد طلبات بعد
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{o.item?.icon ?? "📦"}</span>
                                <div>
                                  <p className="font-bold text-foreground text-xs">{o.item?.name ?? "محذوف"}</p>
                                  <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[o.item?.type ?? ""] ?? o.item?.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-foreground text-xs">{o.user?.fullName ?? "مستخدم محذوف"}</p>
                              <p className="text-[10px] text-muted-foreground">{o.user?.district?.name ?? "—"}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-accent tabular-nums">{o.pricePaid}</span>
                              <span className="text-xs text-muted-foreground ms-1">نقطة</span>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  o.status === "completed" ? "bg-secondary/10 text-secondary border-secondary/30"
                                  : o.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30"
                                }
                              >
                                {o.status === "completed" ? "مكتمل" : o.status === "pending" ? "معلّق" : "مُسترجع"}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">
                              {formatDateArabic(o.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الأكثر مبيعاً */}
          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-5 text-secondary" />
              <h2 className="font-heading text-lg font-bold text-foreground">الأكثر مبيعاً</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {topItemsMerged.map((t, idx) => (
                    <li key={t.itemId} className="flex items-center gap-3 p-3">
                      <span className="font-heading font-bold text-muted-foreground text-lg w-6 text-center">{idx + 1}</span>
                      <span className="text-2xl">{t.item?.icon ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-xs truncate">{t.item?.name ?? "محذوف"}</p>
                        <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[t.item?.type ?? ""] ?? t.item?.type}</p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-primary tabular-nums text-sm">{t._count._all}</p>
                        <p className="text-[10px] text-muted-foreground">طلب</p>
                      </div>
                    </li>
                  ))}
                  {topItemsMerged.length === 0 && (
                    <li className="p-6 text-center text-sm text-muted-foreground">لا توجد مبيعات بعد</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
