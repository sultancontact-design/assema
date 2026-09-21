"use client";

// ===================================================================
//  AdFormDialog — نافذة إنشاء/تعديل حملة إعلانية
//  - 5 باقات كراديو كاردز مع السعر
//  - 12 مكان كـmulti-select (checkboxes)
//  - startDate + endDate + amountPaid (محسوب من الباقة لكن قابل للتعديل)
//  - imageUrl + targetUrl (اختياريان)
//  - POST /api/admin/ads (create) | PATCH /api/admin/ads/[id] (edit)
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
import {
  Input,
} from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AD_PACKAGE_LABELS,
  AD_PLACEMENT_LABELS,
  formatMAD,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdPackage } from "@prisma/client";
import type { AdRow } from "@/lib/ads-utils";

// ===================================================================
//  الأنواع
// ===================================================================

interface AdFormDialogProps {
  mode: "create" | "edit";
  ad?: AdRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PACKAGE_KEYS = Object.keys(AD_PACKAGE_LABELS) as AdPackage[];
const PLACEMENT_ENTRIES = Object.entries(AD_PLACEMENT_LABELS);

// ===================================================================
//  مكوّن
// ===================================================================

export function AdFormDialog({ mode, ad, open, onOpenChange }: AdFormDialogProps) {
  const isEdit = mode === "edit" && !!ad;

  // الحالة
  const [title, setTitle] = React.useState("");
  const [advertiserName, setAdvertiserName] = React.useState("");
  const [advertiserEmail, setAdvertiserEmail] = React.useState("");
  const [advertiserPhone, setAdvertiserPhone] = React.useState("");
  const [pkg, setPkg] = React.useState<AdPackage>("BRONZE");
  const [placements, setPlacements] = React.useState<string[]>(["sidebar"]);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [amountPaid, setAmountPaid] = React.useState<number>(AD_PACKAGE_LABELS.BRONZE.price);
  const [imageUrl, setImageUrl] = React.useState("");
  const [targetUrl, setTargetUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // عند فتح نافذة التعديل — تعبئة الحقول من الحملة الموجودة
  React.useEffect(() => {
    if (!open) return;
    if (isEdit && ad) {
      setTitle(ad.title);
      setAdvertiserName(ad.advertiserName);
      setAdvertiserEmail(ad.advertiserEmail ?? "");
      setAdvertiserPhone(ad.advertiserPhone ?? "");
      setPkg(ad.package as AdPackage);
      setPlacements([ad.placement]);
      setStartDate(ad.startDate.slice(0, 10));
      setEndDate(ad.endDate.slice(0, 10));
      setAmountPaid(ad.amountPaid);
      setImageUrl(ad.imageUrl ?? "");
      setTargetUrl(ad.targetUrl ?? "");
    } else {
      // قيم افتراضية للحملة الجديدة
      setTitle("");
      setAdvertiserName("");
      setAdvertiserEmail("");
      setAdvertiserPhone("");
      setPkg("BRONZE");
      setPlacements(["sidebar"]);
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setStartDate(now.toISOString().slice(0, 10));
      setEndDate(nextMonth.toISOString().slice(0, 10));
      setAmountPaid(AD_PACKAGE_LABELS.BRONZE.price);
      setImageUrl("");
      setTargetUrl("");
    }
  }, [open, isEdit, ad]);

  // عند تغيير الباقة — تحديث المبلغ تلقائياً (إلا إذا كان التعديل اليدوي مفعّلاً)
  function onPkgChange(p: AdPackage) {
    setPkg(p);
    setAmountPaid(AD_PACKAGE_LABELS[p].price);
  }

  function togglePlacement(p: string) {
    setPlacements((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("عنوان الحملة مطلوب");
      return;
    }
    if (!advertiserName.trim()) {
      toast.error("اسم المعلن مطلوب");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("تاريخا البداية والنهاية مطلوبان");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }
    if (placements.length === 0) {
      toast.error("اختر مكاناً واحداً على الأقل");
      return;
    }

    setSubmitting(true);
    try {
      // نأخذ أول مكان فقط (نموذج Ad يدعم placement كنص وحيد)
      const placement = placements[0];
      const payload = {
        title: title.trim(),
        advertiserName: advertiserName.trim(),
        advertiserEmail: advertiserEmail.trim() || null,
        advertiserPhone: advertiserPhone.trim() || null,
        package: pkg,
        placement,
        startDate,
        endDate,
        amountPaid: Number(amountPaid),
        imageUrl: imageUrl.trim() || null,
        targetUrl: targetUrl.trim() || null,
      };

      if (isEdit && ad) {
        const res = await fetch(`/api/admin/ads/${ad.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "فشل تحديث الحملة");
          return;
        }
        toast.success("تم تحديث الحملة بنجاح");
      } else {
        const res = await fetch("/api/admin/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "PENDING" }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "فشل إنشاء الحملة");
          return;
        }
        toast.success("تم إنشاء الحملة — بانتظار الموافقة");
      }
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
            {isEdit ? "تعديل حملة" : "حملة إعلانية جديدة"}
          </DialogTitle>
          <DialogDescription className="text-start">
            املأ الحقول التالية لإنشاء حملة جديدة. ستظهر تلقائياً في قائمة الحملات.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-4">
          {/* عنوان الحملة */}
          <div className="space-y-1.5">
            <Label htmlFor="ad-title">عنوان الحملة</Label>
            <Input
              id="ad-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قافلة طبية رمضانية"
              maxLength={120}
            />
          </div>

          {/* المعلن */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ad-advertiser-name">اسم المعلن</Label>
              <Input
                id="ad-advertiser-name"
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
                placeholder="مطعم الدار…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-email">البريد (اختياري)</Label>
              <Input
                id="ad-email"
                type="email"
                value={advertiserEmail}
                onChange={(e) => setAdvertiserEmail(e.target.value)}
                placeholder="contact@example.ma"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-phone">الهاتف (اختياري)</Label>
              <Input
                id="ad-phone"
                value={advertiserPhone}
                onChange={(e) => setAdvertiserPhone(e.target.value)}
                placeholder="0612345678"
                dir="ltr"
              />
            </div>
          </div>

          {/* الباقات */}
          <div className="space-y-1.5">
            <Label>الباقة</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PACKAGE_KEYS.map((p) => {
                const meta = AD_PACKAGE_LABELS[p];
                const selected = pkg === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPkgChange(p)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border p-3 text-start transition-all",
                      selected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border bg-card hover:bg-muted/30"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        المدة: {meta.duration}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        selected
                          ? "border-accent/40 bg-accent text-background"
                          : "border-border bg-muted/50 text-foreground"
                      )}
                    >
                      {formatMAD(meta.price)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* الأماكن */}
          <div className="space-y-1.5">
            <Label>الأماكن (اختر واحداً على الأقل)</Label>
            <p className="text-[11px] text-muted-foreground">
              سيُستعمل أول مكان مُختار للحملة في النسخة الحالية.
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {PLACEMENT_ENTRIES.map(([key, label]) => {
                const selected = placements.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePlacement(key)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-2 text-start text-[12px] transition-all",
                      selected
                        ? "border-accent bg-accent/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full border",
                        selected
                          ? "border-accent bg-accent text-background"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selected && (
                        <span className="size-1.5 rounded-full bg-background" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex-1">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* التواريخ */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ad-start-date">تاريخ البداية</Label>
              <Input
                id="ad-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-end-date">تاريخ النهاية</Label>
              <Input
                id="ad-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* المبلغ المدفوع */}
          <div className="space-y-1.5">
            <Label htmlFor="ad-amount">المبلغ المدفوع (درهم)</Label>
            <Input
              id="ad-amount"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              min={0}
              step="0.01"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              محسوب تلقائياً من الباقة — قابل للتعديل اليدوي.
            </p>
          </div>

          {/* روابط إضافية */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ad-image-url">رابط الصورة (اختياري)</Label>
              <Input
                id="ad-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-target-url">رابط الوجهة (اختياري)</Label>
              <Input
                id="ad-target-url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://…"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border p-3">
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
            {submitting ? "جارٍ الحفظ…" : isEdit ? "حفظ التعديلات" : "إنشاء الحملة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
