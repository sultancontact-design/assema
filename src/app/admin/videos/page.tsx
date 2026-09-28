import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { Video as VideoIcon, Eye, Heart, MessageCircle, CheckCircle2, XCircle, Star, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة الفيديوهات" };

export default async function AdminVideosPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/videos");

  const videos = await db.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { fullName: true } } },
  });

  const stats = {
    total: videos.length,
    approved: videos.filter(v => v.isApproved).length,
    featured: videos.filter(v => v.isFeatured).length,
    totalViews: videos.reduce((a, v) => a + v.views, 0),
  };

  return (
    <div className="flex flex-col">
      <PageHero title="إدارة الفيديوهات" subtitle="مراجعة، قبول، رفض، وتمييز فيديوهات الأعضاء." image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80" imageAlt="إدارة الفيديوهات" badge={`${stats.total} فيديو`} />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><VideoIcon className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">إجمالي الفيديوهات</p><p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{stats.total}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><CheckCircle2 className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">مقبولة</p><p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{stats.approved}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2"><Star className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">مميّزة</p><p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{stats.featured}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><Eye className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">إجمالي المشاهدات</p><p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{formatNumber(stats.totalViews)}</p></CardContent></Card>
        </div>

        {/* Videos table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">العنوان</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">المنصة</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">الناشر</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">المشاهدات</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">التفاعل</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {videos.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3"><p className="font-bold text-foreground text-xs line-clamp-1">{v.title}</p></td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px]">{v.sourcePlatform}</Badge></td>
                      <td className="p-3 text-xs">{v.user.fullName}</td>
                      <td className="p-3 text-xs tabular-nums">{formatNumber(v.views)}</td>
                      <td className="p-3 text-xs"><span className="flex items-center gap-2"><span className="flex items-center gap-1"><Heart className="size-3" />{v.likes}</span><span className="flex items-center gap-1"><MessageCircle className="size-3" />{v.comments}</span></span></td>
                      <td className="p-3"><Badge variant="outline" className={v.isApproved ? "bg-secondary/10 text-secondary border-secondary/30" : "bg-amber-100 text-amber-700"}>{v.isApproved ? "مقبول" : "معلّق"}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDateArabic(v.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
