"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Activity, RefreshCw, Users, UsersRound, MapPin, Users3, Coins, Calendar, BookOpen, MessageCircle, Heart, Megaphone, ShoppingCart, MessageSquare, Lightbulb, Tag, ShieldCheck, FileText, Flag } from "lucide-react";

interface Section { key: string; nameAr: string; count: number; detail?: string }
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users, families: UsersRound, districts: MapPin, groups: Users3, fund_pending: Coins,
  contributions: Coins, events: Calendar, blog_posts: BookOpen, blog_comments: MessageCircle,
  blog_likes: Heart, ads: Megaphone, store: ShoppingCart, discussions: MessageSquare,
  initiatives: Lightbulb, price_reports: Tag, cndp: ShieldCheck, audit_logs: FileText, feature_flags: Flag,
};
const LINKS: Record<string, string> = {
  users: "/admin/users", families: "/admin/families", districts: "/admin/districts", groups: "/admin/groups",
  fund_pending: "/admin/fund", contributions: "/admin/fund", events: "/admin/events", blog_posts: "/admin/blog",
  blog_comments: "/admin/blog", blog_likes: "/admin/blog", ads: "/admin/ads", store: "/admin/store",
  discussions: "/admin/discussions", initiatives: "/admin/initiatives", price_reports: "/admin/contributions",
  cndp: "/admin/cndp", audit_logs: "/admin/audit", feature_flags: "/admin/feature-control",
};

export function DashboardClient() {
  const [data, setData] = React.useState<{ sections: Section[]; security: Section[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/dashboard", { cache: "no-store" }); if (r.ok) setData(await r.json()); }
    catch { toast.error("فشل"); } setLoading(false);
  }, []);
  React.useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Activity className="size-7 text-primary" /><span>اللوحة الشاملة</span></h1><p className="text-sm text-muted-foreground">18 قسم · مؤشّرات حيّة</p></div>
        <Button variant="outline" onClick={fetchData} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /><span>تحديث</span></Button>
      </header>
      {data?.security && data.security.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {data.security.map(s => (
            <Card key={s.key} className="bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40"><CardContent className="p-3 flex items-center justify-between"><span className="text-sm font-bold">{s.nameAr}</span><span className="font-heading text-xl font-bold text-red-600">{s.count}</span></CardContent></Card>
          ))}
        </div>
      )}
      {loading || !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{Array.from({ length: 18 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.sections.map(s => { const Icon = ICONS[s.key] ?? Activity; return (
            <Card key={s.key} className="lift-on-hover"><CardContent className="p-4 space-y-1.5">
              <div className="flex items-center justify-between"><Icon className="size-5 text-primary" /><span className="font-heading text-2xl font-extrabold">{s.count.toLocaleString("ar-MA")}</span></div>
              <p className="text-sm font-bold">{s.nameAr}</p>
              {s.detail && <p className="text-xs text-muted-foreground">{s.detail}</p>}
            </CardContent></Card>
          ); })}
        </div>
      )}
    </div>
  );
}
