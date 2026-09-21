"use client";

// ===================================================================
//  ComplaintsTable — جدول إدارة الشكاوى
//  - فلتر: بحث + نوع + حالة + أولوية
//  - بطاقات إحصاءات: مفتوحة / قيد المعالجة / تم حلّها / مغلقة
//  - Sheet تفصيلي: الوصف + المرفقات + الحالة + المُعالج + نموذج القرار
//  - POST /api/admin/complaints/[id]/resolve — لإرسال القرار
// ===================================================================

import * as React from "react";
import {
  Search,
  MoreVertical,
  Eye,
  FileText,
  MessageSquareWarning,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  formatDateTimeArabic,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ComplaintType, ComplaintStatus } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminComplaintRow {
  id: string;
  isAnonymous: boolean;
  filedByName: string | null;
  type: ComplaintType;
  subject: string;
  description: string;
  attachments: string | null; // JSON array
  status: ComplaintStatus;
  priority: string;
  handledByName: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintsTableProps {
  complaints: AdminComplaintRow[];
  canResolve: boolean;
}

// ===================================================================
//  شارات مساعدة
// ===================================================================

function TypeBadge({ type }: { type: ComplaintType }) {
  return (
    <Badge variant="outline" className="text-xs">
      {COMPLAINT_TYPE_LABELS[type]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const styles: Record<ComplaintStatus, string> = {
    OPEN: "bg-amber-100 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
    RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[status])}>
      {COMPLAINT_STATUS_LABELS[status]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "border-slate-200 bg-slate-50 text-slate-600",
    normal: "border-blue-200 bg-blue-50 text-blue-700",
    high: "border-amber-200 bg-amber-50 text-amber-700",
    urgent: "border-rose-200 bg-rose-100 text-rose-700",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[priority] ?? styles.normal)}>
      {COMPLAINT_PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}

// ===================================================================
//  بطاقات الإحصاءات
// ===================================================================

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "amber" | "blue" | "emerald" | "slate";
}) {
  const styles: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md",
            styles[variant]
          )}
        >
          {icon}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  شريط الفلاتر
// ===================================================================

interface Filters {
  search: string;
  type: string;
  status: string;
  priority: string;
}

function ComplaintsFilters({
  filters,
  onFilterChange,
  resultCount,
  onClear,
}: {
  filters: Filters;
  onFilterChange: (next: Partial<Filters>) => void;
  resultCount: number;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="relative flex-1 lg:max-w-xs">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="ابحث في الموضوع أو الوصف"
            className="h-10 ps-9"
            aria-label="بحث في الشكاوى"
          />
        </div>

        <Select
          value={filters.type}
          onValueChange={(v) => onFilterChange({ type: v })}
        >
          <SelectTrigger className="h-10 w-full lg:w-36" aria-label="فلتر النوع">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الأنواع</SelectItem>
            {Object.entries(COMPLAINT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onFilterChange({ status: v })}
        >
          <SelectTrigger className="h-10 w-full lg:w-36" aria-label="فلتر الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            {Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(v) => onFilterChange({ priority: v })}
        >
          <SelectTrigger className="h-10 w-full lg:w-36" aria-label="فلتر الأولوية">
            <SelectValue placeholder="كل الأولويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الأولويات</SelectItem>
            {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-10"
          onClick={onClear}
        >
          مسح
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {resultCount} شكوى
        </p>
      </div>
    </div>
  );
}

// ===================================================================
//  Sheet التفاصيل + نموذج القرار
// ===================================================================

function ComplaintDetailSheet({
  complaint,
  open,
  onOpenChange,
  canResolve,
  onSubmit,
  submitting,
}: {
  complaint: AdminComplaintRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canResolve: boolean;
  onSubmit: (complaintId: string, resolution: string, status: ComplaintStatus) => Promise<void>;
  submitting: boolean;
}) {
  const [resolution, setResolution] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<ComplaintStatus>("IN_PROGRESS");

  React.useEffect(() => {
    if (complaint) {
      setResolution(complaint.resolution ?? "");
      setNewStatus(
        complaint.status === "OPEN" ? "IN_PROGRESS" : complaint.status
      );
    }
  }, [complaint]);

  if (!complaint) return null;

  // تحليل المرفقات (JSON array of file paths)
  let attachments: string[] = [];
  if (complaint.attachments) {
    try {
      const parsed = JSON.parse(complaint.attachments);
      if (Array.isArray(parsed)) {
        attachments = parsed.filter((s) => typeof s === "string");
      }
    } catch {
      // ليس JSON — ربّما مسار واحد
      attachments = [complaint.attachments];
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint) return;
    await onSubmit(complaint.id, resolution, newStatus);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border bg-muted/30 p-4 text-start">
          <SheetTitle className="text-start text-lg font-bold text-foreground">
            تفاصيل الشكوى
          </SheetTitle>
          <SheetDescription className="text-start text-xs text-muted-foreground">
            أُرسلت بتاريخ {formatDateTimeArabic(complaint.createdAt)} · آخر تحديث{" "}
            {formatDateTimeArabic(complaint.updatedAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* بطاقة الحالة */}
          <section className="space-y-3 border-b border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={complaint.type} />
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {complaint.subject}
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">المُقدِّم</dt>
                <dd className="font-medium text-foreground">
                  {complaint.isAnonymous ? (
                    <span className="text-muted-foreground">مجهول الهوية</span>
                  ) : (
                    complaint.filedByName ?? "—"
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">المُعالِج</dt>
                <dd className="font-medium text-foreground">
                  {complaint.handledByName ?? (
                    <span className="text-muted-foreground">غير معيّن</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* الوصف الكامل */}
          <section className="space-y-2 border-b border-border p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="size-4 text-accent" strokeWidth={1.5} />
              <span>الوصف</span>
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {complaint.description}
            </p>
          </section>

          {/* المرفقات */}
          {attachments.length > 0 && (
            <section className="space-y-2 border-b border-border p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertCircle className="size-4 text-accent" strokeWidth={1.5} />
                <span>المرفقات ({attachments.length})</span>
              </h4>
              <ul className="space-y-1.5">
                {attachments.map((path, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="truncate font-mono" title={path}>
                      {path}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* القرار الحالي */}
          {complaint.resolution && (
            <section className="space-y-2 border-b border-border p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={1.5} />
                <span>القرار الحالي</span>
              </h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {complaint.resolution}
              </p>
              {complaint.resolvedAt && (
                <p className="text-xs text-muted-foreground">
                  تاريخ الحلّ: {formatDateTimeArabic(complaint.resolvedAt)}
                </p>
              )}
            </section>
          )}

          {/* نموذج القرار */}
          {canResolve && (
            <section className="space-y-3 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquareWarning
                  className="size-4 text-accent"
                  strokeWidth={1.5}
                />
                <span>معالجة الشكوى</span>
              </h4>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="res-status">الحالة الجديدة</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v) => setNewStatus(v as ComplaintStatus)}
                  >
                    <SelectTrigger id="res-status" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">قيد المعالجة</SelectItem>
                      <SelectItem value="RESOLVED">تم حلّها</SelectItem>
                      <SelectItem value="CLOSED">مغلقة</SelectItem>
                      <SelectItem value="REJECTED">مرفوضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="res-text">
                    القرار / التعليل{" "}
                    {(newStatus === "RESOLVED" || newStatus === "REJECTED") &&
                      "*"}
                  </Label>
                  <Textarea
                    id="res-text"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="اكتب تفاصيل القرار. يصل صاحب الشكوى عبر إشعار."
                    required={
                      newStatus === "RESOLVED" || newStatus === "REJECTED"
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="h-10 w-full"
                  disabled={submitting}
                >
                  {submitting ? "جارٍ الإرسال..." : "حفظ القرار"}
                </Button>
              </form>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ===================================================================
//  المكوّن الرئيسي
// ===================================================================

export function ComplaintsTable({
  complaints,
  canResolve,
}: ComplaintsTableProps) {
  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    type: "ALL",
    status: "ALL",
    priority: "ALL",
  });
  const [detailComplaint, setDetailComplaint] =
    React.useState<AdminComplaintRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function updateFilters(next: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  // ─────────── تصفية ───────────
  const filtered = React.useMemo(() => {
    return complaints.filter((c) => {
      // بحث
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${c.subject} ${c.description} ${c.filedByName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // نوع
      if (filters.type !== "ALL" && c.type !== filters.type) return false;
      // حالة
      if (filters.status !== "ALL" && c.status !== filters.status) return false;
      // أولوية
      if (filters.priority !== "ALL" && c.priority !== filters.priority)
        return false;
      return true;
    });
  }, [complaints, filters]);

  // ─────────── إحصاءات ───────────
  const stats = React.useMemo(() => {
    const s = { open: 0, inProgress: 0, resolved: 0, closed: 0 };
    for (const c of complaints) {
      if (c.status === "OPEN") s.open++;
      else if (c.status === "IN_PROGRESS") s.inProgress++;
      else if (c.status === "RESOLVED") s.resolved++;
      else if (c.status === "CLOSED") s.closed++;
    }
    return s;
  }, [complaints]);

  // ─────────── الإرسال للخادم ───────────

  async function handleResolve(
    complaintId: string,
    resolution: string,
    status: ComplaintStatus
  ) {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/complaints/${complaintId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution: resolution.trim() || null,
            status,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل إرسال القرار");
        return;
      }
      toast.success("تم تحديث الشكوى بنجاح");
      setDetailComplaint(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────── عرض الجدول ───────────

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="مفتوحة"
          value={stats.open}
          icon={<AlertCircle className="size-5" strokeWidth={1.5} />}
          variant="amber"
        />
        <StatCard
          label="قيد المعالجة"
          value={stats.inProgress}
          icon={<Clock className="size-5" strokeWidth={1.5} />}
          variant="blue"
        />
        <StatCard
          label="تم حلّها"
          value={stats.resolved}
          icon={<CheckCircle2 className="size-5" strokeWidth={1.5} />}
          variant="emerald"
        />
        <StatCard
          label="مغلقة"
          value={stats.closed}
          icon={<XCircle className="size-5" strokeWidth={1.5} />}
          variant="slate"
        />
      </div>

      {/* الفلاتر */}
      <ComplaintsFilters
        filters={filters}
        onFilterChange={updateFilters}
        resultCount={filtered.length}
        onClear={() =>
          setFilters({ search: "", type: "ALL", status: "ALL", priority: "ALL" })
        }
      />

      {/* الجدول */}
      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">
                    النوع
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الأولوية
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الموضوع
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    المُقدِّم
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الحالة
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    التاريخ
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    إجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                        <MessageSquareWarning
                          className="size-6 text-muted-foreground/50"
                          strokeWidth={1.5}
                        />
                        <p>لا توجد شكاوى مطابقة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="text-sm">
                      <TableCell>
                        <TypeBadge type={c.type} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={c.priority} />
                      </TableCell>
                      <TableCell className="max-w-[240px] font-medium text-foreground">
                        <div className="truncate" title={c.subject}>
                          {c.subject}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {c.isAnonymous ? (
                          <span className="text-muted-foreground">مجهول</span>
                        ) : (
                          c.filedByName ?? "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTimeArabic(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`إجراءات ${c.subject}`}
                            >
                              <MoreVertical className="size-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => setDetailComplaint(c)}
                            >
                              <Eye className="size-4" strokeWidth={1.5} />
                              <span>عرض التفاصيل</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sheet التفاصيل + نموذج القرار */}
      <ComplaintDetailSheet
        complaint={detailComplaint}
        open={!!detailComplaint}
        onOpenChange={(v) => !v && setDetailComplaint(null)}
        canResolve={canResolve}
        onSubmit={handleResolve}
        submitting={submitting}
      />
    </div>
  );
}
