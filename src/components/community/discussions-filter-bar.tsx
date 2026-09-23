"use client";

// ===================================================================
//  شريط فلترة النقاشات — DiscussionsFilterBar
//  - فلتر فئة (all/general/question/suggestion/announcement)
//  - إحصاءات العدد الكلي + المفلتر
//  - نافذة "نقاش جديد" (Dialog مع نموذج إنشاء)
// ===================================================================

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

interface DiscussionsFilterBarProps {
  categories: { value: string; label: string }[];
  active: string;
  total: number;
  filteredCount: number;
  showNew: boolean;
}

export function DiscussionsFilterBar({
  categories,
  active,
  total,
  filteredCount,
  showNew,
}: DiscussionsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [newOpen, setNewOpen] = React.useState(showNew);

  React.useEffect(() => {
    setNewOpen(showNew);
  }, [showNew]);

  function changeCategory(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value !== "ALL") sp.set("category", value);
    else sp.delete("category");
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
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3.5" />
            الفئة:
          </span>
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => changeCategory(c.value)}
                aria-pressed={active === c.value}
                className={cn(
                  "min-h-9 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  active === c.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-muted/60"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
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
            <span>نقاش جديد</span>
          </Button>
        </div>
      </div>

      <NewDiscussionSheet
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
//  Sheet — إنشاء نقاش جديد
// ===================================================================

function NewDiscussionSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "فشل إنشاء النقاش");
      }
      toast.success("تم إنشاء النقاش بنجاح");
      // إعادة التوجيه لصفحة النقاش الجديد
      router.push(`/community/discussions/${data.discussion.id}`);
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
          <SheetTitle className="text-start">نقاش جديد</SheetTitle>
          <SheetDescription className="text-start text-xs">
            اطرح سؤالك أو شارك اقتراحاً أو إعلاناً مع جيرانك في الحي
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-4 sm:p-6 flex-1"
        >
          <div className="space-y-2">
            <Label htmlFor="d-title" className="text-sm">
              العنوان *
            </Label>
            <Input
              id="d-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: كيف نُحسّن نظافة الحي؟"
              className="h-11"
              maxLength={200}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {title.length}/200 حرف
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-category" className="text-sm">
              الفئة
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="d-category" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">نقاش عام</SelectItem>
                <SelectItem value="question">سؤال</SelectItem>
                <SelectItem value="suggestion">اقتراح</SelectItem>
                <SelectItem value="announcement">إعلان</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="d-content" className="text-sm">
              المحتوى *
            </Label>
            <Textarea
              id="d-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب تفاصيل النقاش هنا..."
              className="min-h-[200px] resize-y"
              maxLength={5000}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {content.length}/5000 حرف
            </p>
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
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>جارٍ النشر...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>نشر النقاش</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
