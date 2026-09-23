"use client";

// ===================================================================
//  RewardsAdmin — إدارة المكافآت المتغيرة
//  3 أقسام: Mystery Box / Spin Wheel / Lucky Draw
//  جميعها قابلة للتعديل (محلياً عبر localStorage) لتفادي migration
// ===================================================================

import * as React from "react";
import {
  Gift,
  Boxes,
  Disc,
  Trophy,
  Plus,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
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
import { formatNumber } from "@/lib/constants";

// ------------------------- الأنواع -------------------------

interface MysteryTier {
  probability: number; // %
  rewardType: "POINTS" | "FREEZE" | "BADGE";
  minPoints: number;
  maxPoints: number;
}

interface SpinSegment {
  label: string;
  weight: number;
  rewardType: "POINTS" | "FREEZE" | "BADGE" | "NOTHING";
  value: number;
  color: string;
}

interface LuckyConfig {
  prizePool: string;
  drawSchedule: string;
}

interface LuckyWinner {
  id: string;
  fullName: string;
  reward: string;
  value: number;
  drawnAt: string;
}

interface Props {
  stats: { mystery: number; spin: number; lucky: number };
  luckyWinners: LuckyWinner[];
}

// قيم افتراضية
const DEFAULT_MYSTERY: MysteryTier[] = [
  { probability: 50, rewardType: "POINTS", minPoints: 10, maxPoints: 50 },
  { probability: 30, rewardType: "POINTS", minPoints: 100, maxPoints: 100 },
  { probability: 15, rewardType: "FREEZE", minPoints: 0, maxPoints: 0 },
  { probability: 5, rewardType: "BADGE", minPoints: 0, maxPoints: 0 },
];

const DEFAULT_SPIN: SpinSegment[] = [
  { label: "10 ن", weight: 20, rewardType: "POINTS", value: 10, color: "#B8492B" },
  { label: "20 ن", weight: 15, rewardType: "POINTS", value: 20, color: "#2D5A3D" },
  { label: "50 ن", weight: 10, rewardType: "POINTS", value: 50, color: "#C8842A" },
  { label: "تجميد", weight: 8, rewardType: "FREEZE", value: 1, color: "#7E6C5D" },
  { label: "شارة", weight: 5, rewardType: "BADGE", value: 0, color: "#1F1A17" },
  { label: "100 ن", weight: 5, rewardType: "POINTS", value: 100, color: "#D4623E" },
  { label: "لا شيء", weight: 30, rewardType: "NOTHING", value: 0, color: "#9CA3AF" },
  { label: "200 ن", weight: 7, rewardType: "POINTS", value: 200, color: "#7c3aed" },
];

const DEFAULT_LUCKY: LuckyConfig = {
  prizePool: "500 نقطة + شارة الفائز",
  drawSchedule: "آخر يوم خميس من كل شهر",
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  POINTS: "نقاط",
  FREEZE: "تجميد",
  BADGE: "شارة",
  NOTHING: "لا شيء",
};

const REWARD_TYPE_COLORS: Record<string, string> = {
  POINTS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FREEZE: "border-blue-200 bg-blue-50 text-blue-700",
  BADGE: "border-accent/30 bg-accent/10 text-accent",
  NOTHING: "border-slate-200 bg-slate-50 text-slate-600",
};

const BAR_COLORS = ["#B8492B", "#2D5A3D", "#C8842A"];

export function RewardsAdmin({ stats, luckyWinners }: Props) {
  const [mystery, setMystery] = React.useState<MysteryTier[]>(DEFAULT_MYSTERY);
  const [spin, setSpin] = React.useState<SpinSegment[]>(DEFAULT_SPIN);
  const [lucky, setLucky] = React.useState<LuckyConfig>(DEFAULT_LUCKY);

  React.useEffect(() => {
    try {
      const m = localStorage.getItem("mar-mystery-config");
      if (m) setMystery(JSON.parse(m));
      const s = localStorage.getItem("mar-spin-config");
      if (s) setSpin(JSON.parse(s));
      const l = localStorage.getItem("mar-lucky-config");
      if (l) setLucky(JSON.parse(l));
    } catch {
      // تجاهل
    }
  }, []);

  function saveMystery(updated: MysteryTier[]) {
    setMystery(updated);
    localStorage.setItem("mar-mystery-config", JSON.stringify(updated));
    toast.success("تم حفظ إعدادات الصندوق الغامض");
  }

  function saveSpin(updated: SpinSegment[]) {
    setSpin(updated);
    localStorage.setItem("mar-spin-config", JSON.stringify(updated));
    toast.success("تم حفظ إعدادات عجلة الدوران");
  }

  function saveLucky(updated: LuckyConfig) {
    setLucky(updated);
    localStorage.setItem("mar-lucky-config", JSON.stringify(updated));
    toast.success("تم حفظ إعدادات القرعة");
  }

  // إحصاءات للرسم
  const usageData = [
    { name: "صناديق غامضة", value: stats.mystery },
    { name: "عجلات دوّارة", value: stats.spin },
    { name: "قرعات", value: stats.lucky },
  ];

  const totalSpinWeight = spin.reduce((s, x) => s + x.weight, 0);
  const totalMysteryProb = mystery.reduce((s, x) => s + x.probability, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit border-accent/30 bg-accent/10 text-accent">
          <Gift className="size-3" strokeWidth={1.5} />
          المكافآت v5.0
        </Badge>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            إدارة المكافآت المتغيرة
          </h1>
          <p className="text-sm text-muted-foreground">
            ضبط احتمالات الصندوق الغامض · عجلة الدوران · القرعة الدورية.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">استخدام الميزات (إجمالي)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => formatNumber(v)} />
                <Bar dataKey="value" name="العدد" radius={[6, 6, 0, 0]}>
                  {usageData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mystery Box */}
        <MysteryBoxConfig
          tiers={mystery}
          totalProb={totalMysteryProb}
          onSave={saveMystery}
        />
        {/* Spin Wheel */}
        <SpinWheelConfig
          segments={spin}
          totalWeight={totalSpinWeight}
          onSave={saveSpin}
        />
      </div>

      {/* Lucky Draw */}
      <LuckyDrawConfig
        config={lucky}
        onSave={saveLucky}
        winners={luckyWinners}
      />
    </div>
  );
}

// ===================================================================
//  MysteryBoxConfig
// ===================================================================

function MysteryBoxConfig({
  tiers,
  totalProb,
  onSave,
}: {
  tiers: MysteryTier[];
  totalProb: number;
  onSave: (t: MysteryTier[]) => void;
}) {
  function update(i: number, patch: Partial<MysteryTier>) {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onSave(next);
  }
  function add() {
    onSave([...tiers, { probability: 5, rewardType: "POINTS", minPoints: 5, maxPoints: 15 }]);
  }
  function remove(i: number) {
    if (tiers.length <= 1) return;
    onSave(tiers.filter((_, idx) => idx !== i));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Boxes className="size-4 text-accent" strokeWidth={1.5} />
          الصندوق الغامض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-start text-xs text-muted-foreground">الاحتمال (%)</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">المكافأة</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">نقاط (من-إلى)</TableHead>
                <TableHead className="text-end text-xs text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t, i) => (
                <TableRow key={i} className="text-sm">
                  <TableCell>
                    <Input
                      type="number"
                      value={t.probability}
                      onChange={(e) => update(i, { probability: Number(e.target.value) })}
                      className="h-9 w-16"
                      dir="ltr"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={t.rewardType} onValueChange={(v) => update(i, { rewardType: v as MysteryTier["rewardType"] })}>
                      <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(REWARD_TYPE_LABELS).filter(([k]) => k !== "NOTHING").map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={t.minPoints}
                      onChange={(e) => update(i, { minPoints: Number(e.target.value) })}
                      className="h-9 w-16"
                      dir="ltr"
                      disabled={t.rewardType !== "POINTS"}
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <Input
                      type="number"
                      value={t.maxPoints}
                      onChange={(e) => update(i, { maxPoints: Number(e.target.value) })}
                      className="h-9 w-16"
                      dir="ltr"
                      disabled={t.rewardType !== "POINTS"}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => remove(i)} aria-label="حذف">
                      <Trash2 className="size-3.5 text-rose-600" strokeWidth={1.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-xs ${totalProb === 100 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            المجموع: {totalProb}% {totalProb === 100 ? "✓" : "(يجب أن يكون 100)"}
          </Badge>
          <Button variant="outline" size="sm" className="min-h-9" onClick={add}>
            <Plus className="size-4" strokeWidth={1.5} />
            إضافة مستوى
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  SpinWheelConfig
// ===================================================================

function SpinWheelConfig({
  segments,
  totalWeight,
  onSave,
}: {
  segments: SpinSegment[];
  totalWeight: number;
  onSave: (s: SpinSegment[]) => void;
}) {
  function update(i: number, patch: Partial<SpinSegment>) {
    const next = segments.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onSave(next);
  }
  function add() {
    const colors = ["#B8492B", "#2D5A3D", "#C8842A", "#7E6C5D"];
    onSave([
      ...segments,
      { label: `مقطع ${segments.length + 1}`, weight: 5, rewardType: "POINTS", value: 10, color: colors[segments.length % colors.length] },
    ]);
  }
  function remove(i: number) {
    if (segments.length <= 1) return;
    onSave(segments.filter((_, idx) => idx !== i));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Disc className="size-4 text-accent" strokeWidth={1.5} />
          عجلة الدوران
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-start text-xs text-muted-foreground">المقطع</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">الوزن</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">المكافأة</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">القيمة</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">اللون</TableHead>
                <TableHead className="text-end text-xs text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((s, i) => (
                <TableRow key={i} className="text-sm">
                  <TableCell>
                    <Input value={s.label} onChange={(e) => update(i, { label: e.target.value })} className="h-9 w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={s.weight} onChange={(e) => update(i, { weight: Number(e.target.value) })} className="h-9 w-16" dir="ltr" />
                  </TableCell>
                  <TableCell>
                    <Select value={s.rewardType} onValueChange={(v) => update(i, { rewardType: v as SpinSegment["rewardType"] })}>
                      <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(REWARD_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={s.value} onChange={(e) => update(i, { value: Number(e.target.value) })} className="h-9 w-16" dir="ltr" disabled={s.rewardType === "NOTHING" || s.rewardType === "BADGE"} />
                  </TableCell>
                  <TableCell>
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => update(i, { color: e.target.value })}
                      className="size-8 cursor-pointer rounded border border-border bg-transparent p-0"
                      aria-label="اللون"
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => remove(i)} aria-label="حذف">
                      <Trash2 className="size-3.5 text-rose-600" strokeWidth={1.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            مجموع الأوزان: {totalWeight}
          </Badge>
          <Button variant="outline" size="sm" className="min-h-9" onClick={add}>
            <Plus className="size-4" strokeWidth={1.5} />
            إضافة مقطع
          </Button>
        </div>
        {/* معاينة الألوان */}
        <div className="flex flex-wrap gap-1">
          {segments.map((s, i) => (
            <span
              key={i}
              className="rounded-md px-2 py-0.5 text-[10px] text-white"
              style={{ backgroundColor: s.color }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  LuckyDrawConfig
// ===================================================================

function LuckyDrawConfig({
  config,
  onSave,
  winners,
}: {
  config: LuckyConfig;
  onSave: (c: LuckyConfig) => void;
  winners: LuckyWinner[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4 text-accent" strokeWidth={1.5} />
          القرعة الدورية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lucky-pool">مجموعة الجوائز</Label>
            <Input
              id="lucky-pool"
              value={config.prizePool}
              onChange={(e) => onSave({ ...config, prizePool: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lucky-schedule">مواعيد القرعة</Label>
            <Input
              id="lucky-schedule"
              value={config.drawSchedule}
              onChange={(e) => onSave({ ...config, drawSchedule: e.target.value })}
              className="h-10"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">آخر الفائزين ({winners.length})</Label>
          <div className="mt-2 max-h-64 overflow-y-auto custom-scrollbar rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">المستخدم</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">المكافأة</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">القيمة</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      لا يوجد فائزون بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  winners.map((w) => (
                    <TableRow key={w.id} className="text-sm">
                      <TableCell className="font-medium text-foreground">{w.fullName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${REWARD_TYPE_COLORS[w.reward] ?? ""}`}>
                          {REWARD_TYPE_LABELS[w.reward] ?? w.reward}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end font-mono text-xs text-accent">{w.value}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(w.drawnAt).toLocaleDateString("ar-MA")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
