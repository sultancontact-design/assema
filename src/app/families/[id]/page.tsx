import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Home, MapPin, Heart, Calendar } from "lucide-react";
import { FollowButtonInline } from "@/components/social/follow-button-inline";
import { formatNumber, formatDateArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }>; }

export default async function FamilyProfilePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/families/${id}`);

  const family = await db.family.findUnique({
    where: { id },
    include: {
      members: { select: { id: true, fullName: true, avatar: true, isFamilyHead: true, role: true, points: true, district: { select: { name: true, nameAr: true } } } },
      district: { select: { name: true, nameAr: true } },
      _count: { select: { contributions: true } },
    },
  });

  if (!family) notFound();

  const totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);

  return (
    <div className="flex flex-col">
      <PageHero title={`عائلة ${family.familyName}`} subtitle="كيان اجتماعي في الحي — أعضاء، نشاط، مساهمات" image="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1920&q=80" imageAlt={`عائلة ${family.familyName}`} badge={`${family.members.length} أعضاء`} />
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4 text-center"><div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 mx-auto mb-2"><Home className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">إجمالي النقاط</p><p className="font-heading font-extrabold text-amber-600 text-2xl tabular-nums">{formatNumber(totalPoints)}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4 text-center"><div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mx-auto mb-2"><Heart className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">المساهمات</p><p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{family._count.contributions}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4 text-center"><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mx-auto mb-2"><Users className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">الأعضاء</p><p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{family.members.length}</p></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Users className="size-5 text-primary" />أعضاء العائلة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {family.members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">
                    {m.avatar ? <img src={m.avatar} alt={m.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{m.fullName.slice(0,1)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">{m.isFamilyHead ? "رب الأسرة" : m.role || "عضو"} · {m.points} نقطة</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
