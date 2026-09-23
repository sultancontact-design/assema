"use client";

// ===================================================================
//  StoreAdmin — إدارة المتجر
// ===================================================================

import * as React from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Pencil,
  Download,
  Coins,
  ShoppingBag,
  TrendingUp,
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
import { exportSheet } from "@/lib/admin-export";
import { formatNumber } from "@/lib/constants";
import type { StoreItemRow, OrderRow } from "@/app/admin/store/page";

const TYPE_LABELS: Record<string, string> = {
  FREEZE: "تجميد",
  BADGE: "شارة",
  DISCOUNT: "تخفيض",
  FEATURE: "ميزة",
  DIGITAL: "رقمي",
};

const TYPE_COLORS: Record<string, string> = {
  FREEZE: "border-blue-200 bg-blue-50 text-blue-700",
  BADGE: "border-accent/30 bg-accent/10 text-accent",
  DISCOUNT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FEATURE: "border-purple-200 bg-purple-50 text-purple-700",
  DIGITAL: "border-slate-200 bg-slate-50 text-slate-700",
};

const BAR_COLORS = ["#B8492B", "#2D5A3D", "#C8842A", "#1F1A17", "#D4623E", "#7E6C5D"];

interface UserOption {
  id: string;
  fullName: string;
  points: number;
}

interface Props {
  items: StoreItemRow[];
  orders: OrderRow[];
  users: UserOption[];
}

const EMOJI_CHOICES = ["🎁", "❄️", "🏆", "🏷️", "⭐", "💎", "🔥", "🎯", "🚀", "🎈", "🎟️", "🎖️"];

export function StoreAdmin({ items, orders, users }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<StoreItemRow | null>(null);
  const [purchaseOpen, setPurchaseOpen] = React.useState(false);
  const [purchaseItem, setPurchaseItem] = React.useState<StoreItemRow | null>(null);

  const stats = React.useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.pricePaid, 0);
    return {
      totalItems: items.length,
      totalOrders,
      totalRevenue,
      activeItems: items.filter((i) => i.isActive).length,
    };
  }, [items, orders]);

  const topItems = React.useMemo(() => {
    return [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [items]);

  function handleExport() {
    const rows = items.map((i) => ({
      الاسم: i.name,
      النوع: TYPE_LABELS[i.type] ?? i.type,
      السعر: i.pricePoints,
      المخزون: i.stock === null ? "غير محدود" : i.stock,
      مُفعّل: i.isActive ? "نعم" : "لا",
      الطلبات: i.ordersCount,
      الإيرادات: i.revenue,
    }));
    exportSheet(rows, "store-items", "المتجر");
    toast.success("تم التصدير");
  }

  async function handleDelete(item: StoreItemRow) {
    if (!confirm(`حذف "${item.name}" من المتجر؟`)) return;
    try {
      const res = await fetch(`/api/admin/store/items/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم الحذف");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function handleToggle(item: StoreItemRow) {
    try {
      const res = await fetch(`/api/admin/store/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(item.isActive ? "تم إيقاف العنصر" : "تم تفعيل العنصر");
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
            <ShoppingCart className="size-3" strokeWidth={1.5} />
            المتجر v5.0
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              إدارة المتجر
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} عنصر · {stats.totalOrders} طلب · {formatNumber(stats.totalRevenue)} نقطة إيرادات
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
            عنصر جديد
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="عناصر المتجر" value={formatNumber(stats.totalItems)} icon={<ShoppingBag className="size-4" strokeWidth={1.5} />} color="text-foreground" bg="bg-muted" hint={`${stats.activeItems} مُفعّل`} />
        <Kpi label="إجمالي الطلبات" value={formatNumber(stats.totalOrders)} icon={<ShoppingCart className="size-4" strokeWidth={1.5} />} color="text-accent" bg="bg-accent/10" hint="آخر 50 طلب" />
        <Kpi label="إجمالي الإيرادات" value={formatNumber(stats.totalRevenue)} icon={<Coins className="size-4" strokeWidth={1.5} />} color="text-emerald-600" bg="bg-emerald-50" hint="نقاط" />
        <Kpi label="أكثر عنصر دخلاً" value={topItems[0]?.name ?? "—"} icon={<TrendingUp className="size-4" strokeWidth={1.5} />} color="text-rose-600" bg="bg-rose-50" hint={`${formatNumber(topItems[0]?.revenue ?? 0)} نقطة`} />
      </div>

      {/* رسم: أعلى العناصر دخلاً */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أعلى العناصر دخلاً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems.map((i) => ({ name: i.name, revenue: i.revenue }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v: number) => formatNumber(v)} />
                <Bar dataKey="revenue" name="الإيرادات" radius={[0, 6, 6, 0]}>
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* جدول العناصر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">عناصر المتجر</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">العنصر</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">النوع</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">السعر</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">المخزون</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">الطلبات</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">الإيرادات</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground">مُفعّل</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      لا توجد عناصر بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id} className="text-sm">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{it.icon}</span>
                          <span>{it.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[it.type] ?? ""}`}>
                          {TYPE_LABELS[it.type] ?? it.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end font-mono text-accent">{it.pricePoints}</TableCell>
                      <TableCell className="text-end font-mono text-xs text-muted-foreground">
                        {it.stock === null ? "∞" : it.stock}
                      </TableCell>
                      <TableCell className="text-end font-mono text-xs">{it.ordersCount}</TableCell>
                      <TableCell className="text-end font-mono text-xs text-emerald-600">{formatNumber(it.revenue)}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={it.isActive} onCheckedChange={() => handleToggle(it)} aria-label="تفعيل" />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setPurchaseItem(it);
                              setPurchaseOpen(true);
                            }}
                            disabled={!it.isActive}
                            aria-label="شراء بالنيابة"
                            title="شراء بالنيابة"
                          >
                            <ShoppingCart className="size-3.5" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setEditingItem(it)}
                            aria-label="تعديل"
                            title="تعديل"
                          >
                            <Pencil className="size-3.5 text-amber-600" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleDelete(it)}
                            aria-label="حذف"
                            title="حذف"
                          >
                            <Trash2 className="size-3.5 text-rose-600" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* الطلبات الأخيرة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر الطلبات ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-72 overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">التاريخ</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">المستخدم</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">العنصر</TableHead>
                  <TableHead className="text-end text-xs text-muted-foreground">السعر</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      لا توجد طلبات بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id} className="text-sm">
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {o.createdAt.slice(0, 16).replace("T", " ")}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{o.userFullName}</TableCell>
                      <TableCell className="text-foreground">
                        <span className="me-1">{o.itemIcon}</span>
                        {o.itemName}
                      </TableCell>
                      <TableCell className="text-end font-mono text-accent">{o.pricePaid}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            o.status === "completed"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : o.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {o.status === "completed" ? "مكتمل" : o.status === "pending" ? "معلّق" : "مُسترجَع"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateItemDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditItemDialog item={editingItem} open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)} />
      <PurchaseDialog item={purchaseItem} users={users} open={purchaseOpen} onOpenChange={(v) => { setPurchaseOpen(v); if (!v) setPurchaseItem(null); }} />
    </div>
  );
}

function Kpi({ label, value, icon, color, bg, hint }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string; hint: string; }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
          <div className={`flex size-8 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
        </div>
        <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

// معاودة الاستخدام لحقول النموذج
function ItemFormFields({
  values,
  onChange,
}: {
  values: {
    name: string;
    description: string;
    icon: string;
    pricePoints: number;
    type: string;
    stock: string;
    isActive: boolean;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="i-name">الاسم</Label>
        <Input id="i-name" value={values.name} onChange={(e) => onChange({ name: e.target.value })} className="h-10" placeholder="تجميد إضافي" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="i-desc">الوصف</Label>
        <Textarea id="i-desc" value={values.description} onChange={(e) => onChange({ description: e.target.value })} className="min-h-16" placeholder="وصف العنصر" />
      </div>
      <div className="col-span-1 space-y-1.5">
        <Label>الأيقونة</Label>
        <div className="grid grid-cols-6 gap-1 rounded-md border border-border p-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ icon: e })}
              className={`flex size-8 items-center justify-center rounded ${values.icon === e ? "bg-accent/15" : "hover:bg-muted"}`}
              aria-label={`أيقونة ${e}`}
            >
              <span>{e}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-1 space-y-1.5">
        <Label htmlFor="i-price">السعر (نقاط)</Label>
        <Input id="i-price" type="number" value={values.pricePoints} onChange={(e) => onChange({ pricePoints: Number(e.target.value) })} className="h-10" dir="ltr" />
        <Label htmlFor="i-stock" className="pt-1">المخزون (فارغ = غير محدود)</Label>
        <Input id="i-stock" type="number" value={values.stock} onChange={(e) => onChange({ stock: e.target.value })} className="h-10" dir="ltr" />
      </div>
      <div className="col-span-1 space-y-1.5">
        <Label>النوع</Label>
        <Select value={values.type} onValueChange={(v) => onChange({ type: v })}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1 flex items-center justify-between gap-2 self-end pb-2">
        <Label htmlFor="i-active" className="text-sm">مُفعّل</Label>
        <Switch id="i-active" checked={values.isActive} onCheckedChange={(v) => onChange({ isActive: v })} />
      </div>
    </div>
  );
}

function CreateItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [values, setValues] = React.useState({
    name: "",
    description: "",
    icon: "🎁",
    pricePoints: 50,
    type: "FREEZE",
    stock: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setValues({ name: "", description: "", icon: "🎁", pricePoints: 50, type: "FREEZE", stock: "", isActive: true });
    }
  }, [open]);

  async function handleCreate() {
    if (values.name.trim().length < 2) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (!Number.isInteger(values.pricePoints) || values.pricePoints <= 0) {
      toast.error("السعر يجب أن يكون موجباً");
      return;
    }
    setSubmitting(true);
    try {
      const stock = values.stock === "" ? null : Number(values.stock);
      const res = await fetch("/api/admin/store/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim(),
          icon: values.icon,
          pricePoints: values.pricePoints,
          type: values.type,
          stock,
          isActive: values.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم إنشاء العنصر");
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
            عنصر جديد
          </DialogTitle>
          <DialogDescription>أنشئ عنصراً جديداً في المتجر</DialogDescription>
        </DialogHeader>
        <ItemFormFields values={values} onChange={(p) => setValues((prev) => ({ ...prev, ...p }))} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleCreate} disabled={submitting}>{submitting ? "جارٍ..." : "إنشاء"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditItemDialog({ item, open, onOpenChange }: { item: StoreItemRow | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [values, setValues] = React.useState({
    name: "",
    description: "",
    icon: "🎁",
    pricePoints: 50,
    type: "FREEZE",
    stock: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (item && open) {
      setValues({
        name: item.name,
        description: item.description,
        icon: item.icon,
        pricePoints: item.pricePoints,
        type: item.type,
        stock: item.stock === null ? "" : String(item.stock),
        isActive: item.isActive,
      });
    }
  }, [item, open]);

  if (!item) return null;

  async function handleUpdate() {
    if (!item) return;
    if (values.name.trim().length < 2) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const stock = values.stock === "" ? null : Number(values.stock);
      const res = await fetch(`/api/admin/store/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim(),
          icon: values.icon,
          pricePoints: values.pricePoints,
          type: values.type,
          stock,
          isActive: values.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success("تم التحديث");
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
            <Pencil className="size-4" strokeWidth={1.5} />
            تعديل العنصر
          </DialogTitle>
          <DialogDescription>تعديل بيانات "{item.name}"</DialogDescription>
        </DialogHeader>
        <ItemFormFields values={values} onChange={(p) => setValues((prev) => ({ ...prev, ...p }))} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleUpdate} disabled={submitting}>{submitting ? "جارٍ..." : "حفظ"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseDialog({
  item,
  users,
  open,
  onOpenChange,
}: {
  item: StoreItemRow | null;
  users: UserOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [userId, setUserId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setUserId("");
  }, [open]);

  if (!item) return null;

  async function handlePurchase() {
    if (!item || !userId) {
      toast.error("اختر مستخدماً");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemId: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم الشراء");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUser = users.find((u) => u.id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4" strokeWidth={1.5} />
            شراء بالنيابة
          </DialogTitle>
          <DialogDescription>
            شراء "{item.name}" ({item.pricePoints} نقطة) بالنيابة عن مستخدم
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>المستخدم</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="اختر مستخدماً" /></SelectTrigger>
              <SelectContent>
                {users.slice(0, 200).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} — {formatNumber(u.points)} نقطة
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedUser && selectedUser.points < item.pricePoints && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              ⚠️ رصيد المستخدم ({formatNumber(selectedUser.points)} نقطة) أقل من السعر ({item.pricePoints}).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handlePurchase} disabled={submitting}>{submitting ? "جارٍ..." : "شراء"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
