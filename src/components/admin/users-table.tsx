"use client";

// ===================================================================
//  UsersTable — جدول إدارة المستخدمين (client-side filtering)
//  - بحث debounced (300ms) على الاسم/البريد/الهاتف
//  - فلتر الدور (Select)
//  - فلتر الحالة (Select)
//  - جدول بـ8 أعمدة + إجراءات سطر منسدلة
//  - ترقيم صفحات (50/صفحة) داخل الذاكرة
// ===================================================================

import * as React from "react";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  ShieldQuestion,
  Power,
  Trash2,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  Coins,
  Award,
  History,
  Flame,
  Send,
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
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  formatDateArabic,
  formatNumber,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role, UserStatus } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  district: { name: string } | null;
  family: { familyName: string } | null;
  points?: number;
  level?: number;
  currentStreak?: number;
  longestStreak?: number;
  freezes?: number;
}

export interface BadgeOption {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  isLimited: boolean;
  available: boolean;
}

interface UsersTableProps {
  users: AdminUserRow[];
  currentUserRole: Role;
  badgeOptions?: BadgeOption[];
}

const PAGE_SIZE = 50;

// ===================================================================
//  شارة الدور
// ===================================================================

function RoleBadge({ role }: { role: Role }) {
  const isHighLevel =
    role === "SUPER_ADMIN" ||
    role === "TREASURER" ||
    role === "ETHICS_COMMITTEE";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        isHighLevel
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {ROLE_LABELS[role].label}
    </Badge>
  );
}

// ===================================================================
//  شارة الحالة
// ===================================================================

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    SUSPENDED: "bg-rose-100 text-rose-700 border-rose-200",
    DISABLED: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[status])}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}

// ===================================================================
//  اختصار الـcuid لأغراض العرض
// ===================================================================

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

// ===================================================================
//  مكوّن فلاتر + بحث
// ===================================================================

function UsersFilters({
  search,
  onSearch,
  role,
  onRoleChange,
  status,
  onStatusChange,
  resultCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  role: string;
  onRoleChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  resultCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* البحث */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الهاتف"
            className="h-10 ps-9"
            aria-label="بحث عن مستخدم"
          />
        </div>

        {/* فلتر الدور */}
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="فلتر الدور">
            <SelectValue placeholder="كل الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الأدوار</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* فلتر الحالة */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="فلتر الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            {Object.entries(USER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {resultCount} مستخدم
      </p>
    </div>
  );
}

// ===================================================================
//  نافذة عرض التفاصيل
// ===================================================================

function ViewDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تفاصيل المستخدم</DialogTitle>
          <DialogDescription>عرض معلومات {user.fullName}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">المعرّف</dt>
            <dd className="font-mono text-xs text-foreground">{user.id}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">الاسم الكامل</dt>
            <dd className="text-foreground">{user.fullName}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">البريد</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">الهاتف</dt>
            <dd className="font-mono text-xs text-foreground">{user.phone}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">الحي</dt>
            <dd className="text-foreground">
              {user.district?.name ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">العائلة</dt>
            <dd className="text-foreground">
              {user.family?.familyName ?? "غير مربوط"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">الدور</dt>
            <dd>
              <RoleBadge role={user.role} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">الحالة</dt>
            <dd>
              <StatusBadge status={user.status} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">تاريخ التسجيل</dt>
            <dd className="text-foreground">
              {formatDateArabic(user.createdAt)}
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  نافذة تعديل (stub)
// ===================================================================

function EditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!user) return null;
  const [firstName, lastName] = user.fullName.split(" ", 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          <DialogDescription>
            تعديل الاسم والمهنة لـ{user.fullName}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            toast.info("الميزة قيد التطوير — سيتم الحفظ تلقائياً في الإصدار القادم");
            onOpenChange(false);
          }}
        >
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="edit-first">الاسم الشخصي</Label>
            <Input id="edit-first" defaultValue={firstName} className="h-10" />
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="edit-last">اسم العائلة</Label>
            <Input id="edit-last" defaultValue={lastName} className="h-10" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="edit-phone">الهاتف</Label>
            <Input
              id="edit-phone"
              defaultValue={user.phone}
              className="h-10"
              dir="ltr"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="edit-email">البريد</Label>
            <Input
              id="edit-email"
              type="email"
              defaultValue={user.email}
              className="h-10"
              dir="ltr"
            />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  نافذة تغيير الدور
// ===================================================================

function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [newRole, setNewRole] = React.useState<Role>(user?.role ?? "MEMBER");

  React.useEffect(() => {
    if (user) setNewRole(user.role);
  }, [user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تغيير الدور</DialogTitle>
          <DialogDescription>
            تغيير دور {user.fullName} من {ROLE_LABELS[user.role].label}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>الدور الجديد</Label>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label} — {meta.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newRole !== user.role && (
            <p className="text-xs text-amber-700">
              تنبيه: سيؤثر هذا على صلاحيات المستخدم في النظام.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => {
              toast.info(
                `تغيير دور ${user.fullName} إلى ${ROLE_LABELS[newRole].label}`
              );
              onOpenChange(false);
            }}
            disabled={newRole === user.role}
          >
            تطبيق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  الجدول الرئيسي
// ===================================================================

export function UsersTable({ users, currentUserRole, badgeOptions = [] }: UsersTableProps) {
  // الفلاتر
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [role, setRole] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<string>("ALL");

  // الترقيم
  const [page, setPage] = React.useState(1);

  // النوافذ المنبثقة
  const [viewUser, setViewUser] = React.useState<AdminUserRow | null>(null);
  const [editUser, setEditUser] = React.useState<AdminUserRow | null>(null);
  const [roleUser, setRoleUser] = React.useState<AdminUserRow | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<AdminUserRow | null>(null);
  const [toggleUser, setToggleUser] = React.useState<AdminUserRow | null>(null);

  // v5.0: نقاط وشارات وسجلّ
  const [adjustUser, setAdjustUser] = React.useState<AdminUserRow | null>(null);
  const [grantBadgeUser, setGrantBadgeUser] = React.useState<AdminUserRow | null>(null);
  const [ledgerUser, setLedgerUser] = React.useState<AdminUserRow | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkNotificationOpen, setBulkNotificationOpen] = React.useState(false);

  // Debounce البحث 300ms
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // إعادة التصفية عند تغيير الفلاتر
  React.useEffect(() => {
    setPage(1);
  }, [role, status]);

  // تصفية البيانات في الذاكرة
  const filtered = React.useMemo(() => {
    return users.filter((u) => {
      // البحث
      if (debouncedSearch) {
        const q = debouncedSearch;
        const haystack = `${u.fullName} ${u.email} ${u.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // الدور
      if (role !== "ALL" && u.role !== role) return false;
      // الحالة
      if (status !== "ALL" && u.status !== status) return false;
      return true;
    });
  }, [users, debouncedSearch, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentStart = (page - 1) * PAGE_SIZE;
  const currentRows = filtered.slice(currentStart, currentStart + PAGE_SIZE);

  // هل المستخدم الحالي سوبر أدمن؟ (وحده يغيّر الأدوار ويحذف)
  const canManageRoles = currentUserRole === "SUPER_ADMIN";

  // إجراء "تعطيل/تفعيل"
  function toggleStatus(u: AdminUserRow) {
    const newStatus = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    toast.info(
      `${newStatus === "ACTIVE" ? "تفعيل" : "تعطيل"} ${u.fullName}`,
      {
        description: `الحالة المستهدفة: ${USER_STATUS_LABELS[newStatus as UserStatus]}`,
      }
    );
    setToggleUser(null);
  }

  // إجراء "حذف"
  function confirmDelete(u: AdminUserRow) {
    toast.info(`حذف ${u.fullName}`, {
      description: "هذا الإجراء غير معكوس — ",
    });
    setDeleteUser(null);
  }

  // تحديد/إلغاء تحديد مستخدم
  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  // تحديد/إلغاء الكل على الصفحة الحالية
  function toggleSelectPage() {
    const allSelected = currentRows.every((u) => selectedIds.includes(u.id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentRows.some((u) => u.id === id)));
    } else {
      const additions = currentRows.map((u) => u.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...additions]);
    }
  }
  const pageAllSelected = currentRows.length > 0 && currentRows.every((u) => selectedIds.includes(u.id));

  // تعديل جماعي للنقاط
  async function bulkAdjustPoints(amount: number, reason: string) {
    if (selectedIds.length === 0) {
      toast.error("اختر مستخدماً واحداً على الأقل");
      return;
    }
    try {
      const res = await fetch("/api/admin/economy/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds, amount, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم التعديل");
      setSelectedIds([]);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  return (
    <div className="space-y-4">
      {/* الفلاتر + إجراءات جماعية */}
      <div className="flex flex-col gap-3">
        <UsersFilters
          search={search}
          onSearch={setSearch}
          role={role}
          onRoleChange={setRole}
          status={status}
          onStatusChange={setStatus}
          resultCount={filtered.length}
        />
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-accent/30 bg-accent/5 p-2">
            <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
              <UsersIcon className="size-3" strokeWidth={1.5} />
              {selectedIds.length} محدد
            </Badge>
            <BulkAdjustButton onApply={bulkAdjustPoints} />
            <Button
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={() => setBulkNotificationOpen(true)}
            >
              <Send className="size-4" strokeWidth={1.5} />
              إشعار جماعي
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-9"
              onClick={() => setSelectedIds([])}
            >
              إلغاء التحديد
            </Button>
          </div>
        )}
      </div>

      {/* الجدول */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 text-start text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={pageAllSelected}
                  onChange={toggleSelectPage}
                  className="size-4 accent-accent"
                  aria-label="تحديد الكل"
                />
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المعرّف
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الاسم الكامل
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                البريد
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الهاتف
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الحي
              </TableHead>
              <TableHead className="text-end text-xs text-muted-foreground">
                المستوى
              </TableHead>
              <TableHead className="text-end text-xs text-muted-foreground">
                النقاط
              </TableHead>
              <TableHead className="text-end text-xs text-muted-foreground">
                السلسلة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الدور
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
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                    <UsersIcon className="size-6 text-muted-foreground/50" strokeWidth={1.5} />
                    <p>لا توجد مستخدمون مطابقون للفلاتر المحدّدة</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <TableRow key={u.id} className="text-sm">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(u.id)}
                        className="size-4 accent-accent"
                        aria-label={`تحديد ${u.fullName}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {shortId(u.id)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {u.fullName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                      {u.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {u.phone}
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      {u.district?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <Badge variant="outline" className="text-[10px]">
                        {u.level ?? 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-semibold text-accent">
                      {formatNumber(u.points ?? 0)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs text-foreground">
                      🔥 {u.currentStreak ?? 0}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`إجراءات ${u.fullName}`}
                          >
                            <MoreVertical className="size-4" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setViewUser(u)}>
                            <Eye className="size-4" strokeWidth={1.5} />
                            <span>عرض</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEditUser(u)}>
                            <Pencil className="size-4" strokeWidth={1.5} />
                            <span>تعديل</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setAdjustUser(u)}>
                            <Coins className="size-4" strokeWidth={1.5} />
                            <span>تعديل النقاط</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setGrantBadgeUser(u)} disabled={badgeOptions.length === 0}>
                            <Award className="size-4" strokeWidth={1.5} />
                            <span>منح شارة</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setLedgerUser(u)}>
                            <History className="size-4" strokeWidth={1.5} />
                            <span>عرض سجلّ النقاط</span>
                          </DropdownMenuItem>
                          {canManageRoles && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setRoleUser(u)}>
                                <ShieldQuestion className="size-4" strokeWidth={1.5} />
                                <span>تغيير الدور</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setToggleUser(u)}>
                                <Power className="size-4" strokeWidth={1.5} />
                                <span>
                                  {u.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setDeleteUser(u)}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* الترقيم */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          صفحة {page} من {totalPages} · إجمالي {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
            <span>السابق</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <span>التالي</span>
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <ViewDialog
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(v) => !v && setViewUser(null)}
      />
      <EditDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(v) => !v && setEditUser(null)}
      />
      <ChangeRoleDialog
        user={roleUser}
        open={!!roleUser}
        onOpenChange={(v) => !v && setRoleUser(null)}
      />
      <AdjustPointsDialog
        user={adjustUser}
        open={!!adjustUser}
        onOpenChange={(v) => !v && setAdjustUser(null)}
      />
      <GrantBadgeDialog
        user={grantBadgeUser}
        badgeOptions={badgeOptions}
        open={!!grantBadgeUser}
        onOpenChange={(v) => !v && setGrantBadgeUser(null)}
      />
      <PointsLedgerSheet
        user={ledgerUser}
        open={!!ledgerUser}
        onOpenChange={(v) => !v && setLedgerUser(null)}
      />
      <BulkNotificationDialog
        open={bulkNotificationOpen}
        onOpenChange={setBulkNotificationOpen}
        selectedCount={selectedIds.length}
      />

      {/* تأكيد التعطيل/التفعيل */}
      <AlertDialog
        open={!!toggleUser}
        onOpenChange={(v) => !v && setToggleUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUser?.status === "ACTIVE" ? "تعطيل الحساب" : "تفعيل الحساب"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleUser?.status === "ACTIVE"
                ? `سيتم تعطيل حساب ${toggleUser?.fullName}. لن يستطيع الدخول حتى يُفعّل مجدداً.`
                : `سيتم تفعيل حساب ${toggleUser?.fullName}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleUser && toggleStatus(toggleUser)}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تأكيد الحذف */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={(v) => !v && setDeleteUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حساب {deleteUser?.fullName}؟ هذا الإجراء غير
              معكوس.{" "}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteUser && confirmDelete(deleteUser)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===================================================================
//  v5.0 — تعديل النقاط (للمستخدم الواحد)
// ===================================================================

function AdjustPointsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [amount, setAmount] = React.useState(0);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAmount(0);
      setReason("");
    }
  }, [open]);

  if (!user) return null;

  async function handleSubmit() {
    if (!user) return;
    if (!Number.isInteger(amount) || amount === 0) {
      toast.error("أدخِل مبلغاً صحيحاً غير صفر");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("السبب مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/economy/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [user.id], amount, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم التعديل");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 700);
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
            <Coins className="size-4 text-accent" strokeWidth={1.5} />
            تعديل نقاط {user.fullName}
          </DialogTitle>
          <DialogDescription>
            الرصيد الحالي: {formatNumber(user.points ?? 0)} نقطة · مستوى {user.level ?? 1}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="adj-amount">المبلغ</Label>
            <Input
              id="adj-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-10"
              placeholder="مثال: 100 أو -50"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adj-reason">السبب</Label>
            <Input
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10"
              placeholder="مكافأة / تصحيح"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جارٍ..." : "تنفيذ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  v5.0 — منح شارة لمستخدم
// ===================================================================

const RARITY_LABELS_BADGES: Record<string, string> = {
  common: "عادية",
  rare: "نادرة",
  epic: "ملحمية",
  legendary: "أسطورية",
};

function GrantBadgeDialog({
  user,
  badgeOptions,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  badgeOptions: BadgeOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [badgeId, setBadgeId] = React.useState<string>("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setBadgeId("");
      setReason("");
    }
  }, [open]);

  if (!user) return null;

  async function handleGrant() {
    if (!user || !badgeId) {
      toast.error("اختر شارة");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/badges/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [user.id], badgeId, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(data.message || "تم منح الشارة");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 700);
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
            <Award className="size-4 text-accent" strokeWidth={1.5} />
            منح شارة لـ{user.fullName}
          </DialogTitle>
          <DialogDescription>اختر الشارة التي تريد منحها</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>الشارة</Label>
          {badgeOptions.length === 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              لا توجد شارات متاحة. أنشئ شارة من صفحة الشارات.
            </p>
          ) : (
            <Select value={badgeId} onValueChange={setBadgeId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="اختر شارة" /></SelectTrigger>
              <SelectContent>
                {badgeOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id} disabled={!b.available}>
                    {b.icon} {b.name} — {RARITY_LABELS_BADGES[b.rarity] ?? b.rarity}
                    {!b.available ? " (نفد)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="g-reason">السبب (اختياري)</Label>
            <Input
              id="g-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10"
              placeholder="مكافأة على..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleGrant} disabled={submitting || !badgeId}>
            {submitting ? "جارٍ..." : "منح"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  v5.0 — Sheet عرض سجلّ النقاط
// ===================================================================

interface LedgerRow {
  id: string;
  amount: number;
  type: string;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  EARN: "كسب",
  SPEND: "صرف",
  ADJUST: "تعديل",
  PURCHASE: "شراء",
  TRANSFER: "تحويل",
};

function PointsLedgerSheet({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [rows, setRows] = React.useState<LedgerRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/economy/ledger?userId=${user.id}&limit=100`);
        const data = await res.json();
        if (!cancelled) setRows(data.rows ?? []);
      } catch {
        if (!cancelled) toast.error("فشل تحميل السجلّ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-4 text-accent" strokeWidth={1.5} />
            سجلّ نقاط {user.fullName}
          </SheetTitle>
          <SheetDescription>
            الرصيد الحالي: {formatNumber(user.points ?? 0)} نقطة · آخر 100 معاملة
          </SheetDescription>
        </SheetHeader>
        <div className="p-3">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">لا توجد معاملات</div>
          ) : (
            <ul className="space-y-1">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 p-2 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[r.type] ?? r.type}
                      </Badge>
                      <span className="text-muted-foreground" dir="ltr">
                        {r.createdAt.slice(0, 16).replace("T", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground">الرصيد بعد: {formatNumber(r.balanceAfter)}</p>
                  </div>
                  <span className={`font-mono font-semibold ${r.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {r.amount > 0 ? "+" : ""}{formatNumber(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ===================================================================
//  v5.0 — زر تعديل جماعي للنقاط (يفتح dialog صغير)
// ===================================================================

function BulkAdjustButton({ onApply }: { onApply: (amount: number, reason: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(0);
  const [reason, setReason] = React.useState("");

  function handleApply() {
    if (!Number.isInteger(amount) || amount === 0) {
      toast.error("أدخِل مبلغاً صحيحاً غير صفر");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("السبب مطلوب");
      return;
    }
    onApply(amount, reason.trim());
    setOpen(false);
    setAmount(0);
    setReason("");
  }

  return (
    <>
      <Button variant="outline" size="sm" className="min-h-9" onClick={() => setOpen(true)}>
        <Coins className="size-4" strokeWidth={1.5} />
        تعديل النقاط
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="size-4 text-accent" strokeWidth={1.5} />
              تعديل جماعي للنقاط
            </DialogTitle>
            <DialogDescription>
              سيُطبَّق نفس المبلغ على كل المستخدمين المحدّدين
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-amount">المبلغ</Label>
              <Input
                id="bulk-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-10"
                dir="ltr"
                placeholder="100 أو -50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-reason">السبب</Label>
              <Input
                id="bulk-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleApply}>تنفيذ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================================================================
//  v5.0 — إشعار جماعي للمستخدمين المحدّدين
// ===================================================================

function BulkNotificationDialog({
  open,
  onOpenChange,
  selectedCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedCount: number;
}) {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setMessage("");
    }
  }, [open]);

  async function handleSend() {
    if (title.trim().length < 3) {
      toast.error("العنوان مطلوب");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("الرسالة مطلوبة");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience: "selected",
          selectedUserIds: [], // ملاحظة: الإصدار الحالي للـAPI يستعمل audience؛
          // الربط الكامل بـselectedUserIds يتطلّب تحديثات على نقطة النهاية
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل");
      toast.success(`تم إرسال الإشعار (محاكاة — ${selectedCount} مستخدم)`);
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
            <Send className="size-4 text-accent" strokeWidth={1.5} />
            إشعار جماعي
          </DialogTitle>
          <DialogDescription>
            إرسال إشعار إلى {selectedCount} مستخدم محدّد
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="bn-title">العنوان</Label>
            <Input
              id="bn-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bn-message">الرسالة</Label>
            <Textarea
              id="bn-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSend} disabled={submitting}>
            {submitting ? "جارٍ..." : "إرسال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

