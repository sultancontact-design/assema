"use client";

// ===================================================================
//  DataAdminClient — لوحة إدارة البيانات (client)
//  - جدول كل النماذج مع العدّدات
//  - زرّ "حذف الكل" لكل نموذج (مع نافذة تأكيد)
//  - 3 عمليات مجمّعة (مساهمات معلّقة، طلبات مرفوضة، نقاشات قديمة)
//  - استدعاء DELETE /api/admin/data لكل عملية
//  - sonner toast للإشعار
// ===================================================================

import * as React from "react";
import {
  Database,
  Trash2,
  AlertTriangle,
  History,
  RefreshCw,
  Coins,
  XCircle,
  MessageSquareOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ModelCount {
  name: string;
  label: string;
  softDelete: boolean;
  count: number;
}

interface DataAdminClientProps {
  models: ModelCount[];
  total: number;
}

type PendingAction = {
  model: string;
  mode: "soft" | "hard";
  filter?: Record<string, unknown>;
  label: string;
  hint?: string;
} | null;

export function DataAdminClient({ models, total }: DataAdminClientProps) {
  const [data, setData] = React.useState<ModelCount[]>(models);
  const [totalData, setTotalData] = React.useState(total);
  const [pending, setPending] = React.useState<PendingAction>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function refreshData() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setData(json.models ?? []);
      setTotalData(json.total ?? 0);
      toast.success("تم تحديث العدّادات");
    } catch {
      toast.error("تعذّر تحديث العدّادات");
    } finally {
      setRefreshing(false);
    }
  }

  async function executeAction(action: NonNullable<PendingAction>) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: action.model,
          mode: action.mode,
          filter: action.filter,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "فشل تنفيذ الحذف");
        return;
      }
      toast.success(
        `تم الحذف: ${json.deletedCount ?? 0} سجلّ (${
          json.mode === "soft" ? "حذف ناعم" : "حذف نهائي"
        })`
      );
      setPending(null);
      await refreshData();
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // فتح نافذة تأكيد
  function confirmDelete(
    model: ModelCount,
    mode: "soft" | "hard"
  ) {
    setPending({
      model: model.name,
      mode,
      label: `${model.label} (${model.count} سجلّ)`,
      hint: mode === "soft"
        ? "السجلات ستُعلَّم بحقل deletedAt ويمكن استرجاعها يدوياً من قاعدة البيانات."
        : "تحذير: حذف نهائي لا يمكن استرجاعه. سيُحفظ سجلّ تدقيق فقط.",
    });
  }

  // العمليات المجمّعة
  const bulkActions = [
    {
      id: "pending-contributions",
      title: "حذف كل المساهمات المعلّقة",
      description:
        "حذف نهائي لكل سجلّات Contribution بحالة PENDING. لا يمكن التراجع.",
      icon: Coins,
      color: "border-amber-500/30 bg-amber-500/5",
      iconColor: "text-amber-600",
      action: {
        model: "contribution",
        mode: "hard" as const,
        filter: { status: "PENDING" },
        label: "المساهمات المعلّقة (PENDING)",
        hint: "حذف نهائي للمساهمات غير المؤكّدة.",
      },
    },
    {
      id: "rejected-requests",
      title: "حذف كل الطلبات المرفوضة",
      description:
        "حذف ناعم لكل سجلّات FundRequest بحالة REJECTED. يمكن استرجاعها يدوياً.",
      icon: XCircle,
      color: "border-rose-600/30 bg-rose-600/5",
      iconColor: "text-rose-600",
      action: {
        model: "fundRequest",
        mode: "soft" as const,
        filter: { status: "REJECTED" },
        label: "طلبات الصندوق المرفوضة (REJECTED)",
        hint: "حذف ناعم — يُعلَّم السجلّ بحقل deletedAt.",
      },
    },
    {
      id: "old-discussions",
      title: "حذف كل النقاشات القديمة",
      description:
        "حذف نهائي للنقاشات التي مرّ عليها أكثر من 90 يوماً. لا يمكن التراجع.",
      icon: MessageSquareOff,
      color: "border-zinc-500/30 bg-zinc-500/5",
      iconColor: "text-zinc-600",
      action: (() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        return {
          model: "discussion",
          mode: "hard" as const,
          filter: { createdAt: { lt: cutoff.toISOString() } },
          label: "النقاشات الأقدم من 90 يوماً",
          hint: "حذف نهائي للنقاشات القديمة.",
        };
      })(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات المعلومات */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/60 p-1.5">
                <Database className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  إجمالي النماذج
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {data.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/60 p-1.5">
                <History className="size-5 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  النماذج القابلة للحذف الناعم
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {data.filter((m) => m.softDelete).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/60 p-1.5">
                <Database className="size-5 text-accent" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  إجمالي السجلّات
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {totalData.toLocaleString("ar-MA")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="h-11 w-full gap-2"
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
              {refreshing ? "جارٍ التحديث…" : "تحديث العدّادات"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* العمليات المجمّعة */}
      <section>
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">
          عمليات مجمّعة
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {bulkActions.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.id} className={cn("border", b.color)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className={cn("size-4", b.iconColor)} />
                    {b.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {b.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full gap-1.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => setPending(b.action)}
                    disabled={submitting}
                  >
                    <Trash2 className="size-3.5" />
                    تنفيذ
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* جدول النماذج */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="size-4 text-accent" />
            <span>قائمة النماذج ({data.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-start">النموذج</TableHead>
                  <TableHead className="text-start">التسمية</TableHead>
                  <TableHead className="text-start">نوع الحذف</TableHead>
                  <TableHead className="text-start">عدد السجلّات</TableHead>
                  <TableHead className="text-start"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow key={m.name}>
                    <TableCell>
                      <code className="text-[11px] text-foreground/80 font-mono">
                        {m.name}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {m.label}
                    </TableCell>
                    <TableCell>
                      {m.softDelete ? (
                        <Badge
                          variant="outline"
                          className="border-secondary/30 bg-secondary/10 text-secondary"
                        >
                          ناعم + نهائي
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-rose-600/30 bg-rose-600/10 text-rose-700"
                        >
                          نهائي فقط
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">
                        {m.count.toLocaleString("ar-MA")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {m.softDelete && m.count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 min-w-11 gap-1 text-amber-700 hover:bg-amber-50"
                            onClick={() => confirmDelete(m, "soft")}
                            disabled={submitting}
                          >
                            حذف ناعم
                          </Button>
                        )}
                        {m.name !== "auditLog" && m.count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 min-w-11 gap-1 text-rose-700 hover:bg-rose-50"
                            onClick={() => confirmDelete(m, "hard")}
                            disabled={submitting}
                          >
                            <Trash2 className="size-3.5" />
                            حذف الكل
                          </Button>
                        )}
                        {m.count === 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            فارغ
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة التأكيد */}
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-600" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك تنفيذ:
              <br />
              <span className="font-semibold text-foreground">
                {pending?.label}
              </span>
              {pending?.hint && (
                <>
                  <br />
                  <span className="text-[11px] text-muted-foreground">
                    {pending.hint}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={submitting}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-rose-600 hover:bg-rose-700 text-background"
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                if (pending) void executeAction(pending);
              }}
            >
              {submitting ? "جارٍ التنفيذ…" : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DataAdminClient;
