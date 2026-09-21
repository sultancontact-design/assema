"use client";

// ===================================================================
//  event-rating.tsx — مكوّن تقييم الفعالية
//  5 نجوم + textarea للتعليق + زر إرسال
//  بعد الإرسال: يُظهر رسالة شكر + يُخفي النموذج
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Send, CheckCircle2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export interface EventRatingProps {
  eventId: string;
  currentRating?: {
    rating: number;
    comment: string | null;
    anonymous: boolean;
  } | null;
  onSubmit?: () => void;
}

export function EventRating({ eventId, currentRating, onSubmit }: EventRatingProps) {
  const router = useRouter();
  const [rating, setRating] = React.useState<number>(currentRating?.rating ?? 0);
  const [hovered, setHovered] = React.useState<number>(0);
  const [comment, setComment] = React.useState<string>(currentRating?.comment ?? "");
  const [anonymous, setAnonymous] = React.useState<boolean>(currentRating?.anonymous ?? false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(!!currentRating);

  const display = hovered || rating;

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error("اختر عدد النجوم أولاً");
      return;
    }
    if (comment.length > 500) {
      toast.error("التعليق طويل جداً (الحد الأقصى 500 حرف)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/events/${eventId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null, anonymous }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "فشل إرسال التقييم");
      }
      toast.success("شكراً على تقييمك!");
      setDone(true);
      onSubmit?.();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  if (done && !currentRating) {
    // بعد الإرسال مباشرة: نُظهر بطاقة شكر
    return (
      <Card className="warm-shadow border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-6 text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto"
          >
            <CheckCircle2 className="size-12 mx-auto text-emerald-600" />
          </motion.div>
          <h3 className="font-heading text-xl font-bold text-foreground">
            شكراً على تقييمك!
          </h3>
          <p className="text-sm text-muted-foreground">
            تقييمك يُساعدنا على تحسين فعالياتنا القادمة بإذن الله.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="warm-shadow">
      <CardContent className="p-6 space-y-5">
        {/* العنوان */}
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Heart className="size-5 text-rose-500" />
            قيّم الفعالية
          </h3>
          <p className="text-sm text-muted-foreground">
            رأيك يُثري تجربتنا القادمة. اختر عدد النجوم واكتب تعليقك.
          </p>
        </div>

        {/* النجوم */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">التقييم</Label>
          <div
            className="flex items-center gap-1.5"
            role="radiogroup"
            aria-label="عدد النجوم"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= display;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onFocus={() => setHovered(star)}
                  onBlur={() => setHovered(0)}
                  aria-label={`${star} ${star === 1 ? "نجمة" : "نجوم"}`}
                  aria-checked={star === rating}
                  role="radio"
                  className="p-1 rounded-md hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Star
                    className={`size-8 transition-all ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-muted-foreground/50"
                    }`}
                  />
                </button>
              );
            })}
            {display > 0 && (
              <span className="ms-2 text-sm font-medium text-muted-foreground">
                {display === 1
                  ? "ضعيف"
                  : display === 2
                  ? "مقبول"
                  : display === 3
                  ? "جيّد"
                  : display === 4
                  ? "جيّد جداً"
                  : "ممتاز"}
              </span>
            )}
          </div>
        </div>

        {/* التعليق */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            تعليقك (اختياري)
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="اكتب ملاحظاتك هنا..."
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-end">
            {comment.length} / 500
          </p>
        </div>

        {/* مجهول */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="space-y-0.5">
            <Label htmlFor="anon" className="text-sm font-medium cursor-pointer">
              تقييم مجهول
            </Label>
            <p className="text-xs text-muted-foreground">
              عدم إظهار اسمك مع التعليق
            </p>
          </div>
          <Switch
            id="anon"
            checked={anonymous}
            onCheckedChange={setAnonymous}
            aria-label="تقييم مجهول"
          />
        </div>

        {/* زر الإرسال */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            size="lg"
            className="h-12 min-w-[180px]"
          >
            <Send className="size-4" />
            {submitting ? "جاري الإرسال..." : "أرسل التقييم"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
