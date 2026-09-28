import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Settings, Radio, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة الشريط المتحرّك",
};

export default async function TickerAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/login?callbackUrl=/admin/ticker");
  }

  const recentActivities = await db.userActivity.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, type: true, description: true, createdAt: true, isPublic: true },
  }).catch(() => []);

  const typeCounts = recentActivities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  const TYPE_COLORS: Record<string, string> = {
    CONTRIBUTION: "bg-secondary/15 text-secondary border-secondary/30",
    EVENT_REGISTER: "bg-primary/15 text-primary border-primary/30",
    LOGIN: "bg-accent/20 text-accent-foreground border-accent/30",
    GROUP_JOIN: "bg-purple-100 text-purple-800 border-purple-300",
    BADGE_EARNED: "bg-amber-100 text-amber-800 border-amber-300",
    STREAK_MILESTONE: "bg-red-100 text-red-800 border-red-300",
    FUND_REQUEST: "bg-pink-100 text-pink-800 border-pink-300",
  };

  const TYPE_LABELS: Record<string, string> = {
    CONTRIBUTION: "مساهمة",
    EVENT_REGISTER: "تسجيل فعالية",
    LOGIN: "دخول",
    GROUP_JOIN: "انضمام",
    BADGE_EARNED: "شارة",
    STREAK_MILESTONE: "سلسلة",
    FUND_REQUEST: "طلب صندوق",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl lg:text-3xl font-extrabold flex items-center gap-2 text-foreground">
          <Radio className="size-7 text-primary" />
          <span>إدارة الشريط المتحرّك</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          تحكّم في الأخبار، الألوان، السرعة، والإيقاف
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="lift-on-hover"><CardContent className="p-4">
          <Activity className="size-5 text-primary mb-2" />
          <p className="text-xs text-muted-foreground">إجمالي النشاطات</p>
          <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums">{recentActivities.length}</p>
        </CardContent></Card>
        <Card className="lift-on-hover"><CardContent className="p-4">
          <Zap className="size-5 text-secondary mb-2" />
          <p className="text-xs text-muted-foreground">الأنواع المختلفة</p>
          <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums">{Object.keys(typeCounts).length}</p>
        </CardContent></Card>
        <Card className="lift-on-hover"><CardContent className="p-4">
          <Radio className="size-5 text-accent mb-2" />
          <p className="text-xs text-muted-foreground">الحالة</p>
          <p className="font-heading text-lg font-bold text-secondary">نشط</p>
        </CardContent></Card>
        <Card className="lift-on-hover"><CardContent className="p-4">
          <Settings className="size-5 text-primary mb-2" />
          <p className="text-xs text-muted-foreground">السرعة</p>
          <p className="font-heading text-lg font-bold text-foreground">4s/خبر</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            آخر النشاطات العمومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد نشاطات عمومية بعد</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivities.map((a) => {
                const color = TYPE_COLORS[a.type] ?? "bg-muted text-muted-foreground border-border";
                const label = TYPE_LABELS[a.type] ?? a.type;
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <Badge variant="outline" className={`text-xs ${color}`}>{label}</Badge>
                    <span className="flex-1 text-sm text-foreground truncate">{a.description}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.createdAt).toLocaleString("ar-MA", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <Badge variant={a.isPublic ? "default" : "secondary"} className="text-[10px]">
                      {a.isPublic ? "ظاهر" : "مخفي"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
        <p className="font-bold mb-1">إعدادات إضافية</p>
        <p className="text-muted-foreground">
          إضافة أخبار مخصّصة + ترتيب drag & drop + تاريخ البدء/الانتهاء — ستُضاف في النسخة القادمة.
          حالياً الشريط يعرض آخر 10 نشاطات عمومية تلقائياً، مع إيقاف عند hover/touch.
        </p>
      </div>
    </div>
  );
}
