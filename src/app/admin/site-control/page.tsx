import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Home, Share2, Video, LayoutGrid, ToggleLeft, ToggleRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "مركز التحكم الشامل" };

export default async function SiteControlPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/site-control");

  const flags = await db.featureFlag.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  // Group by category
  const categories = new Map<string, typeof flags>();
  for (const f of flags) {
    const arr = categories.get(f.category) ?? [];
    arr.push(f);
    categories.set(f.category, arr);
  }

  return (
    <div className="flex flex-col">
      <PageHero
        title="مركز التحكم الشامل"
        subtitle="تحكّم في كل ما يظهر في المنصة — الميزات، الأقسام، والظهور."
        image="https://images.unsplash.com/photo-1551269901-5c5e14c25b58?auto=format&fit=crop&w=1920&q=80"
        imageAlt="مركز التحكم الشامل"
        badge={`${flags.length} ميزة`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><ToggleRight className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">نشطة</p><p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{flags.filter(f => f.status === "ACTIVE").length}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 mb-2"><ToggleLeft className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">مخفية</p><p className="font-heading font-extrabold text-amber-600 text-2xl tabular-nums">{flags.filter(f => f.status === "HIDDEN").length}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-red-100 text-red-600 mb-2"><ToggleLeft className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">معطّلة</p><p className="font-heading font-extrabold text-red-600 text-2xl tabular-nums">{flags.filter(f => f.status === "DISABLED").length}</p></CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4"><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><LayoutGrid className="size-5" /></div><p className="text-xs text-muted-foreground mb-1">فئات</p><p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{categories.size}</p></CardContent></Card>
        </div>

        {/* Feature flags by category */}
        {Array.from(categories.entries()).map(([cat, items]) => (
          <Card key={cat} className="overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                {cat === "HOME" ? <Home className="size-4" /> : cat === "SOCIAL" ? <Share2 className="size-4" /> : cat === "VIDEO" || cat === "VIDEOS" ? <Video className="size-4" /> : <Settings className="size-4" />}
                {cat}
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {items.map((f) => (
                  <li key={f.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-foreground">{f.key}</p>
                      {f.descriptionAr && <p className="text-xs text-muted-foreground">{f.descriptionAr}</p>}
                    </div>
                    <Badge variant="outline" className={
                      f.status === "ACTIVE" ? "bg-secondary/10 text-secondary border-secondary/30"
                      : f.status === "HIDDEN" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                      : f.status === "DISABLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                      : "bg-muted text-muted-foreground"
                    }>
                      {f.status === "ACTIVE" ? "نشط" : f.status === "HIDDEN" ? "مخفي" : f.status === "DISABLED" ? "معطّل" : f.status === "COMING_SOON" ? "قريباً" : f.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
