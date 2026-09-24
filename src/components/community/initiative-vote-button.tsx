"use client";

// ===================================================================
//  initiative-vote-button.tsx — زر التصويت على مبادرة
//  - POST /api/community/initiatives/[id]/vote
//  - تبديل التصويت/الإلغاء
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, Loader2, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InitiativeVoteButtonProps {
  initiativeId: string;
  initialVotes: number;
  initialSupporters: number;
  hasVoted: boolean;
  disabled?: boolean;
  variant?: "default" | "compact";
}

export function InitiativeVoteButton({
  initiativeId,
  initialVotes,
  initialSupporters,
  hasVoted: initialHasVoted,
  disabled = false,
  variant = "default",
}: InitiativeVoteButtonProps) {
  const [votes, setVotes] = React.useState(initialVotes);
  const [supporters, setSupporters] = React.useState(initialSupporters);
  const [hasVoted, setHasVoted] = React.useState(initialHasVoted);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleVote() {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/community/initiatives/${initiativeId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "فشل التصويت");
      }
      if (data.action === "added") {
        setVotes(votes + 1);
        setSupporters(supporters + 1);
        setHasVoted(true);
        toast.success("تم تسجيل صوتك");
      } else {
        setVotes(Math.max(0, votes - 1));
        setSupporters(Math.max(0, supporters - 1));
        setHasVoted(false);
        toast.info("تم إلغاء صوتك");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={disabled || submitting}
        aria-pressed={hasVoted}
        className={cn(
          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors border",
          hasVoted
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-muted/60"
        )}
      >
        {submitting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : hasVoted ? (
          <ThumbsDown className="size-3.5" />
        ) : (
          <ThumbsUp className="size-3.5" />
        )}
        <span>{hasVoted ? "إلغاء" : "تصويت"}</span>
        <span className="font-bold">{votes}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="flex-1"
      >
        <Button
          type="button"
          onClick={handleVote}
          disabled={disabled || submitting}
          variant={hasVoted ? "default" : "outline"}
          className={cn(
            "h-11 w-full gap-2",
            hasVoted && "bg-primary text-primary-foreground"
          )}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : hasVoted ? (
            <ThumbsDown className="size-4" />
          ) : (
            <ThumbsUp className="size-4" />
          )}
          <span>{hasVoted ? "إلغاء الصوت" : "ادعم المبادرة"}</span>
          <Badge
            count={votes}
            hasVoted={hasVoted}
          />
        </Button>
      </motion.div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <UsersIcon className="size-3.5" />
        <span>{supporters} داعم</span>
      </div>
    </div>
  );
}

function Badge({ count, hasVoted }: { count: number; hasVoted: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold ms-1",
        hasVoted
          ? "bg-primary-foreground/20 text-primary-foreground"
          : "bg-primary/15 text-primary"
      )}
    >
      {count}
    </span>
  );
}
