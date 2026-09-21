"use client";

// ===================================================================
//  FamiliesTable — جدول إدارة العائلات
//  - فلتر: بحث + الحالة الاقتصادية
//  - إحصاءات أعلى: عدد الأسر + عدد الأفراد + توزّع الحالة الاقتصادية
//  - إجراءات: عرض (Sheet تفصيلي) / تعديل / تصدير CSV
// ===================================================================

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Download,
  Users as UsersIcon,
  Home,
  Coins,
  FileText,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  formatMAD,
  formatDateArabic,
  formatDateTimeArabic,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminFamilyMember {
  id: string;
  fullName: string;
  role: string;       // Prisma Role
  isFamilyHead: boolean;
  profession: string | null;
}

export interface AdminFamilyContribution {
  id: string;
  receiptNumber: string | null;
  amount: number;
  month: string;
  status: string;     // ContributionStatus
  createdAt: string;
}

export interface AdminFamilyFundRequest {
  id: string;
  anonymousCode: string | null;
  type: string;
  title: string;
  amountRequested: number;
  status: string;     // FundRequestStatus
  createdAt: string;
}

export interface AdminFamilyRow {
  id: string;
  familyName: string;
  headName: string | null;
  address: string | null;
  economicStatus: string;
  memberCount: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  // إحصاءات
  contributionsTotal: number;
  fundRequestsCount: number;
  // تفاصيل للـSheet
  members: AdminFamilyMember[];
  recentContributions: AdminFamilyContribution[];
  recentRequests: AdminFamilyFundRequest[];
}

interface FamiliesTableProps {
  families: AdminFamilyRow[];
  totalMembers: number;
  economicDistribution: Record<string, number>;
  canEdit: boolean;
}

// ===================================================================
//  شارة الحالة الاقتصادية
// ===================================================================

function EconomicStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "ضعيف": "border-rose-200 bg-rose-100 text-rose-700",
    "متوسط": "border-amber-200 bg-amber-100 text-amber-700",
    "جيد": "border-emerald-200 bg-emerald-100 text-emerald-700",
  };
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", styles[status] ?? "border-border bg-muted text-muted-foreground")}
    >
      {status}
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
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md",
            accent
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground"
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

function FamiliesFilters({
  search,
  onSearch,
  status,
  onStatusChange,
  resultCount,
  onExportAll,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  resultCount: number;
  onExportAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث باسم العائلة"
            className="h-10 ps-9"
            aria-label="بحث عن عائلة"
          />
        </div>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-full lg:w-44" aria-label="فلتر الحالة الاقتصادية">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            <SelectItem value="ضعيف">ضعيف</SelectItem>
            <SelectItem value="متوسط">متوسط</SelectItem>
            <SelectItem value="جيد">جيد</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2"
          onClick={onExportAll}
          disabled={resultCount === 0}
        >
          <Download className="size-4" strokeWidth={1.5} />
          <span>تصدير الكل</span>
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {resultCount} عائلة
        </p>
      </div>
    </div>
  );
}

// ===================================================================
//  نافذة التعديل
// ===================================================================

interface FamilyFormValues {
  familyName: string;
  address: string;
  economicStatus: string;
  memberCount: string;
  notes: string;
  isActive: boolean;
}

function FamilyEditDialog({
  family,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  family: AdminFamilyRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: FamilyFormValues) => Promise<void>;
  submitting: boolean;
}) {
  const [values, setValues] = React.useState<FamilyFormValues>(() => ({
    familyName: family?.familyName ?? "",
    address: family?.address ?? "",
    economicStatus: family?.economicStatus ?? "متوسط",
    memberCount: family ? String(family.memberCount) : "1",
    notes: family?.notes ?? "",
    isActive: family?.isActive ?? true,
  }));

  React.useEffect(() => {
    if (open && family) {
      setValues({
        familyName: family.familyName,
        address: family.address ?? "",
        economicStatus: family.economicStatus,
        memberCount: String(family.memberCount),
        notes: family.notes ?? "",
        isActive: family.isActive,
      });
    }
  }, [open, family]);

  function set<K extends keyof FamilyFormValues>(
    key: K,
    value: FamilyFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.familyName.trim()) {
      toast.error("اسم العائلة مطلوب");
      return;
    }
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل بيانات العائلة</DialogTitle>
          <DialogDescription>
            عدّل بيانات عائلة «{family?.familyName}».
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="fam-name">اسم العائلة *</Label>
            <Input
              id="fam-name"
              value={values.familyName}
              onChange={(e) => set("familyName", e.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="fam-addr">العنوان</Label>
            <Input
              id="fam-addr"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              className="h-10"
              placeholder="حي الزرقاء، رقم 12"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="fam-eco">الحالة الاقتصادية</Label>
            <Select
              value={values.economicStatus}
              onValueChange={(v) => set("economicStatus", v)}
            >
              <SelectTrigger id="fam-eco" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ضعيف">ضعيف</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="جيد">جيد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="fam-count">عدد الأفراد</Label>
            <Input
              id="fam-count"
              type="number"
              min={1}
              value={values.memberCount}
              onChange={(e) => set("memberCount", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label htmlFor="fam-notes">ملاحظات</Label>
            <Textarea
              id="fam-notes"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[60px]"
              placeholder="ملاحظات إدارية..."
            />
          </div>
          <div className="col-span-1 sm:col-span-2 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="fam-active" className="text-sm font-medium">
                العائلة نشطة
              </Label>
              <span className="text-xs text-muted-foreground">
                العائلات غير النشطة تُستثنى من التوزيعات
              </span>
            </div>
            <Select
              value={values.isActive ? "true" : "false"}
              onValueChange={(v) => set("isActive", v === "true")}
            >
              <SelectTrigger id="fam-active" className="h-10 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">نشطة</SelectItem>
                <SelectItem value="false">متوقفة</SelectItem>
              </SelectContent>
            </Select>
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
              {submitting ? "جارٍ الحفظ..." : "حفظ التعديل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  Sheet تفاصيل العائلة
// ===================================================================

function FamilyDetailSheet({
  family,
  open,
  onOpenChange,
  onExportFamily,
}: {
  family: AdminFamilyRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onExportFamily: (family: AdminFamilyRow) => void;
}) {
  if (!family) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border bg-muted/30 p-4 text-start">
          <SheetTitle className="text-start text-lg font-bold text-foreground">
            عائلة «{family.familyName}»
          </SheetTitle>
          <SheetDescription className="text-start text-xs text-muted-foreground">
            أُنشئت بتاريخ {formatDateArabic(family.createdAt)} ·{" "}
            {family.memberCount} فرد · {family.members.length} مسجّل
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* بطاقة المعلومات */}
          <section className="space-y-3 border-b border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Home className="size-4 text-accent" strokeWidth={1.5} />
              <span>معلومات العائلة</span>
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">رب الأسرة</dt>
                <dd className="font-medium text-foreground">
                  {family.headName ?? "غير معيّن"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">الحالة الاقتصادية</dt>
                <dd>
                  <EconomicStatusBadge status={family.economicStatus} />
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">عدد الأفراد</dt>
                <dd className="font-mono text-foreground">{family.memberCount}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">الحالة</dt>
                <dd>
                  <Badge
                    variant="outline"
                    className={
                      family.isActive
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700 text-xs"
                        : "border-slate-200 bg-slate-100 text-slate-600 text-xs"
                    }
                  >
                    {family.isActive ? "نشطة" : "متوقفة"}
                  </Badge>
                </dd>
              </div>
              {family.address && (
                <div className="col-span-2 flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">العنوان</dt>
                  <dd className="text-foreground">{family.address}</dd>
                </div>
              )}
              {family.notes && (
                <div className="col-span-2 flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">ملاحظات</dt>
                  <dd className="text-foreground">{family.notes}</dd>
                </div>
              )}
              <div className="col-span-2 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">إجمالي المساهمات</dt>
                  <dd className="font-bold text-accent">
                    {formatMAD(family.contributionsTotal)}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">عدد الطلبات</dt>
                  <dd className="font-mono text-foreground">
                    {family.fundRequestsCount}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* أعضاء العائلة */}
          <section className="space-y-3 border-b border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UsersIcon className="size-4 text-accent" strokeWidth={1.5} />
              <span>الأعضاء ({family.members.length})</span>
            </h3>
            {family.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا يوجد أعضاء مسجّلون في هذه العائلة.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {family.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {m.fullName}
                      </span>
                      {m.isFamilyHead && (
                        <Badge
                          variant="outline"
                          className="border-accent/30 bg-accent/10 text-accent text-[10px]"
                        >
                          رب الأسرة
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.profession ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* آخر المساهمات */}
          <section className="space-y-3 border-b border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Coins className="size-4 text-accent" strokeWidth={1.5} />
              <span>آخر المساهمات ({family.recentContributions.length})</span>
            </h3>
            {family.recentContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مساهمات.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {family.recentContributions.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 p-2.5 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-accent">
                        {c.receiptNumber ?? "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTimeArabic(c.createdAt)} · {c.month}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatMAD(c.amount)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          c.status === "CONFIRMED"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                            : c.status === "PENDING"
                              ? "border-amber-200 bg-amber-100 text-amber-700"
                              : "border-rose-200 bg-rose-100 text-rose-700"
                        )}
                      >
                        {c.status === "CONFIRMED"
                          ? "مؤكَّد"
                          : c.status === "PENDING"
                            ? "بانتظار"
                            : c.status === "REJECTED"
                              ? "مرفوض"
                              : "مُعاد"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* آخر الطلبات */}
          <section className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="size-4 text-accent" strokeWidth={1.5} />
              <span>آخر طلبات المعروف ({family.recentRequests.length})</span>
            </h3>
            {family.recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {family.recentRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 p-2.5 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.anonymousCode ?? "—"} ·{" "}
                        {formatDateTimeArabic(r.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatMAD(r.amountRequested)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {r.status === "SUBMITTED"
                          ? "مقدّم"
                          : r.status === "UNDER_REVIEW"
                            ? "قيد المراجعة"
                            : r.status === "APPROVED"
                              ? "موافَق"
                              : r.status === "REJECTED"
                                ? "مرفوض"
                                : r.status === "DISBURSED"
                                  ? "مصروف"
                                  : "مكتمل"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* تذييل: تصدير */}
        <div className="border-t border-border bg-muted/30 p-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full gap-2"
            onClick={() => onExportFamily(family)}
          >
            <Download className="size-4" strokeWidth={1.5} />
            <span>تصدير تفاصيل العائلة</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ===================================================================
//  المكوّن الرئيسي
// ===================================================================

export function FamiliesTable({
  families,
  totalMembers,
  economicDistribution,
  canEdit,
}: FamiliesTableProps) {
  // الفلاتر
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");

  // النوافذ
  const [detailFamily, setDetailFamily] = React.useState<AdminFamilyRow | null>(null);
  const [editFamily, setEditFamily] = React.useState<AdminFamilyRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // تصفية
  const filtered = React.useMemo(() => {
    return families.filter((f) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!f.familyName.toLowerCase().includes(q)) return false;
      }
      if (status !== "ALL" && f.economicStatus !== status) return false;
      return true;
    });
  }, [families, search, status]);

  // ─────────── إجراءات الخادم ───────────

  async function handleEdit(values: FamilyFormValues) {
    if (!editFamily) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/families/${editFamily.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: values.familyName.trim(),
          address: values.address.trim() || null,
          economicStatus: values.economicStatus,
          memberCount: Number(values.memberCount) || 1,
          notes: values.notes.trim() || null,
          isActive: values.isActive,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تحديث العائلة");
        return;
      }
      toast.success("تم تحديث بيانات العائلة");
      setEditFamily(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────── تصدير CSV ───────────

  function exportFamily(family: AdminFamilyRow) {
    // ورقة 1: معلومات العائلة
    const infoRows = [
      {
        "الحقل": "اسم العائلة",
        "القيمة": family.familyName,
      },
      { "الحقل": "رب الأسرة", "القيمة": family.headName ?? "غير معيّن" },
      { "الحقل": "الحالة الاقتصادية", "القيمة": family.economicStatus },
      { "الحقل": "عدد الأفراد", "القيمة": family.memberCount },
      { "الحقل": "العنوان", "القيمة": family.address ?? "—" },
      { "الحقل": "إجمالي المساهمات", "القيمة": family.contributionsTotal },
      { "الحقل": "عدد الطلبات", "القيمة": family.fundRequestsCount },
    ];
    // ورقة 2: الأعضاء
    const memberRows = family.members.map((m) => ({
      "الاسم": m.fullName,
      "رب الأسرة": m.isFamilyHead ? "نعم" : "لا",
      "المهنة": m.profession ?? "—",
    }));
    // ورقة 3: آخر المساهمات
    const contribRows = family.recentContributions.map((c) => ({
      "رقم الإيصال": c.receiptNumber ?? "—",
      "المبلغ": c.amount,
      "الشهر": c.month,
      "الحالة": c.status,
      "التاريخ": formatDateTimeArabic(c.createdAt),
    }));
    // ورقة 4: آخر الطلبات
    const reqRows = family.recentRequests.map((r) => ({
      "الرمز": r.anonymousCode ?? "—",
      "النوع": r.type,
      "العنوان": r.title,
      "المبلغ المطلوب": r.amountRequested,
      "الحالة": r.status,
      "التاريخ": formatDateTimeArabic(r.createdAt),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(infoRows),
      "معلومات العائلة"
    );
    if (memberRows.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(memberRows),
        "الأعضاء"
      );
    }
    if (contribRows.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(contribRows),
        "المساهمات"
      );
    }
    if (reqRows.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(reqRows),
        "الطلبات"
      );
    }
    XLSX.writeFile(
      wb,
      `عائلة_${family.familyName}_${new Date().toISOString().slice(0, 10)}.csv`,
      { bookType: "csv" }
    );
    toast.success("تم تصدير تفاصيل العائلة");
  }

  function exportAll() {
    const rows = filtered.map((f) => ({
      "اسم العائلة": f.familyName,
      "رب الأسرة": f.headName ?? "غير معيّن",
      "الحالة الاقتصادية": f.economicStatus,
      "عدد الأفراد": f.memberCount,
      "العنوان": f.address ?? "—",
      "إجمالي المساهمات (د.م)": f.contributionsTotal,
      "عدد الطلبات": f.fundRequestsCount,
      "الحالة": f.isActive ? "نشطة" : "متوقفة",
      "تاريخ التسجيل": formatDateArabic(f.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 10 },
      { wch: 30 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العائلات");
    XLSX.writeFile(
      wb,
      `عائلات_${new Date().toISOString().slice(0, 10)}.csv`,
      { bookType: "csv" }
    );
    toast.success(`تم تصدير ${rows.length} عائلة`);
  }

  // ─────────── عرض الجدول ───────────

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="إجمالي الأسر"
          value={families.length}
          icon={<Home className="size-5" strokeWidth={1.5} />}
        />
        <StatCard
          label="إجمالي الأفراد"
          value={totalMembers}
          icon={<UsersIcon className="size-5" strokeWidth={1.5} />}
        />
        <StatCard
          label="توزّع الحالة الاقتصادية"
          value={`ضعيف ${economicDistribution["ضعيف"] ?? 0} · متوسط ${
            economicDistribution["متوسط"] ?? 0
          } · جيد ${economicDistribution["جيد"] ?? 0}`}
          icon={<Coins className="size-5" strokeWidth={1.5} />}
          accent
        />
      </div>

      {/* الفلاتر */}
      <FamiliesFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatusChange={setStatus}
        resultCount={filtered.length}
        onExportAll={exportAll}
      />

      {/* الجدول */}
      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">
                    اسم العائلة
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    رب الأسرة
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الأفراد
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    الحالة الاقتصادية
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    إجمالي المساهمات
                  </TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">
                    عدد الطلبات
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
                        <Home
                          className="size-6 text-muted-foreground/50"
                          strokeWidth={1.5}
                        />
                        <p>لا توجد عائلات مطابقة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((f) => (
                    <TableRow key={f.id} className="text-sm">
                      <TableCell className="font-medium text-foreground">
                        {f.familyName}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {f.headName ?? (
                          <span className="text-muted-foreground">غير معيّن</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {f.memberCount}
                      </TableCell>
                      <TableCell>
                        <EconomicStatusBadge status={f.economicStatus} />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatMAD(f.contributionsTotal)}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {f.fundRequestsCount}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`إجراءات ${f.familyName}`}
                            >
                              <MoreVertical className="size-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setDetailFamily(f)}>
                              <Eye className="size-4" strokeWidth={1.5} />
                              <span>عرض التفاصيل</span>
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onSelect={() => setEditFamily(f)}>
                                <Pencil className="size-4" strokeWidth={1.5} />
                                <span>تعديل</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => exportFamily(f)}>
                              <Download className="size-4" strokeWidth={1.5} />
                              <span>تصدير CSV</span>
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

      {/* Sheet التفاصيل */}
      <FamilyDetailSheet
        family={detailFamily}
        open={!!detailFamily}
        onOpenChange={(v) => !v && setDetailFamily(null)}
        onExportFamily={exportFamily}
      />

      {/* نافذة التعديل */}
      {canEdit && (
        <FamilyEditDialog
          family={editFamily}
          open={!!editFamily}
          onOpenChange={(v) => !v && setEditFamily(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
