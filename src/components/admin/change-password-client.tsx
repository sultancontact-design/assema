"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";

// ===================================================================
//  ChangePasswordClient v37-section6 — تغيير كلمة المرور
//  - كلمة مرور حالية + جديدة + تأكيد
//  - مؤشر قوة كلمة المرور (4 مستويات)
//  - تحقق: 12+ حرف، حرف كبير، رقم، رمز
//  - POST /api/admin/settings/security/password
// ===================================================================

export function ChangePasswordClient() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // قوة كلمة المرور
  const strength = React.useMemo(() => {
    let score = 0;
    if (next.length >= 12) score++;
    if (/[A-Z]/.test(next)) score++;
    if (/[0-9]/.test(next)) score++;
    if (/[^a-zA-Z0-9]/.test(next)) score++;
    return score;
  }, [next]);

  const strengthLabel = ["ضعيفة جداً", "ضعيفة", "متوسطة", "جيدة", "قوية"][strength];
  const strengthColor = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-secondary", "bg-secondary"][strength];
  const strengthWidth = ["12%", "25%", "50%", "75%", "100%"][strength];

  // التحقق
  const validations = [
    { ok: next.length >= 12, label: "12 حرف على الأقل" },
    { ok: /[A-Z]/.test(next), label: "حرف كبير" },
    { ok: /[0-9]/.test(next), label: "رقم" },
    { ok: /[^a-zA-Z0-9]/.test(next), label: "رمز خاص" },
  ];
  const allValid = validations.every((v) => v.ok);
  const matches = next === confirm && next.length > 0;
  const canSubmit = current.length > 0 && allValid && matches && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/settings/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل التحديث");
      toast.success("تم تحديث كلمة المرور بنجاح");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          تغيير كلمة المرور
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* كلمة المرور الحالية */}
          <div className="space-y-1.5">
            <Label htmlFor="current">كلمة المرور الحالية</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
              <Input
                id="current"
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••••••"
                className="ps-9 pe-10 h-11"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? "إخفاء" : "إظهار"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div className="space-y-1.5">
            <Label htmlFor="new">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
              <Input
                id="new"
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="••••••••••••"
                className="ps-9 pe-10 h-11"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label={showNext ? "إخفاء" : "إظهار"}
              >
                {showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {/* مؤشر القوة */}
            {next.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">القوة:</span>
                  <span className="font-medium">{strengthLabel}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: strengthWidth }} />
                </div>
              </div>
            )}
            {/* قائمة التحقق */}
            {next.length > 0 && (
              <ul className="grid grid-cols-2 gap-1 text-xs">
                {validations.map((v, i) => (
                  <li key={i} className={`flex items-center gap-1 ${v.ok ? "text-secondary" : "text-muted-foreground"}`}>
                    <span className={`size-1.5 rounded-full ${v.ok ? "bg-secondary" : "bg-muted-foreground/40"}`} />
                    {v.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••••"
                className="ps-9 pe-10 h-11"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "إخفاء" : "إظهار"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {confirm.length > 0 && !matches && (
              <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
            )}
          </div>

          <Button type="submit" disabled={!canSubmit} className="w-full h-11">
            <ShieldCheck className="size-4" />
            {submitting ? "جاري التحديث..." : "تحديث كلمة المرور"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ChangePasswordClient;
