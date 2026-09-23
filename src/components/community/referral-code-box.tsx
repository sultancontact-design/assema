"use client";

// ===================================================================
//  ReferralCodeBox — عرض رمز الإحالة + زر نسخ + إعادة توليد
// ===================================================================

import * as React from "react";
import { toast } from "sonner";
import { Copy, Check, RefreshCw, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralCodeBoxProps {
  code: string;
}

export function ReferralCodeBox({ code }: ReferralCodeBoxProps) {
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("تم نسخ رمز الإحالة", {
        description: "الصق الرمز في أي محادثة وشاركه مع من تريد",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر نسخ الرمز", {
        description: "جرّب تحديده ونسخه يدوياً",
      });
    }
  }

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/referral", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "فشل التحديث");
      }
      toast.success("تم تحديث رمز الإحالة", {
        description: "إن كان لديك رمز سابق، يبقى هو الحالي",
      });
      // إعادة تحميل الصفحة لإظهار البيانات الجديدة
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error("تعذّر التحديث", { description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="warm-shadow border-primary/30 bg-primary/5">
      <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
        <span className="grid place-items-center size-14 rounded-2xl bg-primary/15 text-primary mb-4">
          <Ticket className="size-7" />
        </span>
        <p className="text-sm text-muted-foreground mb-2">رمز الإحالة الخاص بك</p>
        <code
          dir="ltr"
          className="font-mono text-3xl sm:text-5xl font-extrabold tracking-[0.2em] text-foreground bg-card border-2 border-dashed border-primary/30 rounded-xl px-6 py-3 mb-4"
        >
          {code}
        </code>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            size="lg"
            className="h-12 gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>نسخ الرمز</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 gap-2"
            onClick={handleRegenerate}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "جارٍ التحديث..." : "تحديث الرمز"}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          أرسل هذا الرمز لأصدقائك. كل صديق يُسجّل به يمنحك{" "}
          <strong className="text-primary">50 نقطة</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
