"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Lock, Unlock, Eye, Receipt, Heart } from "lucide-react";

interface FundSettingsData {
  id: string; isOpen: boolean; minDonation: number; maxDonation: number;
  allowAnonymous: boolean; requireReceipt: boolean; publicTransparency: boolean; thankYouMessage: string | null;
}

export function FundSettingsClient({ initial }: { initial: FundSettingsData }) {
  const [s, setS] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/fund/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      if (!r.ok) throw new Error("فشل");
      toast.success("تم حفظ إعدادات الصندوق");
    } catch (e) { toast.error(e instanceof Error ? e.message : "فشل"); }
    finally { setSaving(false); }
  };
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="size-5 text-primary" />إعدادات الصندوق</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <ToggleChip icon={s.isOpen ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />} label="مفتوح للتبرعات" checked={s.isOpen} onChange={(v) => setS({ ...s, isOpen: v })} />
          <ToggleChip icon={<Eye className="size-3.5" />} label="تبرع مجهول" checked={s.allowAnonymous} onChange={(v) => setS({ ...s, allowAnonymous: v })} />
          <ToggleChip icon={<Receipt className="size-3.5" />} label="إيصال إلزامي" checked={s.requireReceipt} onChange={(v) => setS({ ...s, requireReceipt: v })} />
          <ToggleChip icon={<Eye className="size-3.5" />} label="شفافية عامة" checked={s.publicTransparency} onChange={(v) => setS({ ...s, publicTransparency: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">الحد الأدنى (درهم)</Label><Input type="number" value={s.minDonation} onChange={(e) => setS({ ...s, minDonation: parseFloat(e.target.value) || 0 })} className="h-9 tabular-nums" /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">الحد الأقصى (درهم)</Label><Input type="number" value={s.maxDonation} onChange={(e) => setS({ ...s, maxDonation: parseFloat(e.target.value) || 0 })} className="h-9 tabular-nums" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">رسالة الشكر</Label><Input value={s.thankYouMessage ?? ""} onChange={(e) => setS({ ...s, thankYouMessage: e.target.value })} className="h-9" placeholder="شكراً لكرمكم" /></div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={s.isOpen ? "bg-secondary/10 text-secondary border-secondary/30" : "bg-red-100 text-red-700"}>{s.isOpen ? "مفتوح" : "مغلق"}</Badge>
          <Button onClick={save} disabled={saving} className="h-10"><Save className="size-4" />{saving ? "..." : "حفظ"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
function ToggleChip({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${checked ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"}`}>{icon}{label}</button>;
}
