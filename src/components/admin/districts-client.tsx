"use client";

// ===================================================================
//  DistrictsClient — جدول الأحياء + نافذة إنشاء/تعديل + نقل عضو + مقارنة
// ===================================================================

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Users,
  Users2,
  CalendarDays,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  ArrowRightLeft,
  Star,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatMAD,
  formatNumber,
  formatDateArabic,
} from "@/lib/constants";

// ===================================================================
//  الأنواع
// ===================================================================

export interface DistrictRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  description: string;
  boundarySvg: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  familiesCount: number;
  usersCount: number;
  eventsCount: number;
  groupsCount: number;
  adsCount: number;
  totalContributions: number;
  totalDisbursed: number;
  balance: number;
}

interface DistrictsClientProps {
  districts: DistrictRow[];
  allUsers: Array<{ id: string; fullName: string; email: string; districtId: string }>;
}

// ===================================================================
//  مساعد: توليد slug من اسم
// ===================================================================

function slugify(name: string): string {
  // للأسامي العربية: نُحوّل لأحرف لاتينية بسيطة + نطبّق slugify بسيط
  // للأسامي اللاتينية نُسلغ الإضافات + نستبدل المسافات بشرطات
  const map: Record<string, string> = {
    أ: "a", إ: "i", آ: "a", ا: "a", ب: "b", ت: "t", ث: "th",
    ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z",
    س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a",
    غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
    ه: "h", و: "w", ي: "y", ى: "a", ة: "a", ء: "",
    " ": "-", "_": "-",
  };
  let out = name.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  out = out.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return out || "district";
}

// ===================================================================
//  المُكوّن
// ===================================================================

export function DistrictsClient({ districts, allUsers }: DistrictsClientProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DistrictRow | null>(null);
  const [viewing, setViewing] = React.useState<DistrictRow | null>(null);
  const [movingUserFor, setMovingUserFor] = React.useState<DistrictRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  // نموذج الإنشاء/التعديل
  const [formName, setFormName] = React.useState("");
  const [formSlug, setFormSlug] = React.useState("");
  const [formSlugTouched, setFormSlugTouched] = React.useState(false);
  const [formCity, setFormCity] = React.useState("مراكش");
  const [formRegion, setFormRegion] = React.useState("مراكش آسفي");
  const [formDescription, setFormDescription] = React.useState("");
  const [formBoundarySvg, setFormBoundarySvg] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formIsDefault, setFormIsDefault] = React.useState(false);

  // نموذج نقل عضو
  const [moveUserId, setMoveUserId] = React.useState("");
  const [moveTargetDistrictId, setMoveTargetDistrictId] = React.useState("");

  // المقارنة
  const [compareA, setCompareA] = React.useState<string>(districts[0]?.id ?? "");
  const [compareB, setCompareB] = React.useState<string>(districts[1]?.id ?? districts[0]?.id ?? "");

  React.useEffect(() => {
    if (!formSlugTouched) {
      setFormSlug(slugify(formName));
    }
  }, [formName, formSlugTouched]);

  function openCreate() {
    setFormName("");
    setFormSlug("");
    setFormSlugTouched(false);
    setFormCity("مراكش");
    setFormRegion("مراكش آسفي");
    setFormDescription("");
    setFormBoundarySvg("");
    setFormIsActive(true);
    setFormIsDefault(false);
    setCreateOpen(true);
  }

  function openEdit(d: DistrictRow) {
    setFormName(d.name);
    setFormSlug(d.slug);
    setFormSlugTouched(true);
    setFormCity(d.city);
    setFormRegion(d.region);
    setFormDescription(d.description);
    setFormBoundarySvg(d.boundarySvg);
    setFormIsActive(d.isActive);
    setFormIsDefault(d.isDefault);
    setEditing(d);
  }

  function closeForm() {
    setCreateOpen(false);
    setEditing(null);
  }

  async function handleSubmit() {
    if (!formName.trim() || !formSlug.trim()) {
      toast.error("الاسم والـslug مطلوبان");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/districts/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim(),
            city: formCity.trim(),
            region: formRegion.trim(),
            description: formDescription.trim() || null,
            boundarySvg: formBoundarySvg.trim() || null,
            isActive: formIsActive,
            isDefault: formIsDefault,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "فشل التحديث");
          return;
        }
        toast.success("تم تحديث الحي");
      } else {
        const res = await fetch("/api/admin/districts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim(),
            city: formCity.trim(),
            region: formRegion.trim(),
            description: formDescription.trim() || null,
            boundarySvg: formBoundarySvg.trim() || null,
            isActive: formIsActive,
            isDefault: formIsDefault,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "فشل الإنشاء");
          return;
        }
        toast.success("تم إنشاء الحي بنجاح");
      }
      closeForm();
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveUser() {
    if (!movingUserFor) return;
    if (!moveUserId || !moveTargetDistrictId) {
      toast.error("يرجى اختيار العضو والحي الهدف");
      return;
    }
    if (moveTargetDistrictId === movingUserFor.id) {
      toast.error("العضو موجود بالفعل في هذا الحي");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/districts/move-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: moveUserId,
          targetDistrictId: moveTargetDistrictId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل نقل العضو");
        return;
      }
      toast.success("تم نقل العضو بنجاح");
      setMovingUserFor(null);
      setMoveUserId("");
      setMoveTargetDistrictId("");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  const districtA = districts.find((d) => d.id === compareA);
  const districtB = districts.find((d) => d.id === compareB);

  return (
    <div className="space-y-6">
      {/* أدوات */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {districts.length} حي · {formatNumber(districts.reduce((s, d) => s + d.usersCount, 0))} عضو إجمالي
        </p>
        <Button onClick={openCreate} className="h-11">
          <Plus className="size-4" strokeWidth={1.5} />
          <span>حي جديد</span>
        </Button>
      </div>

      {/* جدول الأحياء */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-accent" strokeWidth={1.5} />
            <span>قائمة الأحياء</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-start text-xs text-muted-foreground">الاسم</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">المدينة</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الأسر</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الأعضاء</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الرصيد</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الافتراضي</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الحالة</TableHead>
                  <TableHead className="text-start text-xs text-muted-foreground">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      لا توجد أحياء مسجّلة
                    </TableCell>
                  </TableRow>
                ) : (
                  districts.map((d) => (
                    <TableRow key={d.id} className="text-sm">
                      <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.city}</TableCell>
                      <TableCell className="text-foreground">{d.familiesCount}</TableCell>
                      <TableCell className="text-foreground">{d.usersCount}</TableCell>
                      <TableCell className="text-foreground">{formatMAD(d.balance)}</TableCell>
                      <TableCell>
                        {d.isDefault && (
                          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent text-[10px]">
                            <Star className="me-1 size-3" strokeWidth={1.5} />
                            افتراضي
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            d.isActive
                              ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                              : "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 text-[10px]"
                          }
                        >
                          {d.isActive ? "نشط" : "موقوف"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setViewing(d)}>
                              <Eye className="size-4" strokeWidth={1.5} />
                              <span>عرض التفاصيل</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEdit(d)}>
                              <Pencil className="size-4" strokeWidth={1.5} />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setMovingUserFor(d)}>
                              <ArrowRightLeft className="size-4" strokeWidth={1.5} />
                              <span>نقل عضو</span>
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

      {/* مقارنة بين حيين */}
      {districts.length >= 2 && (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="size-4 text-accent" strokeWidth={1.5} />
              <span>مقارنة بين حيين</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select value={compareA} onValueChange={setCompareA}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="الحي الأول" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareB} onValueChange={setCompareB}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="الحي الثاني" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {districtA && districtB && (
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-start text-xs text-muted-foreground">المؤشّر</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">
                        {districtA.name}
                      </TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">
                        {districtB.name}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: "عدد الأسر", a: districtA.familiesCount, b: districtB.familiesCount },
                      { label: "عدد الأعضاء", a: districtA.usersCount, b: districtB.usersCount },
                      { label: "الفعاليات", a: districtA.eventsCount, b: districtB.eventsCount },
                      { label: "المجموعات", a: districtA.groupsCount, b: districtB.groupsCount },
                      { label: "الإعلانات", a: districtA.adsCount, b: districtB.adsCount },
                      { label: "إجمالي المساهمات", a: districtA.totalContributions, b: districtB.totalContributions, format: "money" },
                      { label: "إجمالي الصرف", a: districtA.totalDisbursed, b: districtB.totalDisbursed, format: "money" },
                      { label: "الرصيد", a: districtA.balance, b: districtB.balance, format: "money" },
                    ].map((row) => (
                      <TableRow key={row.label} className="text-sm">
                        <TableCell className="text-muted-foreground">{row.label}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {row.format === "money" ? formatMAD(row.a) : formatNumber(row.a)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {row.format === "money" ? formatMAD(row.b) : formatNumber(row.b)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* نافذة الإنشاء/التعديل */}
      <Dialog open={createOpen || editing !== null} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل حي" : "حي جديد"}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات الحي. الـslug يُستعمل في الروابط ويجب أن يكون فريداً.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="d-name">اسم الحي</Label>
              <Input
                id="d-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: جليح"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-slug">المعرّف (slug)</Label>
              <Input
                id="d-slug"
                value={formSlug}
                onChange={(e) => {
                  setFormSlug(e.target.value);
                  setFormSlugTouched(true);
                }}
                placeholder="auto-generated"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-city">المدينة</Label>
              <Input
                id="d-city"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-region">المنطقة</Label>
              <Input
                id="d-region"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="d-desc">الوصف</Label>
              <Textarea
                id="d-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="وصف مختصر للحي"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="d-boundary">حدود الحي (SVG path)</Label>
              <Textarea
                id="d-boundary"
                value={formBoundarySvg}
                onChange={(e) => setFormBoundarySvg(e.target.value)}
                rows={3}
                placeholder="M 100 100 L 200 100 L 200 200 Z"
                dir="ltr"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                صيغة SVG path لرسم حدود الحي على الخريطة الحرارية
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-3">
              <div>
                <Label htmlFor="d-active" className="text-sm font-medium text-foreground">
                  الحي نشط
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  الأحياء غير النشطة لا تظهر في الواجهة العامة
                </p>
              </div>
              <Switch id="d-active" checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-3">
              <div>
                <Label htmlFor="d-default" className="text-sm font-medium text-foreground">
                  حي افتراضي
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  الحي الافتراضي يُستعمل عند تسجيل مستخدمين جدد بدون تحديد
                </p>
              </div>
              <Switch id="d-default" checked={formIsDefault} onCheckedChange={setFormIsDefault} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeForm} className="h-10">
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={busy} className="h-11">
              {busy ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إنشاء الحي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet لعرض التفاصيل */}
      <Sheet open={viewing !== null} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <SheetContent side="end" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="text-start">
              {viewing?.name ?? ""}
            </SheetTitle>
          </SheetHeader>
          {viewing && (
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                  {viewing.city}
                </Badge>
                <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                  {viewing.region}
                </Badge>
                {viewing.isDefault && (
                  <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                    <Star className="me-1 size-3" strokeWidth={1.5} />
                    افتراضي
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    viewing.isActive
                      ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                  }
                >
                  {viewing.isActive ? "نشط" : "موقوف"}
                </Badge>
              </div>

              {viewing.description && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">الوصف</p>
                  <p className="mt-1 text-sm text-foreground">{viewing.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Card className="border border-border bg-card p-0">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="grid size-8 place-items-center rounded-md bg-accent/10 text-accent">
                      <Users2 className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">الأسر</p>
                      <p className="font-heading text-base font-bold text-foreground">
                        {viewing.familiesCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-card p-0">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="grid size-8 place-items-center rounded-md bg-accent/10 text-accent">
                      <Users className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">الأعضاء</p>
                      <p className="font-heading text-base font-bold text-foreground">
                        {viewing.usersCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-card p-0">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="grid size-8 place-items-center rounded-md bg-accent/10 text-accent">
                      <CalendarDays className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">الفعاليات</p>
                      <p className="font-heading text-base font-bold text-foreground">
                        {viewing.eventsCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-card p-0">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="grid size-8 place-items-center rounded-md bg-accent/10 text-accent">
                      <MapPin className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">المجموعات</p>
                      <p className="font-heading text-base font-bold text-foreground">
                        {viewing.groupsCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">رصيد الحي</p>
                <p className="mt-1 font-heading text-lg font-bold text-foreground">
                  {formatMAD(viewing.balance)}
                </p>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>المساهمات: {formatMAD(viewing.totalContributions)}</span>
                  <span>الصرف: {formatMAD(viewing.totalDisbursed)}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-muted-foreground">تاريخ الإنشاء</p>
                <p className="mt-1 text-xs text-foreground">{formatDateArabic(viewing.createdAt)}</p>
              </div>

              {viewing.boundarySvg && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">حدود الحي (SVG)</p>
                  <pre className="mt-1 max-h-24 overflow-y-auto rounded-md bg-muted/50 p-2 text-[10px] text-muted-foreground" dir="ltr">
                    {viewing.boundarySvg}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* نافذة نقل عضو */}
      <Dialog open={movingUserFor !== null} onOpenChange={(o) => { if (!o) setMovingUserFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نقل عضو إلى حي آخر</DialogTitle>
            <DialogDescription>
              {movingUserFor && `من حي: ${movingUserFor.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>العضو</Label>
              <Select value={moveUserId} onValueChange={setMoveUserId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر عضواً" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => movingUserFor && u.districtId === movingUserFor.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName} — {u.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {movingUserFor && (
                <p className="text-[11px] text-muted-foreground">
                  يظهر هنا فقط أعضاء الحي "{movingUserFor.name}" — إذا لم يظهر أحد فهذا الحي لا يضمّ أعضاء حالياً.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>الحي الهدف</Label>
              <Select value={moveTargetDistrictId} onValueChange={setMoveTargetDistrictId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الحي الهدف" />
                </SelectTrigger>
                <SelectContent>
                  {districts
                    .filter((d) => !movingUserFor || d.id !== movingUserFor.id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.city})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
              <strong>ملاحظة:</strong> نقل العضو يُحدّث districtId وfamilyId (يُفرَّغ إن كانت العائلة لا تنتمي للحي الجديد).
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMovingUserFor(null)} className="h-10">
              إلغاء
            </Button>
            <Button onClick={handleMoveUser} disabled={busy} className="h-11">
              <ArrowRightLeft className="size-4" strokeWidth={1.5} />
              <span>{busy ? "جارٍ النقل..." : "نقل العضو"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
