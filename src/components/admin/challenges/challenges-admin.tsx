"use client";

// ===================================================================
//  ChallengesAdmin — إدارة التحديات
// ===================================================================

import * as React from "react";
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  Copy,
  CalendarClock,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { exportSheet } from "@/lib/admin-export";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import type { ChallengeRow } from "@/app/admin/challenges/page";

const TYPE_LABELS: Record<string, string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  SEASONAL: "موسمي",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهٍ",
  completed: "مكتمل",
};

const STATUS_COLORS: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expired: "border-slate-200 bg-slate-50 text-slate-600",
  completed: "border-accent/30 bg-accent/10 text-accent",
};

interface Props {
  rows: ChallengeRow[];
}

export function ChallengesAdmin({ rows }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);

  const stats = React.useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const participants = rows.reduce((s, r) => s + r.participants, 0);
    const completedTasks = rows.reduce((s, r) => s + r.completed, 0);
    const rate = participants > 0 ? Math.round((completedTasks / participants) * 1000) / 10 : 0;
    return { total: rows.length, active, completed, rate };
  }, [rows]);

  function handleExport() {
    const exportRows = rows.map((r) => ({
      العنوان: r.title,
      النوع: TYPE_LABELS[r.type] ?? r.type,
      الحالة: STATUS_LABELS[r.status] ?? r.status,
      المشاركون: r.participants,
      المكتمل: r.completed,
      نسبة_الإكمال: r.participants > 0 ? Math.round((r.completed / r.participants) * 100) : 0,
      المكافأة: r.pointsReward,
      تاريخ_النهاية: formatDateArabic(r.endDate),
    }));
    exportSheet(exportRows, "challenges-list", "التحديات");
    toast.success("تم التصدير");
  }

  async function handleDelete(c: ChallengeRow) {
    if (!confirm(`حذف التحدي "${c.title}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/challenges/delete?id=${c.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم الحذف");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function handleEndEarly(c: ChallengeRow) {
    if (!confirm(`إنهاء التحدي "${c.title}" قبل موعده؟`)) return;
    try {
      const res = await fetch("/api/admin/challenges/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, status: "expired" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم إنهاء التحدي");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function handleDuplicate(c: ChallengeRow) {
    try {
      const res = await fetch("/api/admin/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${c.title} (نسخة)`,
          description: c.description,
          type: c.type,
          pointsReward: c.pointsReward,
          requiredCount: c.requiredCount,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم تكرار التحدي");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit border-accent/30 bg-accent/10 text-accent">
            <Target className="size-3" strokeWidth={1.5} />
            التحديات v5.0
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              إدارة التحديات
            </h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} تحدٍّ · {stats.active} نشط · {stats.completed} مكتمل
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="min-h-9" onClick={handleExport}>
            <Download className="size-4" strokeWidth={1.5} />
            تصدير
          </Button>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="min-h-9">
            <Plus className="size-4" strokeWidth={1.5} />
            تحدٍّ جديد
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="إجمالي التحديات" value={formatNumber(stats.total)} color="text-foreground" bg="bg-muted" />
        <Kpi label="نشطة" value={formatNumber(stats.active)} color="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label="مكتملة" value={formatNumber(stats.completed)} color="text-accent" bg="bg-accent/10" />
        <Kpi label="معدّل الإكمال" value={`${stats.rate}%`} color="text-rose-600" bg="bg-rose-50" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة التحديات ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[32rem] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">العنوان</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">النوع</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الحالة</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">مشاركون</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">مكتمل</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الإكمال</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">المكافأة</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">ينتهي</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      لا توجد تحديات بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => {
                    const rate = c.participants > 0 ? Math.round((c.completed / c.participants) * 100) : 0;
                    return (
                      <TableRow key={c.id} className="text-sm">
                        <TableCell className="font-medium text-foreground">{c.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[c.type] ?? c.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[c.status] ?? ""}`}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs">{c.participants}</TableCell>
                        <TableCell className="text-end font-mono text-xs text-emerald-600">{c.completed}</TableCell>
                        <TableCell className="min-w-[100px]">
                          <Progress value={rate} className="h-2" />
                          <span className="text-[10px] text-muted-foreground">{rate}%</span>
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs text-accent">{c.pointsReward}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateArabic(c.endDate)}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleDuplicate(c)}
                              aria-label="تكرار"
                              title="تكرار"
                            >
                              <Copy className="size-3.5" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEndEarly(c)}
                              disabled={c.status !== "active"}
                              aria-label="إنهاء مبكر"
                              title="إنهاء مبكر"
                            >
                              <CalendarClock className="size-3.5 text-amber-600" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleDelete(c)}
                              aria-label="حذف"
                              title="حذف"
                            >
                              <Trash2 className="size-3.5 text-rose-600" strokeWidth={1.5} />
                            </Button>
                          </div>
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

      <CreateChallengeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function Kpi({ label, value, color, bg }: { label: string; value: string; color: string; bg: string; }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
          <CheckCircle2 className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function CreateChallengeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState("DAILY");
  const [pointsReward, setPointsReward] = React.useState<number>(20);
  const [requiredCount, setRequiredCount] = React.useState<number>(1);
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTitle(""); setDescription(""); setType("DAILY");
      setPointsReward(20); setRequiredCount(1);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    }
  }, [open]);

  async function handleCreate() {
    if (title.trim().length < 3) {
      toast.error("العنوان مطلوب");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("الوصف مطلوب");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("التواريخ مطلوبة");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          pointsReward,
          requiredCount,
          startDate,
          endDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم إنشاء التحدي");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4" strokeWidth={1.5} />
            تحدٍّ جديد
          </DialogTitle>
          <DialogDescription>أنشئ تحدّياً للمستخدمين بمكافأة بالنقاط</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="c-title">العنوان</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" placeholder="حضور 5 فعاليات" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="c-desc">الوصف</Label>
            <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20" placeholder="صف التحدّي وأهدافه" />
          </div>
          <div className="space-y-1.5">
            <Label>النوع</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-reward">المكافأة (نقاط)</Label>
            <Input id="c-reward" type="number" value={pointsReward} onChange={(e) => setPointsReward(Number(e.target.value))} className="h-10" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-count">عدد المهام المطلوبة</Label>
            <Input id="c-count" type="number" value={requiredCount} onChange={(e) => setRequiredCount(Number(e.target.value))} className="h-10" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-start">تاريخ البدء</Label>
            <Input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-end">تاريخ الانتهاء</Label>
            <Input id="c-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10" dir="ltr" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? "جارٍ..." : "إنشاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
