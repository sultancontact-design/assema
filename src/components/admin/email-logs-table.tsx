"use client";

// ===================================================================
//  EmailLogsTable — جدول آخر 20 بريد + أزرار إعادة الإرسال
//  - يستقبل السجلّات الأولية (initialLogs) + الإحصاءات (stats)
//  - زر "إعادة إرسال" لكل سجلّ فاشل
//  - زر "تحديث" لجلب آخر السجلّات
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  RotateCcw,
  MailCheck,
  MailX,
  Clock,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

// ===================================================================
//  الأنواع
// ===================================================================

export interface EmailLogRow {
  id: string;
  to: string;
  subject: string;
  status: "sent" | "failed" | "pending" | string;
  error: string | null;
  messageId: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface EmailStatsState {
  sentToday: number;
  failedToday: number;
  pendingToday: number;
  successRate: number;
}

interface Props {
  initialLogs: EmailLogRow[];
  stats: EmailStatsState;
}

// ===================================================================
//  خريطة الحالة → label + لون
// ===================================================================

const STATUS_LABEL: Record<string, string> = {
  sent: "مُرسَل",
  failed: "فشل",
  pending: "بانتظار",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  if (status === "sent") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
      >
        <MailCheck className="me-1 size-3" strokeWidth={1.5} />
        {label}
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
        <MailX className="me-1 size-3" strokeWidth={1.5} />
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <Clock className="me-1 size-3" strokeWidth={1.5} />
      {label}
    </Badge>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-MA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function EmailLogsTable({ initialLogs, stats }: Props) {
  const [logs, setLogs] = React.useState<EmailLogRow[]>(initialLogs);
  const [refreshing, setRefreshing] = React.useState(false);
  const [resendingIds, setResendingIds] = React.useState<Set<string>>(new Set());

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/settings/email/logs", {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.logs)) {
        setLogs(data.logs as EmailLogRow[]);
        toast.success("تمّ تحديث السجلّات");
      } else {
        toast.error("فشل تحديث السجلّات");
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleResend(id: string) {
    setResendingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/admin/settings/email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تمّت إعادة الإرسال بنجاح");
        // تحديث محلي للحالة
        setLogs((prev) =>
          prev.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: "sent",
                  error: null,
                  sentAt: new Date().toISOString(),
                }
              : l
          )
        );
      } else {
        toast.error("فشلت إعادة الإرسال");
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
    >
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Inbox className="size-5 text-accent" strokeWidth={1.5} />
                سجلّ البريد المُرسَل
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                آخر 20 بريد — مرتّبة من الأحدث للأقدم. أعد إرسال أي بريد
                فاشل بضغطة زر.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-11 gap-2"
              aria-label="تحديث"
            >
              <RefreshCw
                className={refreshing ? "size-4 animate-spin" : "size-4"}
                strokeWidth={1.5}
              />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* بطاقات الإحصاءات */}
          <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
            <StatCard
              label="مُرسَل اليوم"
              value={stats.sentToday}
              color="text-emerald-700 dark:text-emerald-300"
            />
            <StatCard
              label="فشل اليوم"
              value={stats.failedToday}
              color="text-rose-700 dark:text-rose-300"
            />
            <StatCard
              label="بانتظار اليوم"
              value={stats.pendingToday}
              color="text-amber-700 dark:text-amber-300"
            />
            <StatCard
              label="نسبة النجاح"
              value={`${stats.successRate.toFixed(1)}%`}
              color="text-secondary"
            />
          </div>

          {/* الجدول */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-start">المُستلِم</TableHead>
                  <TableHead className="text-start">الموضوع</TableHead>
                  <TableHead className="text-start">الحالة</TableHead>
                  <TableHead className="text-start hidden md:table-cell">
                    وقت الإرسال
                  </TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      لا توجد سجلّات بريد بعد.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isFailed = log.status === "failed";
                    const isResending = resendingIds.has(log.id);
                    return (
                      <TableRow key={log.id} className="text-sm">
                        <TableCell
                          className="text-start font-mono text-xs"
                          dir="ltr"
                        >
                          {log.to}
                        </TableCell>
                        <TableCell className="text-start">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-1 max-w-[220px] cursor-help">
                                  {log.subject}
                                </span>
                              </TooltipTrigger>
                              {log.error && (
                                <TooltipContent
                                  side="top"
                                  className="max-w-[400px] font-mono text-xs"
                                >
                                  {log.error}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-start">
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-start text-xs text-muted-foreground">
                          {formatDateTime(log.sentAt ?? log.createdAt)}
                        </TableCell>
                        <TableCell className="text-end">
                          {isFailed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResend(log.id)}
                              disabled={isResending}
                              className="h-9 gap-1.5"
                            >
                              {isResending ? (
                                <span
                                  className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                  aria-hidden="true"
                                />
                              ) : (
                                <RotateCcw
                                  className="size-3.5"
                                  strokeWidth={1.5}
                                />
                              )}
                              <span className="hidden sm:inline">
                                {isResending ? "..." : "إعادة"}
                              </span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
    </motion.div>
  );
}

// ===================================================================
//  StatCard — بطاقة إحصاء
// ===================================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
