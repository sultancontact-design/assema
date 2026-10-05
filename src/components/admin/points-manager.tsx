"use client";

// ===================================================================
//  PointsManager v62.0 — standalone admin component
//  Tremor-styled, uses 4 points APIs (add/remove/purchase/refund)
//  Can be embedded on /admin/dashboard or /admin/users/manage
// ===================================================================

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  ShoppingCart,
  RotateCcw,
  Coins,
  Loader2,
} from "lucide-react";

interface PointsManagerProps {
  userId: string;
  userName?: string;
  currentPoints?: number;
  onUpdated?: (newBalance: number) => void;
}

type Mode = "add" | "remove" | "purchase" | "refund";

export function PointsManager({
  userId,
  userName,
  currentPoints = 0,
  onUpdated,
}: PointsManagerProps) {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [pricePaid, setPricePaid] = React.useState("");
  const [method, setMethod] = React.useState("CASH");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [balance, setBalance] = React.useState(currentPoints);

  React.useEffect(() => {
    setBalance(currentPoints);
  }, [currentPoints]);

  const reset = () => {
    setMode(null);
    setAmount("");
    setReason("");
    setPricePaid("");
    setMethod("CASH");
    setRefundAmount("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        amount: parseInt(amount, 10),
      };
      if (mode === "add" || mode === "remove") {
        body.reason = reason || `إدارة يدوية (${mode})`;
      }
      if (mode === "purchase") {
        body.pricePaid = parseFloat(pricePaid);
        body.method = method;
        if (reason) body.note = reason;
      }
      if (mode === "refund") {
        body.reason = reason;
        body.refundAmount = parseFloat(refundAmount || "0");
      }

      const res = await fetch(
        `/api/admin/users/manage/${userId}/points/${mode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل");
        return;
      }
      const newBalance = data.newBalance ?? balance;
      setBalance(newBalance);
      onUpdated?.(newBalance);
      toast.success(
        `${mode === "add" ? "أُضيفت" : mode === "remove" ? "خُصمت" : mode === "purchase" ? "بِيعت" : "استُرجعت"} ${data.added ?? data.removed ?? data.amount ?? data.refunded} Karma. الرصيد: ${newBalance}`
      );
      reset();
    } catch {
      toast.error("فشل الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="card-2026">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Coins className="size-4 text-amber-600" />
            إدارة Karma
          </span>
          {userName && (
            <Badge variant="outline" className="text-[10px] gap-1 text-amber-700 border-amber-300 bg-amber-50">
              {userName}: {balance} Karma
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Mode buttons */}
        <div className="grid grid-cols-4 gap-1">
          <ModeButton
            active={mode === "add"}
            onClick={() => setMode(mode === "add" ? null : "add")}
            icon={Plus}
            label="إضافة"
            color="emerald"
          />
          <ModeButton
            active={mode === "remove"}
            onClick={() => setMode(mode === "remove" ? null : "remove")}
            icon={Minus}
            label="خصم"
            color="rose"
          />
          <ModeButton
            active={mode === "purchase"}
            onClick={() => setMode(mode === "purchase" ? null : "purchase")}
            icon={ShoppingCart}
            label="شراء"
            color="violet"
          />
          <ModeButton
            active={mode === "refund"}
            onClick={() => setMode(mode === "refund" ? null : "refund")}
            icon={RotateCcw}
            label="استرداد"
            color="amber"
          />
        </div>

        {/* Form (shown when mode is selected) */}
        {mode && (
          <form onSubmit={submit} className="space-y-3 p-3 rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="pm-amount">عدد النقاط *</Label>
              <Input
                id="pm-amount"
                type="number"
                min="1"
                max="1000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11"
                required
                dir="ltr"
              />
            </div>
            {mode === "purchase" && (
              <>
                <div>
                  <Label htmlFor="pm-price">السعر بالدرهم *</Label>
                  <Input
                    id="pm-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricePaid}
                    onChange={(e) => setPricePaid(e.target.value)}
                    className="h-11"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="pm-method">طريقة الدفع</Label>
                  <select
                    id="pm-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-11 rounded-md border px-3 bg-background"
                  >
                    <option value="CASH">نقداً</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CMI">CMI (بطاقة)</option>
                  </select>
                </div>
              </>
            )}
            {mode === "refund" && (
              <div>
                <Label htmlFor="pm-refund">مبلغ الاسترداد (درهم)</Label>
                <Input
                  id="pm-refund"
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>
            )}
            <div>
              <Label htmlFor="pm-reason">السبب / ملاحظة</Label>
              <Textarea
                id="pm-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="مثال: مكافأة تفاعل، تعويض..."
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={reset} className="flex-1 h-11">
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-11">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "تأكيد"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: "emerald" | "rose" | "violet" | "amber";
}) {
  const colors = {
    emerald: "text-emerald-700 border-emerald-300 bg-emerald-50",
    rose: "text-rose-700 border-rose-300 bg-rose-50",
    violet: "text-violet-700 border-violet-300 bg-violet-50",
    amber: "text-amber-700 border-amber-300 bg-amber-50",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all min-h-12 text-xs font-medium ${
        active
          ? `${colors[color]} border-2`
          : "text-muted-foreground border-border hover:bg-muted/40 border-1"
      }`}
      aria-pressed={active}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export default PointsManager;
