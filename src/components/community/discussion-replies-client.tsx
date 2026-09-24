"use client";

// ===================================================================
//  discussion-replies-client.tsx — الردود المترابطة
//  - عرض الردود المتداخلة (parent/child)
//  - نموذج إضافة ردّ
//  - زر إعجاب على كل ردّ
//  - الردّ على ردّ (Reply-to-reply)
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Heart, CornerDownRight, Loader2, Reply } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { formatDateTimeArabic } from "@/lib/constants";

// ===================================================================
//  الأنواع
// ===================================================================

interface ReplyAuthor {
  id: string;
  fullName: string;
  avatar: string | null;
  profession: string | null;
}

interface ReplyData {
  id: string;
  content: string;
  parentId: string | null;
  likes: number;
  createdAt: string;
  author: ReplyAuthor;
}

interface DiscussionRepliesClientProps {
  discussionId: string;
  currentUserId: string;
  initialReplies: ReplyData[];
}

// ===================================================================
//  المكوّن
// ===================================================================

export function DiscussionRepliesClient({
  discussionId,
  currentUserId,
  initialReplies,
}: DiscussionRepliesClientProps) {
  const [replies, setReplies] = React.useState<ReplyData[]>(initialReplies);
  const [draft, setDraft] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [likedReplies, setLikedReplies] = React.useState<Set<string>>(
    new Set()
  );

  // بناء شجرة الردود
  const topLevel = replies.filter((r) => !r.parentId);
  const childMap = new Map<string, ReplyData[]>();
  for (const r of replies) {
    if (r.parentId) {
      const arr = childMap.get(r.parentId) ?? [];
      arr.push(r);
      childMap.set(r.parentId, arr);
    }
  }

  async function handleSubmitReply(parentId: string | null) {
    const content = draft.trim();
    if (!content) {
      toast.error("اكتب محتوى الردّ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/community/discussions/${discussionId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "فشل إضافة الردّ");
      }
      setReplies((prev) => [...prev, data.reply]);
      setDraft("");
      setReplyTo(null);
      toast.success("تم نشر الردّ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(replyId: string) {
    if (likedReplies.has(replyId)) {
      toast.info("لقد أعجبت بهذا الردّ بالفعل");
      return;
    }
    setLikedReplies((prev) => new Set(prev).add(replyId));
    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId ? { ...r, likes: r.likes + 1 } : r
      )
    );
    try {
      const res = await fetch(
        `/api/community/discussions/${discussionId}/replies`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyId }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        // revert on failure
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId ? { ...r, likes: Math.max(0, r.likes - 1) } : r
          )
        );
        setLikedReplies((prev) => {
          const next = new Set(prev);
          next.delete(replyId);
          return next;
        });
        throw new Error(data.error ?? "فشل الإعجاب");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
  }

  // بناء ردّ مكرّر لعنصر الـUI
  function renderReply(r: ReplyData, depth: number = 0): React.ReactNode {
    const initials = r.author.fullName
      .split(" ")
      .slice(0, 2)
      .map((s) => s.charAt(0))
      .join("");
    const isLiked = likedReplies.has(r.id);
    const children = childMap.get(r.id) ?? [];

    return (
      <motion.div
        key={r.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn("space-y-2", depth > 0 && "ms-4 ps-3 border-s-2 border-border")}
      >
        <div className="flex items-start gap-3">
          <Avatar className="size-9 shrink-0">
            {r.author.avatar ? (
              <AvatarImage src={r.author.avatar} alt={r.author.fullName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials || "م"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {r.author.fullName}
                </span>
                {r.author.id === currentUserId && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    أنت
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTimeArabic(r.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLike(r.id)}
                disabled={isLiked}
                aria-label="إعجاب"
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
                  isLiked
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/60"
                )}
              >
                <Heart className={cn("size-3.5", isLiked && "fill-current")} />
                <span>{r.likes}</span>
              </button>
            </div>
            <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {r.content}
            </p>
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === r.id ? null : r.id)}
              className="mt-1.5 text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Reply className="size-3" />
              <span>ردّ</span>
            </button>
          </div>
        </div>

        {/* نموذج الردّ على ردّ */}
        <AnimatePresence>
          {replyTo === r.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 ms-12"
            >
              <ReplyForm
                value={draft}
                onChange={setDraft}
                onSubmit={() => void handleSubmitReply(r.id)}
                onCancel={() => {
                  setReplyTo(null);
                  setDraft("");
                }}
                submitting={submitting}
                placeholder={`الردّ على ${r.author.fullName}...`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* الردود الأطفال */}
        {children.length > 0 && (
          <div className="mt-3 space-y-3">
            {children.map((child) => renderReply(child, depth + 1))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* نموذج الردّ الرئيسي */}
      <Card className="warm-shadow border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CornerDownRight className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-bold text-foreground">
              أضف ردّاً على النقاش
            </h3>
          </div>
          <ReplyForm
            value={draft}
            onChange={setDraft}
            onSubmit={() => void handleSubmitReply(null)}
            submitting={submitting}
            placeholder="شارك رأيك في هذا النقاش..."
            large
          />
        </CardContent>
      </Card>

      <ZelligeDivider variant="minimal" className="opacity-50" />

      {/* الردود */}
      {topLevel.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Reply className="size-6 mx-auto mb-2 opacity-60" />
          <p>لا توجد ردود بعد — كن أول من يردّ على هذا النقاش</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {topLevel.map((r) => renderReply(r, 0))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  نموذج ردّ قابل لإعادة الاستخدام
// ===================================================================

interface ReplyFormProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting: boolean;
  placeholder: string;
  large?: boolean;
}

function ReplyForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  placeholder,
  large = false,
}: ReplyFormProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "resize-y bg-background",
          large ? "min-h-[120px]" : "min-h-[80px]"
        )}
        maxLength={2000}
        disabled={submitting}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          {value.length}/2000 حرف
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={onCancel}
              disabled={submitting}
            >
              إلغاء
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-10 gap-1.5"
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span>نشر</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
