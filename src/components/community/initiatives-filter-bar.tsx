"use client";

// ===================================================================
//  initiatives-filter-bar.tsx — فلترة المبادرات
//  - فلتر بالفئة
//  - فلتر بالحالة
//  - نافذة "اقترح مبادرة" (Sheet مع نموذج إنشاء)
// ===================================================================

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Filter, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SheetDescription,
} from "@/components/ui/sheet";

interface InitiativesFilterBarProps {
  categories: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
  activeCategory: string;
  activeStatus: string;
  total: number;
  filteredCount: number;
  showNew: boolean;
}

export function InitiativesFilterBar({
  categories,
  statuses,
  activeCategory,
  activeStatus,
  total,
  filteredCount,
  showNew,
}: InitiativesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [newOpen, setNewOpen] = React.useState(showNew);

  React.useEffect(() => {
    setNewOpen(showNew);
  }, [showNew]);

  function updateUrl(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value !== "ALL") sp.set(key, value);
    else sp.delete(key);
    sp.delete("new");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function closeNew() {
    setNewOpen(false);
    const sp = new URLSearchParams(params.toString());
    sp.delete("new");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3.5" />
            الفئة:
          </span>
          <Select
            value={activeCategory}
            onValueChange={(v) => updateUrl("category", v)}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground flex items-center gap-1">
            الحالة:
          </span>
          <Select
            value={activeStatus}
            onValueChange={(v) => updateUrl("status", v)}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filteredCount} / {total}
          </span>
          <Button
            type="button"
            size="sm"
            className="h-10 gap-1.5"
            onClick={() => setNewOpen(true)}
          >
            <Plus className="size-4" />
            <span>اقترح مبادرة</span>
          </Button>
        </div>
      </div>

      <NewInitiativeSheet
        open={newOpen}
        onOpenChange={(o) => {
          if (!o) closeNew();
          else setNewOpen(true);
        }}
      />
    </div>
  );
}

// ===================================================================
//  Sheet — اقتراح مبادرة جديدة
// ===================================================================

const CATEGORIES = [
  { value: "EDUCATION", label: "تعليم 📚" },
  { value: "HEALTH", label: "صحة 🩺" },
  { value: "ENVIRONMENT", label: "بيئة 🌱" },
  { value: "CULTURE", label: "ثقافة 🎭" },
  { value: "SOCIAL", label: "اجتماعي 🤝" },
  { value: "INFRASTRUCTURE", label: "بنية تحتية 🏗️" },
];

function NewInitiativeSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("EDUCATION");
  const [budget, setBudget] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("العنوان والوصف مطلوبان");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title,
        description,
        category,
      };
      const b = parseFloat(budget);
      if (!isNaN(b) && b > 0) body.budget = b;
      if (targetDate) body.targetDate = targetDate;

      const res = await fetch("/api/community/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "فشل إنشاء المبادرة");
      }
      toast.success("تم نشر المبادرة! تم تسجيل صوتك تلقائياً");
      router.push(`/community/initiatives/${data.initiative.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-y-auto">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-start">اقترح مبادرة</SheetTitle>
          <SheetDescription className="text-start text-xs">
            صف فكرتك بوضوح — كل مبادرة تخضع لمراجعة الإدارة قبل التمرير
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-4 sm:p-6 flex-1"
        >
          <div className="space-y-2">
            <Label htmlFor="i-title" className="text-sm">
              عنوان المبادرة *
            </Label>
            <Input
              id="i-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حملة تنظيف الحديقة العمومية"
              className="h-11"
              maxLength={200}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {title.length}/200 حرف
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="i-category" className="text-sm">
              الفئة *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="i-category" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="i-description" className="text-sm">
              الوصف *
            </Label>
            <Textarea
              id="i-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح الفكرة، الأهداف، والخطوات..."
              className="min-h-[180px] resize-y"
              maxLength={5000}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {description.length}/5000 حرف
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="i-budget" className="text-sm">
                الميزانية المقترحة (اختياري)
              </Label>
              <Input
                id="i-budget"
                type="number"
                min="0"
                step="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5000"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="i-targetDate" className="text-sm">
                الموعد المقترح (اختياري)
              </Label>
              <Input
                id="i-targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              <X className="size-4" />
              <span>إلغاء</span>
            </Button>
            <Button
              type="submit"
              size="lg"
              className="h-11 flex-1 gap-2"
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>جارٍ النشر...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>نشر المبادرة</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
