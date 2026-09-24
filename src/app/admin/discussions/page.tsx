// ===================================================================
//  صفحة مراقبة النقاشات — /admin/discussions (للقراءة فقط)
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Eye, Reply, CalendarDays, Pin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DISCUSSION_CATEGORY_LABELS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDiscussionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/discussions");
  }
  if (user.role !== "SUPER_ADMIN" && user.role !== "DISTRICT_MOD") {
    redirect("/admin");
  }

  const [total, totalReplies, pinned, todayCount] = await Promise.all([
    db.discussion.count(),
    db.discussionReply.count(),
    db.discussion.count({ where: { isPinned: true } }),
    db.discussion.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  const recent = await db.discussion.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      category: true,
      isPinned: true,
      views: true,
      createdAt: true,
      author: { select: { id: true, fullName: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            مراقبة النقاشات
          </h1>
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
            <MessageSquare className="size-3 ms-1" />
            للقراءة فقط
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          عرض نقاشات الحي — للمراقبة وتتبّع النشاط. يمكنك فتح أي نقاش
          للمعاينة في صفحته العامة.
        </p>
      </header>

      <section
        aria-label="إحصاءات"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <KpiCard label="نقاشات" value={formatNumber(total)} icon={MessageSquare} />
        <KpiCard label="ردود" value={formatNumber(totalReplies)} icon={Reply} />
        <KpiCard label="مثبّتة" value={formatNumber(pinned)} icon={Pin} />
        <KpiCard label="جديدة اليوم" value={formatNumber(todayCount)} icon={CalendarDays} />
      </section>

      <section aria-labelledby="recent-title">
        <h2
          id="recent-title"
          className="mb-3 font-heading text-lg font-semibold text-foreground flex items-center gap-2"
        >
          <MessageSquare className="size-5 text-accent" />
          آخر 30 نقاش
        </h2>
        <Card className="border border-border bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">العنوان</TableHead>
                    <TableHead className="text-center">الفئة</TableHead>
                    <TableHead className="text-start">الكاتب</TableHead>
                    <TableHead className="text-center">ردود</TableHead>
                    <TableHead className="text-center">مشاهدات</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        لا توجد نقاشات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-start font-medium">
                          <div className="flex items-center gap-1.5">
                            {d.isPinned && (
                              <Pin className="size-3 text-primary" />
                            )}
                            <Link
                              href={`/community/discussions/${d.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {d.title.length > 50
                                ? d.title.slice(0, 50) + "…"
                                : d.title}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge variant="outline">
                            {DISCUSSION_CATEGORY_LABELS[d.category] ?? d.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-start text-sm">
                          {d.author.fullName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{d._count.replies}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" />
                            {formatNumber(d.views)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {formatDateTimeArabic(d.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
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
