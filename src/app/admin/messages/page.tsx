// ===================================================================
//  صفحة مراقبة الرسائل — /admin/messages (للقراءة فقط)
//  Server Component — SUPER_ADMIN فقط
//  يعرض إحصاءات سريعة + أحدث الرسائل
// ===================================================================

import { redirect } from "next/navigation";
import { Mail, Activity, Users, Clock } from "lucide-react";
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
import { formatNumber, formatDateTimeArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/messages");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // إحصاءات
  const [
    totalMessages,
    totalRead,
    todayCount,
    activeUsers,
  ] = await Promise.all([
    db.directMessage.count(),
    db.directMessage.count({ where: { readAt: { not: null } } }),
    db.directMessage.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.user.count({
      where: {
        OR: [
          { sentMessages: { some: {} } },
          { receivedMessages: { some: {} } },
        ],
      },
    }),
  ]);

  // آخر 30 رسالة (للقراءة فقط — لا نُظهر المحتوى الكامل احتراماً للخصوصية)
  const recent = await db.directMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      readAt: true,
      createdAt: true,
      sender: { select: { id: true, fullName: true, districtId: true } },
      receiver: { select: { id: true, fullName: true, districtId: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            مراقبة الرسائل
          </h1>
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
            <Mail className="size-3 ms-1" />
            للقراءة فقط
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          عرض إحصائي لنشاط الرسائل المباشرة. المحتوى يبقى خاصاً بين الأطراف
          — نعرض فقط البيانات الوصفية لرصد الأنشطة المشبوهة.
        </p>
      </header>

      {/* KPI */}
      <section
        aria-label="إحصاءات"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <KpiCard label="إجمالي الرسائل" value={formatNumber(totalMessages)} icon={Mail} />
        <KpiCard label="رسائل اليوم" value={formatNumber(todayCount)} icon={Clock} />
        <KpiCard label="مقروءة" value={formatNumber(totalRead)} icon={Activity} />
        <KpiCard label="مستخدمون نشطون" value={formatNumber(activeUsers)} icon={Users} />
      </section>

      {/* جدول آخر الرسائل */}
      <section aria-labelledby="recent-title">
        <h2
          id="recent-title"
          className="mb-3 font-heading text-lg font-semibold text-foreground flex items-center gap-2"
        >
          <Mail className="size-5 text-accent" />
          آخر 30 رسالة
        </h2>
        <Card className="border border-border bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">المُرسِل</TableHead>
                    <TableHead className="text-start">المُستقبِل</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        لا توجد رسائل بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-start font-medium">
                          {m.sender.fullName}
                        </TableCell>
                        <TableCell className="text-start">
                          {m.receiver.fullName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              m.readAt
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            }
                          >
                            {m.readAt ? "مقروءة" : "غير مقروءة"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {formatDateTimeArabic(m.createdAt)}
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
