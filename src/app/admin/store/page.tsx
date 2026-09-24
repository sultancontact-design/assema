// ===================================================================
//  /admin/store — إدارة المتجر
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StoreAdmin } from "@/components/admin/store/store-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة المتجر",
};

export interface StoreItemRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  pricePoints: number;
  type: string;
  stock: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  revenue: number;
}

export interface OrderRow {
  id: string;
  userId: string;
  userFullName: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  pricePaid: number;
  status: string;
  createdAt: string;
}

export default async function StorePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/store");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [items, orders, users] = await Promise.all([
    db.storeItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { status: "completed" },
          select: { pricePaid: true },
        },
      },
    }),
    db.storeOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, fullName: true } },
        item: { select: { id: true, name: true, icon: true } },
      },
    }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      take: 200,
      select: { id: true, fullName: true, points: true },
    }),
  ]);

  const itemRows: StoreItemRow[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    icon: i.icon,
    pricePoints: i.pricePoints,
    type: i.type,
    stock: i.stock,
    isActive: i.isActive,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    ordersCount: i._count.orders,
    revenue: i.orders.reduce((s, o) => s + o.pricePaid, 0),
  }));

  const orderRows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    userFullName: o.user?.fullName ?? "—",
    itemId: o.itemId,
    itemName: o.item?.name ?? "—",
    itemIcon: o.item?.icon ?? "🎁",
    pricePaid: o.pricePaid,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  return <StoreAdmin items={itemRows} orders={orderRows} users={users.map((u) => ({ id: u.id, fullName: u.fullName, points: u.points }))} />;
}
