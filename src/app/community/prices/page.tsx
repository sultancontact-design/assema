import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLatestPrices, getFetchLogs } from "@/lib/price-fetcher";
import { MarketPricesBoard } from "@/components/community/market-prices-board";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

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
    getLatestPrices().catch(() => []),
    getFetchLogs(5).catch(() => []),
  ]);

  const serializedPrices = prices.map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    category: p.category,
    unit: p.unit,
    icon: p.icon,
    latestPrice: p.latestPrice,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    source: p.source,
    sourceUrl: p.sourceUrl,
    verified: p.verified,
    recordedAt: p.recordedAt,
  }));

  const serializedLogs = logs.map((l) => ({
    source: l.source,
    status: l.status,
    productsCount: l.productsCount,
    errorMessage: l.errorMessage,
    fetchedAt: l.fetchedAt.toISOString(),
  }));

  // عدد المنتجات التي لها أسعار حقيقية
  const realCount = serializedPrices.filter((p) => p.latestPrice !== null).length;
  const totalCount = serializedPrices.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">📊 أسعار السوق الحية</h1>
          <p className="text-sm text-muted-foreground">
            {realCount > 0
              ? `${realCount} من ${totalCount} منتج له سعر حقيقي — من مصادر رسمية موثّقة.`
              : "أسعار من مصادر رسمية فقط (FAOSTAT + data.gov.ma + مساهمات موثّقة) — لا أرقام مُصنّعة."}
          </p>
        </div>
        <Button asChild variant="default" className="h-11">
          <Link href="/community/prices/report">
            <Megaphone className="size-4" />
            <span>أبلغ عن سعر شاهدته</span>
          </Link>
        </Button>
      </div>
      <MarketPricesBoard
        prices={serializedPrices}
        categories={CATEGORIES}
        logs={serializedLogs}
      />
    </div>
  );
}
