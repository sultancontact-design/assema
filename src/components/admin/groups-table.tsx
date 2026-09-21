"use client";

// ===================================================================
//  GroupsTable — جدول إدارة المجموعات
//  - تبويبات: المجموعات الافتراضية / المجموعات المخصّصة
//  - إحصاءات لكل مجموعة: الأعضاء + الفعاليات النشطة + النشاط الأخير
//  - إجراءات: عرض / تعديل / تعيين رئيس / إدارة الأعضاء / حذف
// ===================================================================

import * as React from "react";
import Link from "next/link";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Users as UsersIcon,
  UserCog,
  Crown,
  Lock,
  Globe,
  CalendarDays,
  UserPlus,
  UserMinus,
  Shield,
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
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminGroupMember {
  id: string;          // GroupMember.id
  userId: string;
  fullName: string;
  role: string;        // leader/moderator/member
  isApproved: boolean;
  joinedAt: string;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string | null;
  isDefault: boolean;
  isActive: boolean;
  isPrivate: boolean;
  maxMembers: number | null;
  membersCount: number;
  leaderName: string | null;
  activeEventsCount: number;
  recentActivityCount: number;
}

export interface AdminGroupCandidate {
  id: string;
  fullName: string;
  role: Role;
}

interface GroupsTableProps {
  groups: AdminGroupRow[];
  members: Record<string, AdminGroupMember[]>;
  candidates: AdminGroupCandidate[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
}

// ===================================================================
//  شارات مساعدة
// ===================================================================

function PrivacyBadge({ isPrivate }: { isPrivate: boolean }) {
  return isPrivate ? (
    <Badge
      variant="outline"
      className="gap-1 border-amber-200 bg-amber-100 text-amber-700 text-xs"
    >
      <Lock className="size-3" strokeWidth={1.5} />
      <span>خاصة</span>
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 text-xs"
    >
      <Globe className="size-3" strokeWidth={1.5} />
      <span>عامة</span>
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-100 text-emerald-700 text-xs"
    >
      نشطة
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-100 text-slate-600 text-xs"
    >
      متوقفة
    </Badge>
  );
}

function MemberRoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    leader: "border-accent/30 bg-accent/10 text-accent",
    moderator: "border-blue-200 bg-blue-100 text-blue-700",
    member: "border-border bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    leader: "رئيس",
    moderator: "مشرف",
    member: "عضو",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[role] ?? styles.member)}>
      {labels[role] ?? role}
    </Badge>
  );
}

// ===================================================================
//  شريط الفلاتر
// ===================================================================

function GroupsFilters({
  search,
  onSearch,
  resultCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  resultCount: number;
}) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <div className="relative flex-1 sm:max-w-xs">
        <Search
          className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ابحث باسم المجموعة"
          className="h-10 ps-9"
          aria-label="بحث عن مجموعة"
        />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {resultCount} مجموعة
      </p>
    </div>
  );
}

// ===================================================================
//  نموذج الإنشاء/التعديل
// ===================================================================

interface GroupFormValues {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  maxMembers: string;
}

const CATEGORY_OPTIONS = [
  { value: "عائلي", label: "عائلي" },
  { value: "تنمية", label: "تنمية" },
  { value: "تعليم", label: "تعليم" },
  { value: "تراث", label: "تراث" },
  { value: "عام", label: "عام" },
];

function GroupFormDialog({
  mode,
  initial,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  initial: AdminGroupRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
  submitting: boolean;
}) {
  const [values, setValues] = React.useState<GroupFormValues>(() => ({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "عام",
    isPrivate: initial?.isPrivate ?? false,
    maxMembers: initial?.maxMembers ? String(initial.maxMembers) : "",
  }));

  React.useEffect(() => {
    if (open) {
      setValues({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        category: initial?.category ?? "عام",
        isPrivate: initial?.isPrivate ?? false,
        maxMembers: initial?.maxMembers ? String(initial.maxMembers) : "",
      });
    }
  }, [open, initial]);

  function set<K extends keyof GroupFormValues>(
    key: K,
    value: GroupFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("اسم المجموعة مطلوب");
      return;
    }
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "مجموعة جديدة" : "تعديل المجموعة"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "أنشئ مجموعة اهتمام جديدة في الحي."
              : "عدّل بيانات المجموعة."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="g-name">اسم المجموعة *</Label>
            <Input
              id="g-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-10"
              placeholder="مثال: مجموعة الشباب"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="g-desc">الوصف</Label>
            <Textarea
              id="g-desc"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[80px]"
              placeholder="نبذة عن المجموعة وأهدافها"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="g-cat">الفئة</Label>
            <Select
              value={values.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger id="g-cat" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="g-max">الحد الأقصى للأعضاء</Label>
            <Input
              id="g-max"
              type="number"
              min={1}
              value={values.maxMembers}
              onChange={(e) => set("maxMembers", e.target.value)}
              className="h-10"
              placeholder="اتركه فارغاً = غير محدود"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="g-private" className="text-sm font-medium">
                مجموعة خاصة
              </Label>
              <span className="text-xs text-muted-foreground">
                الانضمام يتطلّب موافقة الرئيس
              </span>
            </div>
            <Switch
              id="g-private"
              checked={values.isPrivate}
              onCheckedChange={(v) => set("isPrivate", v)}
            />
          </div>

          <DialogFooter>
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
//  نافذة تعيين رئيس المجموعة
// ===================================================================

function AssignLeaderDialog({
  group,
  candidates,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  group: AdminGroupRow | null;
  candidates: AdminGroupCandidate[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (userId: string) => Promise<void>;
  submitting: boolean;
}) {
  const [selected, setSelected] = React.useState<string>("");
  React.useEffect(() => {
    if (open) setSelected("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("اختر عضواً لتعيينه رئيساً");
      return;
    }
    await onSubmit(selected);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعيين رئيس المجموعة</DialogTitle>
          <DialogDescription>
            اختر عضواً لترؤس مجموعة «{group?.name}». سيتم نقل القيادة الحالية
            إلى عضو عادي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="leader-select">العضو الجديد</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="leader-select" className="h-10 w-full">
                <SelectValue placeholder="اختر عضواً..." />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    لا يوجد أعضاء
                  </SelectItem>
                ) : (
                  candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting || !selected}>
              {submitting ? "جارٍ التعيين..." : "تعيين"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  نافذة إدارة الأعضاء
// ===================================================================

function ManageMembersDialog({
  group,
  members,
  candidates,
  open,
  onOpenChange,
  onAdd,
  onRemove,
  submitting,
}: {
  group: AdminGroupRow | null;
  members: AdminGroupMember[];
  candidates: AdminGroupCandidate[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (userId: string) => Promise<void>;
  onRemove: (memberId: string, userId: string) => Promise<void>;
  submitting: boolean;
}) {
  const [addUserId, setAddUserId] = React.useState<string>("");

  React.useEffect(() => {
    if (open) setAddUserId("");
  }, [open]);

  const memberIds = React.useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );
  const availableCandidates = candidates.filter((c) => !memberIds.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إدارة أعضاء «{group?.name}»</DialogTitle>
          <DialogDescription>
            إضافة وإزالة الأعضاء. المجموعة بها {members.length} عضو حالياً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* إضافة عضو */}
          <div className="space-y-1.5">
            <Label htmlFor="add-member">إضافة عضو جديد</Label>
            <div className="flex items-center gap-2">
              <Select
                value={addUserId}
                onValueChange={setAddUserId}
                disabled={availableCandidates.length === 0}
              >
                <SelectTrigger id="add-member" className="h-10 flex-1">
                  <SelectValue
                    placeholder={
                      availableCandidates.length === 0
                        ? "كل الأعضاء مُضافون"
                        : "اختر عضواً..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableCandidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                className="h-10 w-10"
                disabled={!addUserId || submitting}
                onClick={() => addUserId && onAdd(addUserId)}
                aria-label="إضافة"
              >
                <UserPlus className="size-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          {/* قائمة الأعضاء */}
          <div className="space-y-2">
            <Label>الأعضاء الحاليون</Label>
            <div className="max-h-72 overflow-y-auto custom-scrollbar rounded-md border border-border">
              {members.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  لا يوجد أعضاء في هذه المجموعة
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">
                          {m.fullName}
                        </span>
                        <div className="flex items-center gap-2">
                          <MemberRoleBadge role={m.role} />
                          {!m.isApproved && (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]"
                            >
                              بانتظار الموافقة
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={submitting || m.role === "leader"}
                        onClick={() => onRemove(m.id, m.userId)}
                        aria-label={`إزالة ${m.fullName}`}
                        title={
                          m.role === "leader"
                            ? "لا يمكن إزالة الرئيس — انقل القيادة أولاً"
                            : "إزالة"
                        }
                      >
                        <UserMinus className="size-4" strokeWidth={1.5} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
//  المكوّن الرئيسي
// ===================================================================

export function GroupsTable({
  groups,
  members,
  candidates,
  canCreate,
  canEdit,
  canDelete,
  canManageMembers,
}: GroupsTableProps) {
  // التبويب
  const [tab, setTab] = React.useState<"default" | "custom">("default");
  // بحث
  const [search, setSearch] = React.useState("");

  // النوافذ
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editGroup, setEditGroup] = React.useState<AdminGroupRow | null>(null);
  const [leaderGroup, setLeaderGroup] = React.useState<AdminGroupRow | null>(
    null
  );
  const [membersGroup, setMembersGroup] = React.useState<AdminGroupRow | null>(
    null
  );
  const [deleteGroup, setDeleteGroup] = React.useState<AdminGroupRow | null>(
    null
  );
  const [submitting, setSubmitting] = React.useState(false);

  // تصفية البحث
  const filtered = React.useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.trim().toLowerCase();
    return groups.filter((g) =>
      `${g.name} ${g.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [groups, search]);

  // تصنيف التبويبات
  const defaultGroups = filtered.filter((g) => g.isDefault);
  const customGroups = filtered.filter((g) => !g.isDefault);

  const activeList = tab === "default" ? defaultGroups : customGroups;

  // ─────────── إجراءات الخادم ───────────

  async function handleCreate(values: GroupFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim() || null,
          category: values.category,
          isPrivate: values.isPrivate,
          maxMembers: values.maxMembers ? Number(values.maxMembers) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل إنشاء المجموعة");
        return;
      }
      toast.success("تم إنشاء المجموعة بنجاح");
      setCreateOpen(false);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(values: GroupFormValues) {
    if (!editGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/groups/${editGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim() || null,
          category: values.category,
          isPrivate: values.isPrivate,
          maxMembers: values.maxMembers ? Number(values.maxMembers) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تحديث المجموعة");
        return;
      }
      toast.success("تم تحديث المجموعة بنجاح");
      setEditGroup(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignLeader(userId: string) {
    if (!leaderGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${leaderGroup.id}/leader`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تعيين الرئيس");
        return;
      }
      toast.success("تم تعيين رئيس المجموعة بنجاح");
      setLeaderGroup(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddMember(userId: string) {
    if (!membersGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${membersGroup.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل إضافة العضو");
        return;
      }
      toast.success("تمت إضافة العضو");
      // إعادة تحميل لجلب قائمة الأعضاء المحدّثة
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(memberId: string, _userId: string) {
    if (!membersGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${membersGroup.id}/members/${memberId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل إزالة العضو");
        return;
      }
      toast.success("تمت إزالة العضو");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteGroup) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteGroup.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل حذف المجموعة");
        return;
      }
      toast.success("تم حذف المجموعة");
      setDeleteGroup(null);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────── عرض الجدول ───────────

  function renderTable(list: AdminGroupRow[]) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <UsersIcon
            className="size-6 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <p>لا توجد مجموعات مطابقة</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start text-xs text-muted-foreground">
                الاسم
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الفئة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الأعضاء
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الرئيس
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الفعاليات النشطة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                خصوصية
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
            {list.map((g) => (
              <TableRow key={g.id} className="text-sm">
                <TableCell className="max-w-[180px] font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {g.icon && <span aria-hidden="true">{g.icon}</span>}
                    <span className="truncate" title={g.name}>
                      {g.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {g.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <UsersIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-mono">
                      {g.membersCount}
                      {g.maxMembers ? ` / ${g.maxMembers}` : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-foreground">
                  {g.leaderName ?? (
                    <span className="text-muted-foreground">غير معيّن</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" strokeWidth={1.5} />
                    <span className="font-mono">{g.activeEventsCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PrivacyBadge isPrivate={g.isPrivate} />
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={g.isActive} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`إجراءات ${g.name}`}
                      >
                        <MoreVertical className="size-4" strokeWidth={1.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/community/groups/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Eye className="size-4" strokeWidth={1.5} />
                          <span>عرض</span>
                        </Link>
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onSelect={() => setEditGroup(g)}>
                          <Pencil className="size-4" strokeWidth={1.5} />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                      )}
                      {canManageMembers && (
                        <>
                          <DropdownMenuItem
                            onSelect={() => setLeaderGroup(g)}
                          >
                            <Crown className="size-4" strokeWidth={1.5} />
                            <span>تعيين رئيس</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setMembersGroup(g)}
                          >
                            <UserCog className="size-4" strokeWidth={1.5} />
                            <span>إدارة الأعضاء</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {canDelete && !g.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteGroup(g)}
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

  // أعضاء المجموعة المفتوحة لإدارة الأعضاء
  const currentMembers = membersGroup
    ? members[membersGroup.id] ?? []
    : [];

  return (
    <div className="space-y-4">
      {/* ترويسة + زر إنشاء */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GroupsFilters
          search={search}
          onSearch={setSearch}
          resultCount={activeList.length}
        />
        {canCreate && (
          <Button className="h-10 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" strokeWidth={1.5} />
            <span>مجموعة جديدة</span>
          </Button>
        )}
      </div>

      {/* التبويبات */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "default" | "custom")}
        className="w-full"
      >
        <TabsList className="flex w-fit">
          <TabsTrigger value="default" className="gap-1.5">
            <Shield className="size-3.5" strokeWidth={1.5} />
            <span>الافتراضية ({defaultGroups.length})</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5">
            <UsersIcon className="size-3.5" strokeWidth={1.5} />
            <span>المخصّصة ({customGroups.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(defaultGroups)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custom">
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              {renderTable(customGroups)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة الإنشاء */}
      {canCreate && (
        <GroupFormDialog
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
        <GroupFormDialog
          mode="edit"
          initial={editGroup}
          open={!!editGroup}
          onOpenChange={(v) => !v && setEditGroup(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}

      {/* نافذة تعيين الرئيس */}
      {canManageMembers && (
        <AssignLeaderDialog
          group={leaderGroup}
          candidates={candidates}
          open={!!leaderGroup}
          onOpenChange={(v) => !v && setLeaderGroup(null)}
          onSubmit={handleAssignLeader}
          submitting={submitting}
        />
      )}

      {/* نافذة إدارة الأعضاء */}
      {canManageMembers && (
        <ManageMembersDialog
          group={membersGroup}
          members={currentMembers}
          candidates={candidates}
          open={!!membersGroup}
          onOpenChange={(v) => !v && setMembersGroup(null)}
          onAdd={handleAddMember}
          onRemove={handleRemoveMember}
          submitting={submitting}
        />
      )}

      {/* تأكيد الحذف */}
      <AlertDialog
        open={!!deleteGroup}
        onOpenChange={(v) => !v && setDeleteGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المجموعة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مجموعة «{deleteGroup?.name}»؟ سيتم وضع علامة
              «محذوفة» على المجموعة، ولا يمكن للجمهور رؤيتها. سيُحتفظ بسجل
              العضويات لأغراض التدقيق.
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
