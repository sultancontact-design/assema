// v72.0 — Carpool page (community ride share)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CarpoolClient } from "@/components/carpool/carpool-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Users, MapPin, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "كتّاكِل وَصَل | وَصَل", description: "تبادل الرحلات بين المدن المغربية" };

export default async function CarpoolPage() {
  const me = await getCurrentUser();
  const rides = await db.carpool.findMany({
    where: { status: "active", departureTime: { gt: new Date() } },
    orderBy: [{ departureTime: "asc" }],
    take: 50,
    include: { _count: { select: { bookings: true } } },
  });

  const serialized = rides.map((r) => ({
    ...r,
    departureTime: r.departureTime.toISOString(),
    arrivalTime: r.arrivalTime?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    bookingsCount: r._count?.bookings ?? 0,
  }));

  const stats = {
    total: rides.length,
    totalSeats: rides.reduce((s, r) => s + r.seatsTotal, 0),
    takenSeats: rides.reduce((s, r) => s + r.seatsTaken, 0),
    avgPrice: rides.length > 0 ? Math.round(rides.reduce((s, r) => s + r.pricePerSeat, 0) / rides.length) : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="v72.0 — كتّاكِل" title="كتّاكِل وَصَل" subtitle="رحلات مشتركة بين المدن المغربية — وفّر النقود وحمي البيئة" />

      <section className="container mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center"><Car className="h-5 w-5 text-teal-700 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">رحلة نشطة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 text-amber-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.takenSeats}/{stats.totalSeats}</p><p className="text-xs text-muted-foreground">مقاعد</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><MapPin className="h-5 w-5 text-rose-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">مدن مغطاة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 text-emerald-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.avgPrice}</p><p className="text-xs text-muted-foreground">متوسط السعر</p></CardContent></Card>
        </div>

        <CarpoolClient initialRides={serialized} loggedIn={!!me} userId={me?.id ?? null} />
      </section>
    </div>
  );
}
