"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Building2, Copy, Eye, EyeOff } from "lucide-react";

interface AccountInfoData {
  id: string; bankName: string | null; accountHolder: string | null; rib: string | null;
  iban: string | null; swift: string | null; paypalEmail: string | null;
  cashplusNumber: string | null; inwiMoney: string | null; orangeMoney: string | null;
  customNote: string | null; isVisible: boolean;
}

export function FundAccountClient({ initial }: { initial: AccountInfoData }) {
  const [a, setA] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/fund/account-info", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      if (!r.ok) throw new Error("فشل");
      toast.success("تم حفظ معلومات الحساب");
    } catch (e) { toast.error(e instanceof Error ? e.message : "فشل"); }
    finally { setSaving(false); }
  };
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />معلومات الحساب البنكي</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setA({ ...a, isVisible: !a.isVisible })} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${a.isVisible ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"}`}>
            {a.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {a.isVisible ? "مرئي للعموم" : "مخفي"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم البنك" value={a.bankName ?? ""} onChange={(v) => setA({ ...a, bankName: v })} />
          <Field label="صاحب الحساب" value={a.accountHolder ?? ""} onChange={(v) => setA({ ...a, accountHolder: v })} />
          <Field label="RIB (20 رقم)" value={a.rib ?? ""} onChange={(v) => setA({ ...a, rib: v })} copyable />
          <Field label="IBAN" value={a.iban ?? ""} onChange={(v) => setA({ ...a, iban: v })} />
          <Field label="SWIFT/BIC" value={a.swift ?? ""} onChange={(v) => setA({ ...a, swift: v })} />
          <Field label="PayPal Email" value={a.paypalEmail ?? ""} onChange={(v) => setA({ ...a, paypalEmail: v })} />
          <Field label="CashPlus / Wafacash" value={a.cashplusNumber ?? ""} onChange={(v) => setA({ ...a, cashplusNumber: v })} />
          <Field label="Inwi Money" value={a.inwiMoney ?? ""} onChange={(v) => setA({ ...a, inwiMoney: v })} />
          <Field label="Orange Money" value={a.orangeMoney ?? ""} onChange={(v) => setA({ ...a, orangeMoney: v })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">ملاحظة مخصّصة</Label>
          <Input value={a.customNote ?? ""} onChange={(e) => setA({ ...a, customNote: e.target.value })} className="h-9" placeholder="ملاحظة تظهر مع معلومات الحساب" />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="h-10"><Save className="size-4" />{saving ? "..." : "حفظ"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
function Field({ label, value, onChange, copyable }: { label: string; value: string; onChange: (v: string) => void; copyable?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center justify-between">
        {label}
        {copyable && value && <button type="button" onClick={() => { navigator.clipboard.writeText(value); toast.success("تم النسخ"); }} className="text-primary"><Copy className="size-3" /></button>}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm tabular-nums" />
    </div>
  );
}
