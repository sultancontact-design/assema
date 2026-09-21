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
}

interface UsersTableProps {
  users: AdminUserRow[];
  currentUserRole: Role;
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

export function UsersTable({ users, currentUserRole }: UsersTableProps) {
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

  return (
    <div className="space-y-4">
      {/* الفلاتر */}
      <UsersFilters
        search={search}
        onSearch={setSearch}
        role={role}
        onRoleChange={setRole}
        status={status}
        onStatusChange={setStatus}
        resultCount={filtered.length}
      />

      {/* الجدول */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
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
              <TableHead className="text-start text-xs text-muted-foreground">
                الدور
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الحالة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                التسجيل
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                    <UsersIcon className="size-6 text-muted-foreground/50" strokeWidth={1.5} />
                    <p>لا توجد مستخدمون مطابقون للفلاتر المحدّدة</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((u) => (
                <TableRow key={u.id} className="text-sm">
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
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateArabic(u.createdAt)}
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
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setViewUser(u)}>
                          <Eye className="size-4" strokeWidth={1.5} />
                          <span>عرض</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditUser(u)}>
                          <Pencil className="size-4" strokeWidth={1.5} />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        {canManageRoles && (
                          <DropdownMenuItem onSelect={() => setRoleUser(u)}>
                            <ShieldQuestion className="size-4" strokeWidth={1.5} />
                            <span>تغيير الدور</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setToggleUser(u)}>
                          <Power className="size-4" strokeWidth={1.5} />
                          <span>
                            {u.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                          </span>
                        </DropdownMenuItem>
                        {canManageRoles && (
                          <DropdownMenuItem
                            onSelect={() => setDeleteUser(u)}
                            variant="destructive"
                          >
                            <Trash2 className="size-4" strokeWidth={1.5} />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
              معكوس. 
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

