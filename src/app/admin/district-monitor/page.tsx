import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Home, Heart, CalendarDays, UserPlus, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DistrictMonitorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN" && user.role !== "DISTRICT_MOD") redirect("/admin");
  const districts = await db.district.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const stats = await Promise.all(districts.map(async d => {
    const [members, families, contributions, requests, events, newUsers] = await Promise.all([
      db.user.count({ where: { districtId: d.id, deletedAt: null } }),
      db.family.count({ where: { districtId: d.id, isActive: true } }),
      db.contribution.count({ where: { districtId: d.id, createdAt: { gte: monthStart } } }),
      db.fundRequest.count({ where: { districtId: d.id, createdAt: { gte: monthStart } } }),
      db.event.count({ where: { districtId: d.id, startDate: { gte: now } } }),
      db.user.count({ where: { districtId: d.id, createdAt: { gte: weekStart } } }),
    ]);
    const engagement = members > 0 ? ((contributions + requests + events) / members * 100).toFixed(1) : "0";
    return { id: d.id, name: d.name, members, families, contributions, requests, events, newUsers, engagement };
  }));
  const avgEngagement = stats.length > 0 ? (stats.reduce((s, d) => s + parseFloat(d.engagement), 0) / stats.length).toFixed(1) : "0";
  return (
    <div className="space-y-6">
      <div><h1 className="font-heading text-2xl font-bold">مراقبة الأحياء</h1><p className="text-sm text-muted-foreground mt-1">نشاط أحياء مراكش هذا الشهر</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">إجمالي الأعضاء</p><p className="text-xl font-bold">{stats.reduce((s, d) => s + d.members, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Home className="size-5 mx-auto text-secondary mb-1" /><p className="text-xs text-muted-foreground">العائلات</p><p className="text-xl font-bold">{stats.reduce((s, d) => s + d.families, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Heart className="size-5 mx-auto text-accent mb-1" /><p className="text-xs text-muted-foreground">مساهمات الشهر</p><p className="text-xl font-bold">{stats.reduce((s, d) => s + d.contributions, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CalendarDays className="size-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">فعاليات قادمة</p><p className="text-xl font-bold">{stats.reduce((s, d) => s + d.events, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UserPlus className="size-5 mx-auto text-secondary mb-1" /><p className="text-xs text-muted-foreground">أعضاء جدد (أسبوع)</p><p className="text-xl font-bold">{stats.reduce((s, d) => s + d.newUsers, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="size-5 mx-auto text-accent mb-1" /><p className="text-xs text-muted-foreground">متوسط الانتماء</p><p className="text-xl font-bold">{avgEngagement}%</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">نشاط كل حي</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>الحي</TableHead><TableHead>الأعضاء</TableHead><TableHead>العائلات</TableHead><TableHead>مساهمات</TableHead><TableHead>طلبات</TableHead><TableHead>فعاليات</TableHead><TableHead>جدد</TableHead><TableHead>انتماء</TableHead></TableRow></TableHeader>
            <TableBody>{stats.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.members}</TableCell><TableCell>{s.families}</TableCell><TableCell>{s.contributions}</TableCell><TableCell>{s.requests}</TableCell><TableCell>{s.events}</TableCell><TableCell>{s.newUsers}</TableCell>
                <TableCell><Badge variant={parseFloat(s.engagement) < parseFloat(avgEngagement) ? "destructive" : "default"}>{s.engagement}%</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
