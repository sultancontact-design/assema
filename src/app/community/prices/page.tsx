import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLatestPrices, getFetchLogs } from "@/lib/price-fetcher";
import { MarketPricesBoard } from "@/components/community/market-prices-board";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "VEGETABLE", label: "خضر" },
  { value: "FRUIT", label: "فواكه" },
  { value: "MEAT", label: "لحوم" },
  { value: "GRAIN", label: "حبوب" },
  { value: "DAIRY", label: "ألبان" },
];

export default async function PricesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/prices");

  const [prices, logs] = await Promise.all([
    getLatestPrices(),
    getFetchLogs(5),
  ]);

  const serializedPrices = prices.map(p => ({
    id: p.id, name: p.name, nameAr: p.nameAr, category: p.category,
    unit: p.unit, icon: p.icon, latestPrice: p.latestPrice,
    minPrice: p.minPrice, maxPrice: p.maxPrice, source: p.source,
    recordedAt: p.recordedAt,
  }));

  const serializedLogs = logs.map(l => ({
    source: l.source, status: l.status, productsCount: l.productsCount,
    errorMessage: l.errorMessage, fetchedAt: l.fetchedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">📊 أسعار السوق الحية</h1>
        <p className="text-sm text-muted-foreground">أسعار تلقائية للخضر والفواكه واللحوم — تُحدّث يومياً</p>
      </div>
      <MarketPricesBoard prices={serializedPrices} categories={CATEGORIES} logs={serializedLogs} />
    </div>
  );
}
