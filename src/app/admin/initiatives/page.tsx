// ===================================================================
//  صفحة مراقبة المبادرات — /admin/initiatives (للقراءة فقط)
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { Lightbulb, ThumbsUp, CalendarDays, Users, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatNumber,
  formatDateTimeArabic,
  formatDateArabic,
  INITIATIVE_CATEGORY_LABELS,
  INITIATIVE_STATUS_LABELS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export default async function AdminInitiativesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/initiatives");
  }
  if (user.role !== "SUPER_ADMIN" && user.role !== "DISTRICT_MOD") {
    redirect("/admin");
  }

  const [total, totalVotes, pending, todayCount] = await Promise.all([
    db.initiative.count(),
    db.initiative.aggregate({ _sum: { votes: true } }).then((r) => r._sum.votes ?? 0),
    db.initiative.count({
      where: { status: { in: ["proposed", "under_review"] } },
    }),
    db.initiative.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  const recent = await db.initiative.findMany({
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      votes: true,
      targetDate: true,
      createdAt: true,
      proposer: { select: { id: true, fullName: true } },
      _count: { select: { supporters: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            مراقبة المبادرات
          </h1>
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
            <Lightbulb className="size-3 ms-1" />
            {total} مبادرة
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          عرض المبادرات المقترحة في الأحياء. لتغيير حالة المبادرة، افتحها
          من صفحتها العامة واستخدم لوحة الإدارة.
        </p>
      </header>

      <section
        aria-label="إحصاءات"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <KpiCard label="مبادرات" value={formatNumber(total)} icon={Lightbulb} />
        <KpiCard label="أصوات" value={formatNumber(totalVotes)} icon={ThumbsUp} />
        <KpiCard label="بانتظار المراجعة" value={formatNumber(pending)} icon={Clock} />
        <KpiCard label="جديدة اليوم" value={formatNumber(todayCount)} icon={CalendarDays} />
      </section>

      <section aria-labelledby="recent-title">
        <h2
          id="recent-title"
          className="mb-3 font-heading text-lg font-semibold text-foreground flex items-center gap-2"
        >
          <Lightbulb className="size-5 text-accent" />
          آخر 30 مبادرة
        </h2>
        <Card className="border border-border bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">العنوان</TableHead>
                    <TableHead className="text-center">الفئة</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-start">المُقترِح</TableHead>
                    <TableHead className="text-center">أصوات</TableHead>
                    <TableHead className="text-center">داعمون</TableHead>
                    <TableHead className="text-center">الموعد</TableHead>
                    <TableHead className="text-center">أُنشئت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                        لا توجد مبادرات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((i) => {
                      const cat = INITIATIVE_CATEGORY_LABELS[i.category] ?? {
                        label: i.category,
                        color: "slate",
                      };
                      const st = INITIATIVE_STATUS_LABELS[i.status] ?? {
                        label: i.status,
                        color: "slate",
                      };
                      return (
                        <TableRow key={i.id}>
                          <TableCell className="text-start font-medium">
                            <Link
                              href={`/community/initiatives/${i.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {i.title.length > 40
                                ? i.title.slice(0, 40) + "…"
                                : i.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.slate}
                            >
                              {cat.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={COLOR_CLASSES[st.color] ?? COLOR_CLASSES.slate}
                            >
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-start text-sm">
                            {i.proposer.fullName}
                          </TableCell>
                          <TableCell className="text-center font-bold text-primary">
                            {formatNumber(i.votes)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="flex items-center justify-center gap-1 text-xs">
                              <Users className="size-3" />
                              {i._count.supporters}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {i.targetDate ? formatDateArabic(i.targetDate) : "—"}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {formatDateTimeArabic(i.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="size-4 text-accent" strokeWidth={1.5} />
        </div>
        <span className="font-heading text-2xl font-bold text-foreground">
          {value}
        </span>
      </CardContent>
    </Card>
  );
}
