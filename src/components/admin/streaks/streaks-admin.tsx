"use client";

// ===================================================================
//  StreaksAdmin — لوحة إدارة السلاسل
//  - بطاقات (متوسط، أطول، إجمالي) + مخطّط أعمدة توزيع
//  - جدول المستخدمين مع إجراءات: تصفير/منح تجميد/تصفير جماعي
//  - إعدادات النظام (تشغيل/إيقاف، سعر التجميد، حدّ التجميدات الشهرية)
// ===================================================================

import * as React from "react";
import { Flame, Snowflake, RotateCcw, Settings2, Download } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { exportSheet, shortDate } from "@/lib/admin-export";
import { formatNumber, formatDateArabic, ROLE_LABELS } from "@/lib/constants";
import type { StreakRow } from "@/app/admin/streaks/page";
import type { Role } from "@prisma/client";

const COLORS = ["#B8492B", "#2D5A3D", "#C8842A", "#1F1A17", "#D4623E", "#7E6C5D"];

interface Bucket {
  range: string;
  count: number;
}

interface Props {
  rows: StreakRow[];
  avgStreak: number;
  longestStreak: number;
  buckets: Bucket[];
}

const DEFAULT_SETTINGS = {
  enabled: true,
  freezeCost: 50,
  maxFreezesPerMonth: 2,
};

export function StreaksAdmin({ rows, avgStreak, longestStreak, buckets }: Props) {
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mar-streak-settings");
      if (stored) setSettings(JSON.parse(stored));
    } catch {
      // تجاهل
    }
  }, []);

  function persist(next: typeof DEFAULT_SETTINGS) {
    setSettings(next);
    try {
      localStorage.setItem("mar-streak-settings", JSON.stringify(next));
      toast.success("تم حفظ الإعدادات");
    } catch {
      // تجاهل
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function resetStreak(row: StreakRow) {
    if (!confirm(`تصفير سلسلة ${row.fullName}؟`)) return;
    // ملاحظة: نستخدم PUT على نفس مسار update من خلال PATCH مخصّص — لكن
    // لتجنب إنشاء مسار إضافي، نستعمل نقطة نهائية مباشرة على user.
    try {
      const res = await fetch("/api/admin/streaks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: row.userId,
          action: "reset",
          reason: "تصفير يدوي",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم تصفير السلسلة");
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function grantFreeze(row: StreakRow) {
    try {
      const res = await fetch("/api/admin/streaks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId, action: "grant_freeze" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم منح تجميد إضافي");
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function bulkReset() {
    if (selected.length === 0) {
      toast.error("اختر مستخدماً واحداً على الأقل");
      return;
    }
    if (!confirm(`تصفير سلاسل ${selected.length} مستخدم؟`)) return;
    try {
      const res = await fetch("/api/admin/streaks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected, action: "bulk_reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم التصفير الجماعي");
      setSelected([]);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  function handleExport() {
    const exportRows = rows.map((r) => ({
      المستخدم: r.fullName,
      الدور: ROLE_LABELS[r.role as Role]?.label ?? r.role,
      السلسلة_الحالية: r.currentStreak,
      أطول_سلسلة: r.longestStreak,
      التجميدات: r.freezes,
      آخر_تحقق: r.lastCheckIn ? shortDate(r.lastCheckIn) : "—",
      إجمالي_التحقق: r.totalCheckIns,
    }));
    exportSheet(exportRows, "streaks-report", "السلاسل");
    toast.success("تم التصدير");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit border-accent/30 bg-accent/10 text-accent">
          <Flame className="size-3" strokeWidth={1.5} />
          السلاسل v5.0
        </Badge>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            إدارة السلاسل اليومية
          </h1>
          <p className="text-sm text-muted-foreground">
            متابعة السلاسل النشطة · التجميدات · التصفير · الإعدادات العامة.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="متوسط السلاسل" value={avgStreak.toFixed(1)} icon={<Flame className="size-4" strokeWidth={1.5} />} color="text-accent" bg="bg-accent/10" />
        <Kpi label="أطول سلسلة" value={`${longestStreak} يوم`} icon={<Flame className="size-4" strokeWidth={1.5} />} color="text-rose-600" bg="bg-rose-50" />
        <Kpi label="إجمالي السلاسل" value={formatNumber(rows.length)} icon={<Flame className="size-4" strokeWidth={1.5} />} color="text-emerald-600" bg="bg-emerald-50" />
        <Kpi label="المحددون" value={formatNumber(rows.filter((r) => r.currentStreak === 0).length)} icon={<Flame className="size-4" strokeWidth={1.5} />} color="text-foreground" bg="bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* مخطّط التوزيع */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">توزيع السلاسل حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Bar dataKey="count" name="عدد المستخدمين" radius={[6, 6, 0, 0]}>
                    {buckets.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* الإعدادات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-accent" strokeWidth={1.5} />
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="enable-streaks" className="text-sm">تفعيل نظام السلاسل</Label>
              <Switch
                id="enable-streaks"
                checked={settings.enabled}
                onCheckedChange={(v) => persist({ ...settings, enabled: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freeze-cost" className="text-sm">سعر التجميد (نقاط)</Label>
              <Input
                id="freeze-cost"
                type="number"
                value={settings.freezeCost}
                onChange={(e) => persist({ ...settings, freezeCost: Number(e.target.value) })}
                className="h-11"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-freezes" className="text-sm">حدّ التجميدات الشهرية</Label>
              <Input
                id="max-freezes"
                type="number"
                value={settings.maxFreezesPerMonth}
                onChange={(e) => persist({ ...settings, maxFreezesPerMonth: Number(e.target.value) })}
                className="h-11"
                dir="ltr"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              ⚙️ هذه الإعدادات تُخزَّن محلياً للعرض. الإصدار القادم سيربطها بقاعدة بيانات Setting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الجدول */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">قائمة المستخدمين ({rows.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="min-h-9" onClick={handleExport}>
                <Download className="size-4" strokeWidth={1.5} />
                تصدير
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-9"
                onClick={bulkReset}
                disabled={selected.length === 0}
              >
                <RotateCcw className="size-4" strokeWidth={1.5} />
                تصفير المحدد ({selected.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[28rem] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 text-start text-xs text-muted-foreground"></TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">المستخدم</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الدور</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">الحالية</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">الأطول</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">التجميدات</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">آخر تحقق</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const checked = selected.includes(r.userId);
                    return (
                      <TableRow key={r.id} className="text-sm">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(r.userId)}
                            className="size-4 accent-accent"
                            aria-label="تحديد"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{r.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {ROLE_LABELS[r.role as Role]?.label ?? r.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-mono font-semibold text-accent">
                          🔥 {r.currentStreak}
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs text-muted-foreground">
                          {r.longestStreak}
                        </TableCell>
                        <TableCell className="text-end">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Snowflake className="size-3" strokeWidth={1.5} />
                            {r.freezes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.lastCheckIn ? formatDateArabic(r.lastCheckIn) : "—"}
                        </TableCell>
                        <TableCell className="text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="إجراءات">
                                <span className="text-xs">⋯</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>إجراءات السلسلة</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => grantFreeze(r)}>
                                <Snowflake className="size-4" strokeWidth={1.5} />
                                <span>منح تجميد إضافي</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => resetStreak(r)}>
                                <RotateCcw className="size-4" strokeWidth={1.5} />
                                <span>تصفير السلسلة</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}

function Kpi({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string; }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
          <div className={`flex size-8 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
        </div>
        <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
