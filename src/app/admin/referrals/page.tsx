import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { Gift, Users, TrendingUp, Link as LinkIcon } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة الإحالات" };

export default async function ReferralsAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/referrals");

  const [program, campaigns, topReferrers, totalReferrals] = await Promise.all([
    db.referralProgram.findFirst(),
    db.referralCampaign.findMany({ orderBy: { endDate: "desc" }, take: 10 }),
    db.referralLink.findMany({ orderBy: { signups: "desc" }, take: 10, include: { user: { select: { fullName: true, district: { select: { name: true } } } } } }),
    db.referralLink.aggregate({ _sum: { signups: true, clicks: true, activeReferrals: true } }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHero title="إدارة الإحالات" subtitle="نظرة عامة على برنامج الإحالة، الحملات، وأفضل المدعين." image="https://images.unsplash.com/photo-1551269901-5c5e14c25b58?auto=format&fit=crop&w=1920&q=80" imageAlt="إدارة الإحالات" badge={program?.isActive ? "نشط" : "متوقّف"} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><Gift className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مكافأة الداعي</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{program?.rewardReferrer ?? 0}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><Users className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مكافأة المدعو</p>
            <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{program?.rewardReferred ?? 0}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2"><TrendingUp className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">إجمالي النقرات</p>
            <p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{totalReferrals._sum.clicks ?? 0}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><LinkIcon className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">تسجيلات نشطة</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{totalReferrals._sum.activeReferrals ?? 0}</p>
          </CardContent></Card>
        </div>

        {/* Top Referrers */}
        <Card className="overflow-hidden">
          <div className="mb-3 flex items-center gap-2 px-1"><TrendingUp className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold text-foreground">أفضل المدعين</h2></div>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {topReferrers.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">لا توجد روابط إحالة بعد</li>
              ) : (
                topReferrers.map((r, idx) => (
                  <li key={r.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="font-heading font-bold text-muted-foreground text-lg w-8 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{r.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{r.user.district?.name ?? "—"}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-primary tabular-nums">{r.signups} تسجيل</p>
                      <p className="text-[10px] text-muted-foreground">{r.clicks} نقرة</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
