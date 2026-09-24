"use client";

// ===================================================================
//  EconomyAdmin — لوحة إدارة النقاط والاقتصاد
// ===================================================================

import * as React from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Gauge,
  Trophy,
  Plus,
  Minus,
  Download,
  Filter,
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
import { Switch } from "@/components/ui/switch";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { exportSheet } from "@/lib/admin-export";
import { formatNumber } from "@/lib/constants";

// ------------------- الأنواع -------------------

interface TopHolder {
  id: string;
  fullName: string;
  points: number;
  level: number;
  roleLabel: string;
  district: string;
}

interface MonthlyPoint {
  month: string;
  issued: number;
  spent: number;
  net: number;
}

interface EconomyStats {
  totalIssued: number;
  totalSpent: number;
  totalTransactions: number;
  pendingOrders: number;
  inflationRate: number;
  topHolders: TopHolder[];
  monthly: MonthlyPoint[];
}

interface UserOption {
  id: string;
  fullName: string;
  email: string;
}

interface LedgerRow {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userRole: string;
  amount: number;
  type: string;
  reason: string;
  balanceAfter: number;
  adminId: string | null;
  metadata: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  EARN: "كسب",
  SPEND: "صرف",
  ADJUST: "تعديل",
  PURCHASE: "شراء",
  TRANSFER: "تحويل",
};

const TYPE_COLORS: Record<string, string> = {
  EARN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  SPEND: "border-rose-200 bg-rose-50 text-rose-700",
  ADJUST: "border-accent/30 bg-accent/10 text-accent",
  PURCHASE: "border-blue-200 bg-blue-50 text-blue-700",
  TRANSFER: "border-slate-200 bg-slate-50 text-slate-700",
};

const DEFAULT_RULES = [
  { id: "login", title: "تسجيل الدخول اليومي", formula: "10 نقاط / يوم", enabled: true },
  { id: "contribution", title: "مساهمة في صندوق المعروف", formula: "نقاط × 0.1 (لكل درهم)", enabled: true },
  { id: "event", title: "حضور فعالية", formula: "20 نقطة / فعالية", enabled: true },
  { id: "streak", title: "بقاء السلسلة يومياً", formula: "5 نقاط / يوم في السلسلة", enabled: true },
];

interface Props {
  stats: EconomyStats;
  users: UserOption[];
  recentLedger: LedgerRow[];
}

export function EconomyAdmin({ stats, users, recentLedger }: Props) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
            <Coins className="size-3" strokeWidth={1.5} />
            الاقتصاد v5.0
          </Badge>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            إدارة النقاط والاقتصاد
          </h1>
          <p className="text-sm text-muted-foreground">
            مجموع النقاط المُصدَرة والمصروفة · تضخّم الاقتصاد · أعلى 10 حَمَلة · سجلّ المعاملات.
          </p>
        </div>
      </header>

      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="نقاط مُصدَرة" value={formatNumber(stats.totalIssued)} icon={<TrendingUp className="size-4" strokeWidth={1.5} />} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard label="نقاط مصروفة" value={formatNumber(stats.totalSpent)} icon={<TrendingDown className="size-4" strokeWidth={1.5} />} color="text-rose-600" bg="bg-rose-50" />
        <KpiCard label="طلبات معلّقة" value={formatNumber(stats.pendingOrders)} icon={<Clock className="size-4" strokeWidth={1.5} />} color="text-amber-600" bg="bg-amber-50" />
        <KpiCard label="معدّل التضخّم" value={`${stats.inflationRate}%`} icon={<Gauge className="size-4" strokeWidth={1.5} />} color="text-accent" bg="bg-accent/10" />
        <KpiCard label="إجمالي المعاملات" value={formatNumber(stats.totalTransactions)} icon={<Coins className="size-4" strokeWidth={1.5} />} color="text-foreground" bg="bg-muted" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">حركة النقاط خلال آخر 12 شهراً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatNumber(v)} contentStyle={{ fontSize: 12 }} />
                <Legend />
                <ReferenceLine y={0} stroke="transparent" />
                <Line type="monotone" dataKey="issued" name="مُصدَرة" stroke="#2D5A3D" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="spent" name="مصروفة" stroke="#B8492B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" name="الصافي" stroke="#C8842A" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-accent" strokeWidth={1.5} />
              أعلى 10 حَمَلة للنقاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-start text-xs text-muted-foreground">#</TableHead>
                    <TableHead className="text-start text-xs text-muted-foreground">الاسم</TableHead>
                    <TableHead className="text-start text-xs text-muted-foreground">الحي</TableHead>
                    <TableHead className="text-start text-xs text-muted-foreground">المستوى</TableHead>
                    <TableHead className="text-end text-xs text-muted-foreground">النقاط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topHolders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        لا توجد بيانات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.topHolders.map((h, i) => (
                      <TableRow key={h.id} className="text-sm">
                        <TableCell className="font-mono text-xs">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{h.fullName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.district}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">مستوى {h.level}</Badge>
                        </TableCell>
                        <TableCell className="text-end font-mono font-semibold text-accent">
                          {formatNumber(h.points)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <PointsRulesCard />
      </div>

      <AdjustPointsForm users={users} />
      <LedgerTable users={users} initialRows={recentLedger} />
    </div>
  );
}

function KpiCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string; }) {
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

function PointsRulesCard() {
  const [rules, setRules] = React.useState(DEFAULT_RULES);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mar-economy-rules");
      if (stored) {
        const parsed = JSON.parse(stored) as typeof DEFAULT_RULES;
        if (Array.isArray(parsed) && parsed.length === DEFAULT_RULES.length) {
          setRules(parsed);
        }
      }
    } catch {
      // تجاهل
    }
  }, []);

  function toggle(id: string, enabled: boolean) {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
    setRules(updated);
    try {
      localStorage.setItem("mar-economy-rules", JSON.stringify(updated));
      toast.success(enabled ? "تم تفعيل القاعدة" : "تم تعطيل القاعدة");
    } catch {
      // تجاهل
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">قواعد كسب النقاط</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start text-xs text-muted-foreground">القاعدة</TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">المعادلة</TableHead>
              <TableHead className="text-end text-xs text-muted-foreground">مُفعّلة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id} className="text-sm">
                <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground" dir="ltr">{r.formula}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end">
                    <Switch checked={r.enabled} onCheckedChange={(v) => toggle(r.id, v)} aria-label={`تفعيل ${r.title}`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdjustPointsForm({ users }: { users: UserOption[] }) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [amount, setAmount] = React.useState<number>(0);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("اختر مستخدماً واحداً على الأقل");
      return;
    }
    if (!Number.isInteger(amount) || amount === 0) {
      toast.error("أدخِل مبلغاً صحيحاً غير صفر");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("السبب مطلوب (3 أحرف على الأقل)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/economy/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds, amount, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل الطلب");
      }
      toast.success(data.message ?? "تم التعديل بنجاح");
      setSelectedIds([]);
      setAmount(0);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleUser(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {amount >= 0 ? <Plus className="size-4 text-emerald-600" strokeWidth={1.5} /> : <Minus className="size-4 text-rose-600" strokeWidth={1.5} />}
          تعديل نقاط يدوياً
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>اختر المستخدمين ({selectedIds.length})</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 custom-scrollbar">
              {users.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">لا يوجد مستخدمون</p>
              ) : (
                <ul className="space-y-1">
                  {users.map((u) => {
                    const checked = selectedIds.includes(u.id);
                    return (
                      <li key={u.id}>
                        <label className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${checked ? "bg-accent/10 text-accent" : "hover:bg-muted"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleUser(u.id)} className="size-4 accent-accent" />
                          <span className="flex-1 text-foreground">{u.fullName}</span>
                          <span className="text-xs text-muted-foreground" dir="ltr">{u.email}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">المبلغ (موجب = إضافة، سالب = خصم)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-11" placeholder="مثال: 100 أو -50" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">السبب (مطلوب)</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-11" placeholder="مكافأة استثنائية / تصحيح خطأ" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting} className="min-h-11">
              {submitting ? "جارٍ التنفيذ..." : "تنفيذ التعديل"}
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => { setSelectedIds([]); setAmount(0); setReason(""); }}>
              مسح
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LedgerTable({ users, initialRows }: { users: UserOption[]; initialRows: LedgerRow[] }) {
  const [rows, setRows] = React.useState<LedgerRow[]>(initialRows);
  const [loading, setLoading] = React.useState(false);
  const [type, setType] = React.useState<string>("ALL");
  const [userId, setUserId] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  async function fetchLedger() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== "ALL") params.set("type", type);
      if (userId !== "ALL") params.set("userId", userId);
      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/economy/ledger?${params.toString()}`);
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch {
      toast.error("فشل تحميل السجلّ");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchLedger();
  }, []);

  function handleExport() {
    const exportRows = rows.map((r) => ({
      التاريخ: r.createdAt.slice(0, 19).replace("T", " "),
      المستخدم: r.userFullName,
      البريد: r.userEmail,
      النوع: TYPE_LABELS[r.type] ?? r.type,
      المبلغ: r.amount,
      الرصيد_بعدها: r.balanceAfter,
      السبب: r.reason,
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    exportSheet(exportRows, `points-ledger-${stamp}`, "سجلّ النقاط", "csv");
    toast.success("تم تصدير السجلّ بصيغة CSV");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">سجلّ المعاملات</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="min-h-9" disabled={rows.length === 0}>
            <Download className="size-4" strokeWidth={1.5} />
            تصدير CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">النوع</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">المستخدم</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل المستخدمين</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">بحث</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" placeholder="سبب أو اسم" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">من تاريخ</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchLedger} disabled={loading} size="sm" className="min-h-9">
            <Filter className="size-4" strokeWidth={1.5} />
            {loading ? "جارٍ التحميل..." : "تطبيق الفلاتر"}
          </Button>
        </div>

        <div className="max-h-96 overflow-auto custom-scrollbar rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-start text-xs text-muted-foreground">التاريخ</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">المستخدم</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">النوع</TableHead>
                <TableHead className="text-end text-xs text-muted-foreground">المبلغ</TableHead>
                <TableHead className="text-end text-xs text-muted-foreground">الرصيد</TableHead>
                <TableHead className="text-start text-xs text-muted-foreground">السبب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">لا توجد معاملات مطابقة</TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} className="text-sm">
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {r.createdAt.slice(0, 16).replace("T", " ")}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.userFullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[r.type] ?? ""}`}>
                        {TYPE_LABELS[r.type] ?? r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-end font-mono font-semibold ${r.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {r.amount > 0 ? "+" : ""}{formatNumber(r.amount)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs text-muted-foreground">{formatNumber(r.balanceAfter)}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-foreground" title={r.reason}>{r.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
