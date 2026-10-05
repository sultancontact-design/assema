// v72.0 — Lost & Found page
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LostFoundClient } from "@/components/lost-found/lost-found-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Search, PackageSearch, HandHeart, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "ضائع وموجود | وَصَل", description: "لوحة مجتمعية للضائع والموجود بالمغرب" };

export default async function LostFoundPage() {
  const me = await getCurrentUser();
  const items = await db.lostFound.findMany({
    where: { status: "open" },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  const serialized = items.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  const stats = {
    total: items.length,
    lost: items.filter(i => i.type === "lost").length,
    found: items.filter(i => i.type === "found").length,
    resolved: await db.lostFound.count({ where: { status: "resolved" } }),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="v72.0 — ضائع وموجود" title="لوحة الضائع والموجود" subtitle="ساعد جيرانك في إيجاد ما فقدوه أو تسليم ما وجدوه" />

      <section className="container mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center"><PackageSearch className="h-5 w-5 text-rose-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.lost}</p><p className="text-xs text-muted-foreground">ضائعة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><HandHeart className="h-5 w-5 text-emerald-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.found}</p><p className="text-xs text-muted-foreground">موجودة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Search className="h-5 w-5 text-teal-700 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">مفتوحة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><MapPin className="h-5 w-5 text-amber-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.resolved}</p><p className="text-xs text-muted-foreground">حُلّت</p></CardContent></Card>
        </div>

        <LostFoundClient initialItems={serialized} loggedIn={!!me} userId={me?.id ?? null} />
      </section>
    </div>
  );
}
