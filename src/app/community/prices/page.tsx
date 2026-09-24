import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PricesBoard } from "@/components/community/prices-board";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "VEGETABLE", label: "خضر" },
  { value: "FRUIT", label: "فواكه" },
  { value: "MEAT", label: "لحوم" },
  { value: "GRAIN", label: "حبوب" },
  { value: "DAIRY", label: "ألبان" },
  { value: "OTHER", label: "أخرى" },
];

export default async function PricesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/prices");

  const prices = await db.marketPrice.findMany({
    where: { isActive: true },
    orderBy: { reportedAt: "desc" },
    take: 50,
  });

  const serialized = prices.map(p => ({
    id: p.id, productName: p.productName, productNameAr: p.productNameAr,
    category: p.category, price: p.price, unit: p.unit, market: p.market,
    source: p.source, reportedAt: p.reportedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-2">أسعار السوق</h1>
      <p className="text-sm text-muted-foreground mb-6">أسعار الخضر والفواكه في أسواق مراكش — يُحدّثها المستخدمون</p>
      <PricesBoard prices={serialized} categories={CATEGORIES} />
    </div>
  );
}
