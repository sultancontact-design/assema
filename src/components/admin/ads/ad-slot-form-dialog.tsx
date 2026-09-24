"use client";

// ===================================================================
//  AdSlotFormDialog — نافذة إنشاء/تعديل مساحة إعلانية (AdSlot)
//  - 7 مواضع: HEADER, SIDEBAR_TOP, SIDEBAR_BOTTOM, IN_FEED, FOOTER, LEFT, RIGHT
//  - 4 أنواع: IMAGE, SCRIPT, HTML, ADSENSE
//  - الحقول: name, position, type, content, imageUrl, linkUrl, width, height
//    startDate, endDate, priority, isActive
//  - POST /api/admin/ads/slots (create) | PATCH /api/admin/ads/slots/[id] (edit)
// ===================================================================

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AdSlotRow {
  id: string;
  name: string;
  position: string;
  type: string;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  width: number | null;
  height: number | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  views: number;
  clicks: number;
  createdAt: string;
}

const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "HEADER", label: "الترويسة" },
  { value: "SIDEBAR_TOP", label: "الشريط الجانبي علوي" },
  { value: "SIDEBAR_BOTTOM", label: "الشريط الجانبي سفلي" },
  { value: "IN_FEED", label: "داخل التدفق" },
  { value: "FOOTER", label: "التذييل" },
  { value: "LEFT", label: "يسار" },
  { value: "RIGHT", label: "يمين" },
];

const TYPE_OPTIONS: {
  value: string;
  label: string;
  hint: string;
}[] = [
  { value: "IMAGE", label: "صورة", hint: "صورة بـlinkUrl اختياري" },
  { value: "SCRIPT", label: "سكربت", hint: "JavaScript خام يُحقن" },
  { value: "HTML", label: "HTML", hint: "HTML خام يُعرض كما هو" },
  { value: "ADSENSE", label: "AdSense", hint: "data-ad-slot في حقل content" },
];

interface AdSlotFormDialogProps {
  mode: "create" | "edit";
  slot?: AdSlotRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdSlotFormDialog({
  mode,
  slot,
  open,
  onOpenChange,
}: AdSlotFormDialogProps) {
  const isEdit = mode === "edit" && !!slot;

  const [name, setName] = React.useState("");
  const [position, setPosition] = React.useState("HEADER");
  const [type, setType] = React.useState("IMAGE");
  const [content, setContent] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [width, setWidth] = React.useState<number | "">("");
  const [height, setHeight] = React.useState<number | "">("");
  const [priority, setPriority] = React.useState<number | "">(0);
  const [isActive, setIsActive] = React.useState(true);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (isEdit && slot) {
      setName(slot.name);
      setPosition(slot.position);
      setType(slot.type);
      setContent(slot.content ?? "");
      setImageUrl(slot.imageUrl ?? "");
      setLinkUrl(slot.linkUrl ?? "");
      setWidth(slot.width ?? "");
      setHeight(slot.height ?? "");
      setPriority(slot.priority ?? 0);
      setIsActive(slot.isActive);
      setStartDate(slot.startDate ? slot.startDate.slice(0, 10) : "");
      setEndDate(slot.endDate ? slot.endDate.slice(0, 10) : "");
    } else {
      setName("");
      setPosition("HEADER");
      setType("IMAGE");
      setContent("");
      setImageUrl("");
      setLinkUrl("");
      setWidth("");
      setHeight("");
      setPriority(0);
      setIsActive(true);
      setStartDate("");
      setEndDate("");
    }
  }, [open, isEdit, slot]);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("اسم المساحة مطلوب");
      return;
    }
    if (type === "IMAGE" && !imageUrl.trim()) {
      toast.error("رابط الصورة مطلوب لنوع «صورة»");
      return;
    }
    if ((type === "SCRIPT" || type === "HTML" || type === "ADSENSE") && !content.trim()) {
      toast.error(
        type === "ADSENSE"
          ? "أدخل معرّف الفتحة (data-ad-slot) في حقل المحتوى"
          : "المحتوى مطلوب لهذا النوع"
      );
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    setSubmitting(true);
    try {
      const toISO = (d: string) => (d ? new Date(d + "T00:00:00.000Z").toISOString() : "");

      const payload = {
        name: name.trim(),
        position,
        type,
        content: content.trim() || null,
        imageUrl: imageUrl.trim() || null,
        linkUrl: linkUrl.trim() || null,
        width: width === "" ? null : Number(width),
        height: height === "" ? null : Number(height),
        priority: priority === "" ? 0 : Number(priority),
        isActive,
        startDate: toISO(startDate),
        endDate: toISO(endDate),
      };

      if (isEdit && slot) {
        const res = await fetch(`/api/admin/ads/slots/${slot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(json.error ?? "فشل تحديث المساحة");
          return;
        }
        toast.success("تم تحديث المساحة بنجاح");
      } else {
        const res = await fetch("/api/admin/ads/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(json.error ?? "فشل إنشاء المساحة");
          return;
        }
        toast.success("تم إنشاء المساحة الإعلانية");
      }
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !slot) return;
    if (!confirm(`حذف المساحة «${slot.name}»؟ لا يمكن التراجع.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ads/slots/${slot.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "فشل حذف المساحة");
        return;
      }
      toast.success("تم حذف المساحة");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto custom-scrollbar p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-start">
            {isEdit ? "تعديل مساحة إعلانية" : "إنشاء مساحة إعلانية جديدة"}
          </DialogTitle>
          <DialogDescription className="text-start">
            تنشئ مساحة إعلانية تُعرض تلقائياً في موضع محدّد عبر المنصة. المساحات
            ذات الأولوية الأعلى تُقدَّم أولاً ضمن نفس الموضع.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-4">
          {/* الاسم */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-name">اسم المساحة</Label>
            <Input
              id="slot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: بانر رمضان العلوي"
              maxLength={120}
            />
          </div>

          {/* الموضع + النوع */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="slot-position">الموضع</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="slot-position" className="h-11">
                  <SelectValue placeholder="اختر موضعاً" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — <code className="text-[10px]">{o.value}</code>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-type">النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="slot-type" className="h-11">
                  <SelectValue placeholder="اختر نوعاً" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex flex-col text-start">
                        <span>{o.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {o.hint}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* المحتوى */}
          {(type === "SCRIPT" || type === "HTML" || type === "ADSENSE") && (
            <div className="space-y-1.5">
              <Label htmlFor="slot-content">
                {type === "ADSENSE"
                  ? "معرّف الفتحة (data-ad-slot)"
                  : "المحتوى (HTML/JavaScript خام)"}
              </Label>
              <Textarea
                id="slot-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                dir="ltr"
                placeholder={
                  type === "ADSENSE"
                    ? "1234567890"
                    : "<script async src=\"…\"></script>"
                }
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {type === "ADSENSE"
                  ? "سيُستعمل مع publisherId من إعدادات AdSense."
                  : "يُحقن مباشرة — تأكّد من مصدر الموثوقية فقط."}
              </p>
            </div>
          )}

          {/* الصورة + الرابط (للنوع IMAGE) */}
          {type === "IMAGE" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slot-image">رابط الصورة</Label>
                <Input
                  id="slot-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…/banner.jpg"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot-link">رابط الوجهة (اختياري)</Label>
                <Input
                  id="slot-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.ma"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* الأبعاد + الأولوية */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="slot-width">العرض (px)</Label>
              <Input
                id="slot-width"
                type="number"
                value={width}
                onChange={(e) =>
                  setWidth(e.target.value === "" ? "" : Number(e.target.value))
                }
                min={0}
                step="1"
                dir="ltr"
                placeholder="اختياري"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-height">الارتفاع (px)</Label>
              <Input
                id="slot-height"
                type="number"
                value={height}
                onChange={(e) =>
                  setHeight(e.target.value === "" ? "" : Number(e.target.value))
                }
                min={0}
                step="1"
                dir="ltr"
                placeholder="اختياري"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-priority">الأولوية</Label>
              <Input
                id="slot-priority"
                type="number"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value === "" ? "" : Number(e.target.value))
                }
                min={-100}
                max={100}
                step="1"
                dir="ltr"
              />
            </div>
          </div>

          {/* التواريخ */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="slot-start">تاريخ البداية (اختياري)</Label>
              <Input
                id="slot-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-end">تاريخ النهاية (اختياري)</Label>
              <Input
                id="slot-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* الحالة */}
          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">المساحة نشطة</p>
              <p className="text-[11px] text-muted-foreground">
                عند التعطيل لن تُعرض المساحة حتى لو طابق الموضع.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter className="border-t border-border p-3 gap-2">
          {isEdit && (
            <Button
              variant="destructive"
              className="h-11"
              onClick={handleDelete}
              disabled={submitting}
            >
              حذف
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            className="h-11 gap-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "جارٍ الحفظ…"
              : isEdit
                ? "حفظ التعديلات"
                : "إنشاء المساحة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────── Badge helpers للعرض في الجدول ───────────
export function PositionBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
      {POSITION_OPTIONS.find((o) => o.value === value)?.label ?? value}
    </Badge>
  );
}

export function TypeBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    IMAGE: "border-accent/30 bg-accent/10 text-accent",
    SCRIPT: "border-secondary/30 bg-secondary/10 text-secondary",
    HTML: "border-foreground/20 bg-foreground/5 text-foreground",
    ADSENSE: "border-primary/30 bg-primary/10 text-primary",
  };
  const labels: Record<string, string> = {
    IMAGE: "صورة",
    SCRIPT: "سكربت",
    HTML: "HTML",
    ADSENSE: "AdSense",
  };
  return (
    <Badge variant="outline" className={cn(colors[value] ?? "")}>
      {labels[value] ?? value}
    </Badge>
  );
}

export default AdSlotFormDialog;
