"use client";

// ===================================================================
//  initiative-status-controls.tsx — أزرار تغيير حالة المبادرة (للأدمن)
//  PATCH /api/community/initiatives/[id]/status
// ===================================================================

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { INITIATIVE_STATUSES } from "@/lib/constants";

interface Props {
  initiativeId: string;
  currentStatus: string;
}

export function InitiativeStatusControls({
  initiativeId,
  currentStatus,
}: Props) {
  const [status, setStatus] = React.useState(currentStatus);
  const [submitting, setSubmitting] = React.useState(false);

  async function apply(newStatus: string) {
    if (newStatus === status || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/community/initiatives/${initiativeId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "فشل التحديث");
      }
      setStatus(newStatus);
      toast.success("تم تحديث حالة المبادرة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {INITIATIVE_STATUSES.map((s) => {
          const active = status === s.value;
          return (
            <Button
              key={s.value}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-10 text-xs",
                active && "bg-primary text-primary-foreground"
              )}
              onClick={() => void apply(s.value)}
              disabled={submitting}
            >
              {submitting && active ? (
                <Loader2 className="size-3.5 animate-spin me-1" />
              ) : null}
              <span>{s.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">
        الحالة الحالية: <strong className="text-foreground">{INITIATIVE_STATUSES.find((s) => s.value === status)?.label}</strong>
      </p>
    </div>
  );
}
