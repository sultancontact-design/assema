// ===================================================================
//  صفحة سجل النشاط — /admin/audit
//  Server Component — يجلب آخر 100 AuditLog، يصفّيها بـsearchParams، يمرّرها
// ===================================================================

import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeArabic } from "@/lib/constants";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

// ===================================================================
//  خريطة ترجمة الأفعال
// ===================================================================

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.login": "تسجيل دخول",
  "user.logout": "تسجيل خروج",
  "user.register": "تسجيل مستخدم جديد",
  "user.role_changed": "تغيير دور مستخدم",
  "user.status_changed": "تغيير حالة مستخدم",
  "fund.contribution.created": "إنشاء مساهمة",
  "fund.contribution.confirmed": "تأكيد مساهمة",
  "fund.contribution.rejected": "رفض مساهمة",
  "fund.request.created": "إنشاء طلب صرف",
  "fund.request.approved": "موافقة على طلب",
  "fund.request.rejected": "رفض طلب",
  "fund.request.disbursed": "صرف طلب",
  "fund.request.vote": "تصويت لجنة النزاهة",
  "system.fraud_detected": "كشف احتيال",
  "admin.settings.updated": "تحديث الإعدادات",
  "admin.backup.downloaded": "تنزيل نسخة احتياطية",
};

function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

// ===================================================================
//  شارة الخطورة
// ===================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: "bg-muted text-muted-foreground border-border",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const labels: Record<string, string> = {
    info: "معلومة",
    warning: "تحذير",
    critical: "حرج",
  };
  return (
    <Badge variant="outline" className={styles[severity] ?? styles.info}>
      {labels[severity] ?? severity}
    </Badge>
  );
}

// ===================================================================
//  الصفحة
// ===================================================================

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // layout يتعامل مع التوجيه

  // 1) قراءة searchParams
  const params = await searchParams;
  const getStr = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";

  const actionFilter = getStr("action").toLowerCase().trim();
  const severityFilter = getStr("severity");
  const fromStr = getStr("from");
  const toStr = getStr("to");

  // 2) بناء شرط Prisma
  const where: {
    OR?: Array<Record<string, unknown>>;
    severity?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (actionFilter) {
    where.OR = [
      { action: { contains: actionFilter } },
      { entity: { contains: actionFilter } },
    ];
  }
  if (severityFilter && severityFilter !== "ALL") {
    where.severity = severityFilter;
  }
  if (fromStr || toStr) {
    where.createdAt = {};
    if (fromStr) {
      where.createdAt.gte = new Date(fromStr);
    }
    if (toStr) {
      // نهاية اليوم المختار
      const toDate = new Date(toStr);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  // 3) جلب آخر 100 سجل
  const logs = await db.auditLog.findMany({
    where,
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          سجل النشاط
        </h1>
        <p className="text-sm text-muted-foreground">
          آخر {logs.length} سجل في النظام — يمكن استخدام الفلاتر للتضييق.
        </p>
      </header>

      <Suspense fallback={<div className="text-sm text-muted-foreground">جارٍ تحميل الفلاتر…</div>}>
        <AuditLogFilters />
      </Suspense>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <History className="size-4 text-accent" strokeWidth={1.5} />
            <span>السجلات ({logs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الفاعل
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الفعل
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الكيان
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    المعرّف
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الخطورة
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الوقت
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        لا توجد سجلات مطابقة للفلاتر
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="text-foreground">
                        {log.actor?.fullName ?? "النظام"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <span className="text-foreground">
                          {actionLabel(log.action)}
                        </span>
                        <span className="ms-2 font-mono text-[10px] text-muted-foreground" dir="ltr">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.entity ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {log.entityId
                          ? log.entityId.length > 12
                            ? `${log.entityId.slice(0, 8)}…`
                            : log.entityId
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={log.severity} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTimeArabic(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
