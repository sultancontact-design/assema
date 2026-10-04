// v71.0 Section 10 — Voice Rooms page
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Radio, Users, MapPin, Calendar, Volume2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(d?: Date | null) {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("ar-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  } catch {
    return d.toISOString();
  }
}

export default async function VoicePage() {
  const rooms = await db.audioRoom.findMany({
    where: { isActive: true },
    take: 30,
    orderBy: [{ isLive: "desc" }, { scheduledFor: "asc" }],
    include: { region: { select: { nameAr: true, name: true, slug: true } } },
  });

  const stats = {
    total: rooms.length,
    live: rooms.filter((r) => r.isLive).length,
    scheduled: rooms.filter((r) => !r.isLive && r.scheduledFor).length,
    listeners: rooms.reduce((s, r) => s + r.currentListeners, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — الغرف الصوتية"
        title="غرف وَصَل الصوتية"
        subtitle="نقاشات حيّة بأسلوب Clubhouse — مساجدون مغاربة يتبادلون الأفكار"
      />

      <section className="container mx-auto max-w-6xl px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-5 text-center"><Radio className="h-6 w-6 mx-auto mb-1 text-rose-700" /><p className="text-2xl font-bold">{stats.live}</p><p className="text-xs text-muted-foreground">غرفة بث حيّ الآن</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><Calendar className="h-6 w-6 mx-auto mb-1 text-amber-700" /><p className="text-2xl font-bold">{stats.scheduled}</p><p className="text-xs text-muted-foreground">مجدولة</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><Users className="h-6 w-6 mx-auto mb-1 text-teal-700" /><p className="text-2xl font-bold">{stats.listeners}</p><p className="text-xs text-muted-foreground">مستمعون الآن</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><Volume2 className="h-6 w-6 mx-auto mb-1 text-emerald-700" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">غرف نشطة</p></CardContent></Card>
        </div>

        {/* Rooms grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.length === 0 ? (
            <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">لا توجد غرف نشطة. سجّل دخول وأنشئ غرفتك.</CardContent></Card>
          ) : (
            rooms.map((room) => (
              <Card key={room.id} className={room.isLive ? "border-rose-400 bg-rose-50/30 dark:bg-rose-950/10" : "hover:border-teal-300 transition-colors"}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {room.isLive ? (
                      <Badge variant="outline" className="text-rose-700 border-rose-400 bg-rose-50 dark:bg-rose-950/30">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-600 mr-1.5 animate-pulse" />
                        مباشر
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                        <Calendar className="h-3 w-3" />
                        {formatDate(room.scheduledFor)}
                      </Badge>
                    )}
                    {room.topic && (
                      <Badge variant="outline" className="text-[10px]">{room.topic}</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{room.title}</h3>
                  {room.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mic className="h-3 w-3" />{room.speakersCount} متحدث
                      </span>
                      {room.isLive && (
                        <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300">
                          <Users className="h-3 w-3" />{room.currentListeners} مستمع
                        </span>
                      )}
                      {room.region && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{room.region.nameAr || room.region.name}</span>
                      )}
                    </div>
                  </div>
                  <Button className={`w-full mt-3 ${room.isLive ? "bg-rose-700 hover:bg-rose-800" : ""}`} size="sm" disabled={!room.isLive}>
                    {room.isLive ? "انضم للغرفة" : "تذكير"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info card */}
        <Card className="mt-10 bg-gradient-to-br from-teal-50/40 via-background to-rose-50/30 dark:from-teal-950/20 dark:via-background dark:to-rose-950/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Radio className="h-8 w-8 text-rose-700 shrink-0" />
              <div>
                <h2 className="font-bold mb-1">كيف تعمل الغرف الصوتية؟</h2>
                <p className="text-sm text-muted-foreground mb-2">نبني فوق LiveKit (WebRTC SFU مفتوح المصدر). المضيف ينشئ غرفة، يدعو متحدثين، ويستمع بقية الأعضاء. كل غرفة لها نسبة ووقت بدء محدّد. التسجيلات تُحفظ ويُصاغ نصّها بالذكاء الاصطناعي (Whisper + darija fine-tuned).</p>
                <p className="text-xs text-muted-foreground">ملاحظة: عرض توضيحي — الإنتاج يتطلب تشغيل LiveKit Cloud أو خادم LiveKit ذاتي الاستضافة.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button asChild variant="outline"><Link href="/">العودة للرئيسية</Link></Button>
        </div>
      </section>
    </div>
  );
}
