"use client";

// ===================================================================
//  BadgesAdmin — إدارة الشارات
//  - شارات في شبكة بطاقات (أيقون + ندرة + عدّ المستلمين + العد التنازلي)
//  - إنشاء شارة جديدة (نموذج)
//  - إجراءات: منح/سحب/تعديل/حذف
//  - مخطّط دائري توزيع الندرة
// ===================================================================

import * as React from "react";
import {
  Award,
  Plus,
  Trash2,
  Gift,
  Ban,
  Pencil,
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
import { Switch } from "@/components/ui/switch";
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { exportSheet } from "@/lib/admin-export";
import { formatNumber } from "@/lib/constants";
import type { BadgeRow, UserOption } from "@/app/admin/badges/page";

const RARITY_LABELS: Record<string, string> = {
  common: "عادية",
  rare: "نادرة",
  epic: "ملحمية",
  legendary: "أسطورية",
};

const RARITY_COLORS: Record<string, string> = {
  common: "border-slate-200 bg-slate-50 text-slate-700",
  rare: "border-blue-200 bg-blue-50 text-blue-700",
  epic: "border-purple-200 bg-purple-50 text-purple-700",
  legendary: "border-accent/40 bg-accent/15 text-accent",
};

const PIE_COLORS = ["#7E6C5D", "#2563eb", "#7c3aed", "#C8842A"];

const EMOJI_CHOICES = [
  "🏆", "🥇", "🎖️", "👑", "💎", "⭐", "🌟", "🔥",
  "💯", "🎯", "📌", "🎉", "✨", "💎", "🚀", "🎈",
];

interface Props {
  badges: BadgeRow[];
  users: UserOption[];
}

export function BadgesAdmin({ badges, users }: Props) {
  const [grantOpen, setGrantOpen] = React.useState(false);
  const [revokeOpen, setRevokeOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [targetBadge, setTargetBadge] = React.useState<BadgeRow | null>(null);

  // إحصاءات
  const byRarity = React.useMemo(() => {
    const map: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const b of badges) map[b.rarity] = (map[b.rarity] ?? 0) + 1;
    return Object.entries(map).map(([k, v]) => ({
      name: RARITY_LABELS[k] ?? k,
      value: v,
    }));
  }, [badges]);

  function handleExport() {
    const exportRows = badges.map((b) => ({
      الاسم: b.name,
      الرمز: b.slug,
      الندرة: RARITY_LABELS[b.rarity] ?? b.rarity,
      محدودة: b.isLimited ? "نعم" : "لا",
      المستلمون: b.currentRecipients,
      الحد_الأقصى: b.maxRecipients ?? "غير محدود",
    }));
    exportSheet(exportRows, "badges-list", "الشارات");
    toast.success("تم التصدير");
  }

  async function handleDelete(b: BadgeRow) {
    if (!confirm(`حذف الشارة "${b.name}"؟ هذا الإجراء غير معكوس.`)) return;
    try {
      const res = await fetch(`/api/admin/badges/delete?id=${b.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم حذف الشارة");
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
            <Award className="size-3" strokeWidth={1.5} />
            الشارات v5.0
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              إدارة الشارات
            </h1>
            <p className="text-sm text-muted-foreground">
              {badges.length} شارة · {users.length} مستخدم متاح للمنح
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
            شارة جديدة
          </Button>
        </div>
      </header>

      {/* بطاقات إحصائية + مخطّط */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="إجمالي الشارات" value={formatNumber(badges.length)} color="text-foreground" bg="bg-muted" />
        <Kpi label="عادية" value={formatNumber(byRarity[0]?.value ?? 0)} color="text-slate-700" bg="bg-slate-50" />
        <Kpi label="نادرة" value={formatNumber(byRarity[1]?.value ?? 0)} color="text-blue-700" bg="bg-blue-50" />
        <Kpi label="ملحمية + أسطورية" value={formatNumber((byRarity[2]?.value ?? 0) + (byRarity[3]?.value ?? 0))} color="text-accent" bg="bg-accent/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">توزيع الندرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byRarity} dataKey="value" nameKey="name" outerRadius={80} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
                  {byRarity.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* شبكة البطاقات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Award className="size-6 text-muted-foreground/50" strokeWidth={1.5} />
              <p>لا توجد شارات بعد. ابدأ بإنشاء أول شارة.</p>
            </CardContent>
          </Card>
        ) : (
          badges.map((b) => {
            const countdown = b.availableUntil
              ? Math.max(0, Math.ceil((new Date(b.availableUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
              : null;
            return (
              <Card key={b.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{b.icon}</span>
                    <div className="flex flex-col">
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <span className="font-mono text-[10px] text-muted-foreground">{b.slug}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${RARITY_COLORS[b.rarity] ?? ""}`}>
                    {RARITY_LABELS[b.rarity] ?? b.rarity}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {b.currentRecipients} مستلم
                    </Badge>
                    {b.isLimited && (
                      <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                        محدودة
                      </Badge>
                    )}
                    {b.maxRecipients !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        (حد {b.maxRecipients})
                      </span>
                    )}
                    {countdown !== null && (
                      <Badge variant="outline" className="text-[10px] border-rose-200 bg-rose-50 text-rose-700">
                        ⏱ {countdown} يوم متبقّي
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9 flex-1"
                      onClick={() => {
                        setTargetBadge(b);
                        setGrantOpen(true);
                      }}
                    >
                      <Gift className="size-4" strokeWidth={1.5} />
                      منح
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() => {
                        setTargetBadge(b);
                        setRevokeOpen(true);
                      }}
                    >
                      <Ban className="size-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() => handleDelete(b)}
                    >
                      <Trash2 className="size-4 text-rose-600" strokeWidth={1.5} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* نافذة المنح */}
      <GrantDialog
        badge={targetBadge}
        users={users}
        open={grantOpen}
        onOpenChange={(v) => {
          setGrantOpen(v);
          if (!v) setTargetBadge(null);
        }}
      />

      {/* نافذة السحب */}
      <RevokeDialog
        badge={targetBadge}
        users={users}
        open={revokeOpen}
        onOpenChange={(v) => {
          setRevokeOpen(v);
          if (!v) setTargetBadge(null);
        }}
      />

      {/* نافذة الإنشاء */}
      <CreateBadgeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ===================================================================
//  بطاقة KPI
// ===================================================================

function Kpi({ label, value, color, bg }: { label: string; value: string; color: string; bg: string; }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
        <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  منح شارة لمستخدم/مستخدمين
// ===================================================================

function GrantDialog({
  badge,
  users,
  open,
  onOpenChange,
}: {
  badge: BadgeRow | null;
  users: UserOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelected([]);
      setReason("");
    }
  }, [open]);

  if (!badge) return null;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleGrant() {
    if (!badge) return;
    if (selected.length === 0) {
      toast.error("اختر مستخدماً واحداً على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/badges/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected, badgeId: badge.id, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم منح الشارة");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{badge.icon}</span>
            منح شارة {badge.name}
          </DialogTitle>
          <DialogDescription>اختر المستخدمين الذين سيُمنحون هذه الشارة</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>المستخدمون ({selected.length})</Label>
          <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 custom-scrollbar">
            <ul className="space-y-1">
              {users.map((u) => {
                const checked = selected.includes(u.id);
                return (
                  <li key={u.id}>
                    <label className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${checked ? "bg-accent/10 text-accent" : "hover:bg-muted"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(u.id)} className="size-4 accent-accent" />
                      <span className="flex-1">{u.fullName}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grant-reason">السبب (اختياري)</Label>
            <Input id="grant-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" placeholder="مكافأة على..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleGrant} disabled={submitting}>
            {submitting ? "جارٍ..." : "منح"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  سحب شارة
// ===================================================================

function RevokeDialog({
  badge,
  users,
  open,
  onOpenChange,
}: {
  badge: BadgeRow | null;
  users: UserOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [userId, setUserId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setUserId("");
  }, [open]);

  if (!badge) return null;

  async function handleRevoke() {
    if (!badge || !userId) {
      toast.error("اختر مستخدماً");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/badges/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, badgeId: badge.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم السحب");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="size-4 text-rose-600" strokeWidth={1.5} />
            سحب شارة {badge.name}
          </DialogTitle>
          <DialogDescription>اختر المستخدم الذي سيُسحَب منه الشارة</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>المستخدم</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="h-10"><SelectValue placeholder="اختر مستخدماً" /></SelectTrigger>
            <SelectContent>
              {users.slice(0, 200).map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            ملاحظة: سيُفشل السحب لو لم يكن المستخدم يملك الشارة فعلاً.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={submitting}>
            {submitting ? "جارٍ..." : "سحب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  إنشاء شارة جديدة
// ===================================================================

function CreateBadgeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("🏆");
  const [rarity, setRarity] = React.useState("common");
  const [isLimited, setIsLimited] = React.useState(false);
  const [maxRecipients, setMaxRecipients] = React.useState<number>(10);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName(""); setSlug(""); setDescription(""); setIcon("🏆");
      setRarity("common"); setIsLimited(false); setMaxRecipients(10);
    }
  }, [open]);

  // توليد الـslug تلقائياً من الاسم
  React.useEffect(() => {
    if (!name) return;
    const slugified = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .slice(0, 50);
    setSlug(slugified || `badge-${Date.now().toString(36)}`);
  }, [name]);

  async function handleCreate() {
    if (name.trim().length < 2) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (slug.trim().length < 2) {
      toast.error("الرمز مطلوب");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("الوصف مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/badges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          icon,
          rarity,
          isLimited,
          maxRecipients: isLimited ? maxRecipients : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم إنشاء الشارة");
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
            شارة جديدة
          </DialogTitle>
          <DialogDescription>أنشئ شارة جديدة بمواصفات الندرة والحدود</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="b-name">الاسم</Label>
            <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" placeholder="بطل المعروف" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="b-slug">الرمز (slug)</Label>
            <Input id="b-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="h-10 font-mono" dir="ltr" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="b-desc">الوصف</Label>
            <Textarea id="b-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20" placeholder="تُمنح لمن ساهم في صندوق المعروف 10 مرات" />
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label>الأيقونة</Label>
            <div className="grid grid-cols-8 gap-1 rounded-md border border-border p-2">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`flex size-8 items-center justify-center rounded ${icon === e ? "bg-accent/15" : "hover:bg-muted"}`}
                  aria-label={`أيقونة ${e}`}
                >
                  <span className="text-base">{e}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label>الندرة</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RARITY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Label htmlFor="b-limited" className="text-xs">شارة محدودة</Label>
              <Switch id="b-limited" checked={isLimited} onCheckedChange={setIsLimited} />
            </div>
            {isLimited && (
              <div className="space-y-1.5">
                <Label htmlFor="b-max" className="text-xs">الحد الأقصى للمستلمين</Label>
                <Input id="b-max" type="number" value={maxRecipients} onChange={(e) => setMaxRecipients(Number(e.target.value))} className="h-10" dir="ltr" />
              </div>
            )}
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
