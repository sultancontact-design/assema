"use client";

// ===================================================================
//  EventsTable — جدول إدارة الفعاليات (client-side filtering + tabs)
//  - تبويبات: القادمة / المنتهية / الملغاة / كل الفعاليات
//  - فلتر: بحث + نوع + نطاق تاريخ
//  - تصدير CSV عبر مكتبة xlsx
//  - إجراءات: عرض / تعديل / حذف (مع تأكيد)
//  - زر "فعالية جديدة" يفتح نافذة الإنشاء
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Plus,
  CalendarDays,
  MapPin,
  Users as UsersIcon,
  Download,
  CalendarRange,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  formatDateArabic,
  formatDateTimeArabic,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EventType, EventStatus } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminEventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string; // ISO
  endDate: string | null;
  location: string;
  maxAttendees: number | null;
  isRegistrationOpen: boolean;
  registrationsCount: number;
}

interface EventsTableProps {
  events: AdminEventRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// ===================================================================
//  شارة النوع (مع إيموجي)
// ===================================================================

function EventTypeBadge({ type }: { type: EventType }) {
  const meta = EVENT_TYPE_LABELS[type];
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <span aria-hidden="true">{meta.emoji}</span>
      <span>{meta.label}</span>
    </Badge>
  );
}

// ===================================================================
//  شارة الحالة
// ===================================================================

function EventStatusBadge({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ONGOING: "bg-amber-100 text-amber-700 border-amber-200",
    COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[status])}>
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}

// ===================================================================
//  شريط التقدّم للتسجيلات
// ===================================================================

function RegistrationProgress({
  registered,
  max,
}: {
  registered: number;
  max: number | null;
}) {
  const pct =
    max && max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UsersIcon className="size-3.5" strokeWidth={1.5} />
        <span className="font-mono">
          {registered}
          {max ? ` / ${max}` : ""}
        </span>
      </div>
      {max && max > 0 ? (
        <Progress value={pct} className="h-1.5 w-24" />
      ) : (
        <span className="text-[10px] text-muted-foreground">غير محدود</span>
      )}
    </div>
  );
}

// ===================================================================
//  تبويب + تصنيف الأحداث حسب التبويب
// ===================================================================

type EventTab = "upcoming" | "completed" | "cancelled" | "all";

function isUpcoming(e: AdminEventRow, now: Date): boolean {
  return new Date(e.startDate) > now && e.status !== "CANCELLED";
}
function isCompleted(e: AdminEventRow, now: Date): boolean {
  return new Date(e.startDate) <= now && e.status !== "CANCELLED";
}
function isCancelled(e: AdminEventRow): boolean {
  return e.status === "CANCELLED";
}

// ===================================================================
//  شريط الفلاتر (بحث + نوع + نطاق تاريخ + تصدير)
// ===================================================================

interface Filters {
  search: string;
  type: string; // EventType | "ALL"
  from: string;
  to: string;
}

function EventsFilters({
  filters,
  onFilterChange,
  resultCount,
  onExport,
  onClear,
}: {
  filters: Filters;
  onFilterChange: (next: Partial<Filters>) => void;
  resultCount: number;
  onExport: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        {/* بحث */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="ابحث بالعنوان أو المكان"
            className="h-10 ps-9"
            aria-label="بحث عن فعالية"
          />
        </div>

        {/* فلتر النوع */}
        <Select
          value={filters.type}
          onValueChange={(v) => onFilterChange({ type: v })}
        >
          <SelectTrigger className="h-10 w-full lg:w-40" aria-label="فلتر النوع">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الأنواع</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.emoji} {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* من تاريخ */}
        <div className="relative flex-1 lg:max-w-44">
          <CalendarRange
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => onFilterChange({ from: e.target.value })}
            className="h-10 ps-9"
            aria-label="من تاريخ"
          />
        </div>

        {/* إلى تاريخ */}
        <div className="relative flex-1 lg:max-w-44">
          <CalendarRange
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => onFilterChange({ to: e.target.value })}
            className="h-10 ps-9"
            aria-label="إلى تاريخ"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-10"
          onClick={onClear}
          aria-label="مسح الفلاتر"
        >
          مسح
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2"
          onClick={onExport}
          disabled={resultCount === 0}
        >
          <Download className="size-4" strokeWidth={1.5} />
          <span>تصدير CSV</span>
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {resultCount} فعالية
        </p>
      </div>
    </div>
  );
}

// ===================================================================
//  نموذج الإنشاء/التعديل — يُستعمل لكلا الحالتين
// ===================================================================

interface EventFormValues {
  title: string;
  description: string;
  type: EventType;
  startDate: string; // datetime-local value
  endDate: string;
  location: string;
  maxAttendees: string;
  isRegistrationOpen: boolean;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  // datetime-local يحتاج "YYYY-MM-DDTHH:mm" (بدون ثوانٍ ومنطقة زمنية)
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventFormDialog({
  mode,
  initial,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  initial: AdminEventRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
  submitting: boolean;
}) {
  const [values, setValues] = React.useState<EventFormValues>(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "MONTHLY",
    startDate: initial ? toDatetimeLocalValue(initial.startDate) : "",
    endDate: initial?.endDate ? toDatetimeLocalValue(initial.endDate) : "",
    location: initial?.location ?? "",
    maxAttendees: initial?.maxAttendees ? String(initial.maxAttendees) : "",
    isRegistrationOpen: initial?.isRegistrationOpen ?? true,
  }));

  React.useEffect(() => {
    if (open) {
      setValues({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        type: initial?.type ?? "MONTHLY",
        startDate: initial ? toDatetimeLocalValue(initial.startDate) : "",
        endDate: initial?.endDate ? toDatetimeLocalValue(initial.endDate) : "",
        location: initial?.location ?? "",
        maxAttendees: initial?.maxAttendees ? String(initial.maxAttendees) : "",
        isRegistrationOpen: initial?.isRegistrationOpen ?? true,
      });
    }
  }, [open, initial]);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.location.trim() || !values.startDate) {
      toast.error("العنوان والمكان وتاريخ البداية مطلوبة");
      return;
    }
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "فعالية جديدة" : "تعديل الفعالية"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "أنشئ فعالية جديدة في الحي. ستظهر مباشرةً للجمهور إذا فُتح التسجيل."
              : "عدّل بيانات الفعالية. التغييرات تنطبق فوراً."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* العنوان */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="ev-title">العنوان *</Label>
            <Input
              id="ev-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              className="h-10"
              placeholder="مثال: لقاء شهري للأمهات"
              required
            />
          </div>

          {/* الوصف */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="ev-desc">الوصف *</Label>
            <Textarea
              id="ev-desc"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[80px]"
              placeholder="نبذة عن الفعالية وبرنامجها"
              required
            />
          </div>

          {/* النوع */}
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="ev-type">النوع</Label>
            <Select
              value={values.type}
              onValueChange={(v) => set("type", v as EventType)}
            >
              <SelectTrigger id="ev-type" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.emoji} {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الحد الأقصى للحضور */}
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="ev-max">الحد الأقصى للحضور</Label>
            <Input
              id="ev-max"
              type="number"
              min={1}
              value={values.maxAttendees}
              onChange={(e) => set("maxAttendees", e.target.value)}
              className="h-10"
              placeholder="اتركه فارغاً = غير محدود"
            />
          </div>

          {/* تاريخ البداية */}
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="ev-start">تاريخ البداية *</Label>
            <Input
              id="ev-start"
              type="datetime-local"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="h-10"
              required
            />
          </div>

          {/* تاريخ النهاية */}
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="ev-end">تاريخ النهاية</Label>
            <Input
              id="ev-end"
              type="datetime-local"
              value={values.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="h-10"
            />
          </div>

          {/* المكان */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="ev-loc">المكان *</Label>
            <Input
              id="ev-loc"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              className="h-10"
              placeholder="مثال: مقر الحي — سيدي يوسف بن علي"
              required
            />
          </div>

          {/* التسجيل مفتوح */}
          <div className="col-span-1 sm:col-span-2 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="ev-open" className="text-sm font-medium">
                التسجيل مفتوح
              </Label>
              <span className="text-xs text-muted-foreground">
                اسمح للأعضاء بالتسجيل في الفعالية
              </span>
            </div>
            <Switch
              id="ev-open"
              checked={values.isRegistrationOpen}
              onCheckedChange={(v) => set("isRegistrationOpen", v)}
            />
          </div>

          <DialogFooter className="col-span-1 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "جارٍ الحفظ..."
                : mode === "create"
                  ? "إنشاء"
                  : "حفظ التعديل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  المكوّن الرئيسي
// ===================================================================

export function EventsTable({
  events,
  canCreate,
  canEdit,
  canDelete,
}: EventsTableProps) {
  // التبويب النشط
  const [tab, setTab] = React.useState<EventTab>("upcoming");

  // الفلاتر
  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    type: "ALL",
    from: "",
    to: "",
  });

  // النوافذ المنبثقة
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<AdminEventRow | null>(null);
  const [deleteEvent, setDeleteEvent] = React.useState<AdminEventRow | null>(
    null
  );
  const [submitting, setSubmitting] = React.useState(false);

  function updateFilters(next: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  // تصفية مشتركة (بحث + نوع + نطاق تاريخ)
  const baseFiltered = React.useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      // بحث
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${e.title} ${e.location} ${e.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // نوع
      if (filters.type !== "ALL" && e.type !== filters.type) return false;
      // نطاق تاريخ (يُطبّق على startDate)
      if (filters.from) {
        const fromD = new Date(filters.from);
        if (new Date(e.startDate) < fromD) return false;
      }
      if (filters.to) {
        const toD = new Date(filters.to);
        toD.setHours(23, 59, 59, 999);
        if (new Date(e.startDate) > toD) return false;
      }
      void now;
      return true;
    });
  }, [events, filters]);

  // تصنيف التبويبات
  const now = new Date();
  const upcoming = baseFiltered.filter((e) => isUpcoming(e, now));
  const completed = baseFiltered.filter((e) => isCompleted(e, now));
  const cancelled = baseFiltered.filter((e) => isCancelled(e));

  const activeList =
    tab === "upcoming"
      ? upcoming
      : tab === "completed"
        ? completed
        : tab === "cancelled"
          ? cancelled
          : baseFiltered;

  // ترتيب: الأحدث أولاً (حسب startDate)
  const sorted = React.useMemo(() => {
    return [...activeList].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [activeList]);

  // ─────────── إجراءات الخادم ───────────

  async function handleCreate(values: EventFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          type: values.type,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          location: values.location.trim(),
          maxAttendees: values.maxAttendees
            ? Number(values.maxAttendees)
            : null,
          isRegistrationOpen: values.isRegistrationOpen,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل إنشاء الفعالية");
        return;
      }
      toast.success("تم إنشاء الفعالية بنجاح");
      setCreateOpen(false);
      // إعادة تحميل الصفحة من الخادم لجلب البيانات المحدّثة
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(values: EventFormValues) {
    if (!editEvent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${editEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          type: values.type,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          location: values.location.trim(),
          maxAttendees: values.maxAttendees
            ? Number(values.maxAttendees)
            : null,
          isRegistrationOpen: values.isRegistrationOpen,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تحديث الفعالية");
        return;
      }
      toast.success("تم تحديث الفعالية بنجاح");
      setEditEvent(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteEvent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${deleteEvent.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل حذف الفعالية");
        return;
      }
      toast.success("تم حذف الفعالية بنجاح");
      setDeleteEvent(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────── تصدير CSV عبر xlsx ───────────

  function exportCSV() {
    const rows = sorted.map((e) => ({
      "العنوان": e.title,
      "النوع": EVENT_TYPE_LABELS[e.type].label,
      "الحالة": EVENT_STATUS_LABELS[e.status],
      "تاريخ البداية": formatDateTimeArabic(e.startDate),
      "تاريخ النهاية": e.endDate ? formatDateTimeArabic(e.endDate) : "—",
      "المكان": e.location,
      "المسجلون": e.registrationsCount,
      "الحد الأقصى": e.maxAttendees ?? "غير محدود",
      "التسجيل مفتوح": e.isRegistrationOpen ? "نعم" : "لا",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // أضف خاصية RTL للورقة
    if (!ws["!cols"]) ws["!cols"] = [];
    ws["!cols"] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 28 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الفعاليات");
    XLSX.writeFile(wb, `فعاليات_${new Date().toISOString().slice(0, 10)}.csv`, {
      bookType: "csv",
    });
    toast.success(`تم تصدير ${rows.length} فعالية`);
  }

  // ─────────── عرض الجدول ───────────

  function renderTable(list: AdminEventRow[]) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <CalendarDays
            className="size-6 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <p>لا توجد فعاليات مطابقة</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start text-xs text-muted-foreground">
                العنوان
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                النوع
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                تاريخ البداية
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المكان
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المسجلون
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الحالة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id} className="text-sm">
                <TableCell className="max-w-[220px] font-medium text-foreground">
                  <div className="truncate" title={e.title}>
                    {e.title}
                  </div>
                </TableCell>
                <TableCell>
                  <EventTypeBadge type={e.type} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTimeArabic(e.startDate)}
                </TableCell>
                <TableCell className="max-w-[180px] text-xs text-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin
                      className="size-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="truncate" title={e.location}>
                      {e.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <RegistrationProgress
                    registered={e.registrationsCount}
                    max={e.maxAttendees}
                  />
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={e.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`إجراءات ${e.title}`}
                      >
                        <MoreVertical className="size-4" strokeWidth={1.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/community/events/${e.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Eye className="size-4" strokeWidth={1.5} />
                          <span>عرض</span>
                        </Link>
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem
                          onSelect={() => setEditEvent(e)}
                          disabled={!canEdit}
                        >
                          <Pencil className="size-4" strokeWidth={1.5} />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteEvent(e)}
                            variant="destructive"
                          >
                            <Trash2 className="size-4" strokeWidth={1.5} />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ترويسة + زر إنشاء */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EventsFilters
          filters={filters}
          onFilterChange={updateFilters}
          resultCount={sorted.length}
          onExport={exportCSV}
          onClear={() =>
            setFilters({ search: "", type: "ALL", from: "", to: "" })
          }
        />
        {canCreate && (
          <Button
            className="h-10 gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" strokeWidth={1.5} />
            <span>فعالية جديدة</span>
          </Button>
        )}
      </div>

      {/* التبويبات */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as EventTab)}
        className="w-full"
      >
        <TabsList className="flex w-fit">
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarDays className="size-3.5" strokeWidth={1.5} />
            <span>القادمة ({upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CalendarDays className="size-3.5" strokeWidth={1.5} />
            <span>المنتهية ({completed.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-1.5">
            <CalendarDays className="size-3.5" strokeWidth={1.5} />
            <span>الملغاة ({cancelled.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <CalendarDays className="size-3.5" strokeWidth={1.5} />
            <span>الكل ({baseFiltered.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(sorted)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(sorted)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cancelled">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(sorted)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(sorted)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة الإنشاء */}
      {canCreate && (
        <EventFormDialog
          mode="create"
          initial={null}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      )}

      {/* نافذة التعديل */}
      {canEdit && (
        <EventFormDialog
          mode="edit"
          initial={editEvent}
          open={!!editEvent}
          onOpenChange={(v) => !v && setEditEvent(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}

      {/* تأكيد الحذف */}
      <AlertDialog
        open={!!deleteEvent}
        onOpenChange={(v) => !v && setDeleteEvent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الفعالية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleteEvent?.title}»؟ سيتم وضع علامة
              «محذوفة» على الفعالية ولا يمكن للجمهور رؤيتها. التسجيلات المرتبطة
              بها ستبقى في السجل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// إعادة تصدير motion لتسهيل الاستعمال عند الحاجة
export { motion };
