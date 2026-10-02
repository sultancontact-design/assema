// ===================================================================
//  /home/z/my-project/src/components/store/purchase-button.tsx
//  زر شراء موحّد مع state machine كامل
//  - disabled: رصيد غير كافٍ
//  - idle: زر شراء عادي
//  - purchasing: spinner + نص
//  - success: ✓ تم الشراء (2s) → idle
//  - error: ❌ فشل (3s) → idle (مع toast)
// ===================================================================

'use client';

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, Loader2, Check, AlertCircle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PurchaseButtonProps {
  itemId: string;
  itemName: string;
  price: number;
  userPoints: number;
  onSuccess?: (newBalance: number) => void;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

type State = "idle" | "purchasing" | "success" | "error";

export function PurchaseButton({
  itemId,
  itemName,
  price,
  userPoints,
  onSuccess,
  variant = "default",
  className = "",
}: PurchaseButtonProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState(userPoints);

  // Sync when parent updates the prop
  useEffect(() => {
    setCurrentPoints(userPoints);
  }, [userPoints]);

  const canAfford = currentPoints >= price;

  const handlePurchase = useCallback(async () => {
    if (!canAfford || state === "purchasing") return;

    setState("purchasing");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/store/items/${itemId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل الشراء");
      }

      setState("success");
      const newBalance = data.remainingPoints ?? currentPoints - price;
      setCurrentPoints(newBalance);
      onSuccess?.(newBalance);

      // Broadcast event for other components
      window.dispatchEvent(
        new CustomEvent("points:updated", { detail: newBalance })
      );

      toast.success(`تم شراء "${itemName}" بنجاح`, {
        description: `تبقّى ${newBalance} نقطة`,
      });

      setTimeout(() => setState("idle"), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      setErrorMsg(msg);
      setState("error");
      toast.error("فشل الشراء", { description: msg });
      setTimeout(() => setState("idle"), 3000);
    }
  }, [canAfford, state, itemId, itemName, price, currentPoints, onSuccess]);

  // Cannot afford
  if (!canAfford) {
    const needed = price - currentPoints;
    return (
      <Button
        disabled
        size={variant === "compact" ? "sm" : "default"}
        className={`h-9 w-full cursor-not-allowed opacity-60 ${className}`}
        title={`تحتاج ${needed} نقطة إضافية`}
      >
        <Coins className="size-4 me-1" />
        تحتاج {needed} نقطة
      </Button>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <Button
        disabled
        size={variant === "compact" ? "sm" : "default"}
        className={`h-9 w-full bg-emerald-600 text-white hover:bg-emerald-600 ${className}`}
      >
        <Check className="size-4 me-1" />
        تم الشراء
      </Button>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <Button
        onClick={handlePurchase}
        size={variant === "compact" ? "sm" : "default"}
        variant="destructive"
        className={`h-9 w-full ${className}`}
      >
        <AlertCircle className="size-4 me-1" />
        أعد المحاولة
      </Button>
    );
  }

  // Purchasing state
  if (state === "purchasing") {
    return (
      <Button
        disabled
        size={variant === "compact" ? "sm" : "default"}
        className={`h-9 w-full ${className}`}
      >
        <Loader2 className="size-4 me-1 animate-spin" />
        جاري الشراء...
      </Button>
    );
  }

  // Idle state
  return (
    <Button
      onClick={handlePurchase}
      size={variant === "compact" ? "sm" : "default"}
      className={`h-9 w-full ${className}`}
    >
      <ShoppingCart className="size-4 me-1" />
      شراء
    </Button>
  );
}
