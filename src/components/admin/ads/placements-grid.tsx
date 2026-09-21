"use client";

// ===================================================================
//  PlacementsGrid — شبكة أماكن الإعلانات (12 بطاقة)
//  - لكل مكان: اسم، عدد الإعلانات، مشاهدات، نقرات، CTR، الحملة النشطة، الإيراد
//  - زر "تعديل الكود المخصص" → Dialog مع Textarea (يُحفظ في Setting)
// ===================================================================

import * as React from "react";
import { Code2, Eye, MousePointerClick, Wallet, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AD_PLACEMENT_LABELS } from "@/lib/constants";
import { PLACEMENT_PREVIEW } from "@/lib/ads-utils";
import type { AdRow } from "@/lib/ads-utils";

// ===================================================================
//  الأنواع
// ===================================================================

export interface PlacementStats {
  key: string;
  label: string;
  adsCount: number;
  views: number;
  clicks: number;
  ctr: number;
  revenue: number;
  activeAd: AdRow | null;
  customCode: string | null;
  customActive: boolean;
}

interface PlacementsGridProps {
  placements: PlacementStats[];
}

// ===================================================================
//  المُكوّن
// ===================================================================

export function PlacementsGrid({ placements }: PlacementsGridProps) {
  const [editing, setEditing] = React.useState<PlacementStats | null>(null);
  const [code, setCode] = React.useState("");
  const [active, setActive] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function openEditor(p: PlacementStats) {
    setEditing(p);
    setCode(p.customCode ?? "");
    setActive(p.customActive);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        [`ads.placement.${editing.key}.code`]: code,
        [`ads.placement.${editing.key}.active`]: active ? "true" : "false",
      };
      const res = await fetch("/api/admin/ads/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل حفظ الكود");
        return;
      }
      toast.success("تم حفظ الكود المخصص");
      setEditing(null);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placements.map((p) => (
          <Card
            key={p.key}
            className="border border-border bg-card p-0"
          >
            <CardContent className="p-4 space-y-3">
              {/* الترويسة */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">
                    {PLACEMENT_PREVIEW[p.key]?.label ?? p.key}
                  </p>
                </div>
                {p.customActive && (
                  <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                    مخصّص
                  </Badge>
                )}
              </div>

              {/* معاينة بصرية للأبعاد */}
              <div className="grid place-items-center rounded-md border border-dashed border-border bg-muted/30 py-4">
                <div
                  className="rounded border border-accent/40 bg-accent/10"
                  style={{
                    aspectRatio: `${PLACEMENT_PREVIEW[p.key]?.w ?? 300} / ${PLACEMENT_PREVIEW[p.key]?.h ?? 250}`,
                    maxWidth: PLACEMENT_PREVIEW[p.key] && PLACEMENT_PREVIEW[p.key].w >= PLACEMENT_PREVIEW[p.key].h
                      ? "100%"
                      : "60%",
                    maxHeight: 80,
                    width: "100%",
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* مؤشرات */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div>
                  <p className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Eye className="size-3" strokeWidth={1.5} />
                  </p>
                  <p className="font-semibold text-foreground">{p.views.toLocaleString("ar-MA")}</p>
                  <p className="text-[9px] text-muted-foreground">مشاهدات</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-muted-foreground">
                    <MousePointerClick className="size-3" strokeWidth={1.5} />
                  </p>
                  <p className="font-semibold text-foreground">{p.clicks.toLocaleString("ar-MA")}</p>
                  <p className="text-[9px] text-muted-foreground">نقرات</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Activity className="size-3" strokeWidth={1.5} />
                  </p>
                  <p className="font-semibold text-foreground">{p.ctr.toFixed(1)}%</p>
                  <p className="text-[9px] text-muted-foreground">CTR</p>
                </div>
              </div>

              {/* الإيراد + الإعلان النشط */}
              <div className="space-y-1 rounded-md border border-border p-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">الإيراد</span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Wallet className="size-3 text-accent" strokeWidth={1.5} />
                    {p.revenue.toLocaleString("ar-MA", { maximumFractionDigits: 0 })} د.م
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">عدد الحملات</span>
                  <span className="font-medium text-foreground">{p.adsCount}</span>
                </div>
                {p.activeAd && (
                  <div className="border-t border-border pt-1 text-[11px]">
                    <span className="text-muted-foreground">النشطة:</span>{" "}
                    <span className="font-medium text-foreground">{p.activeAd.title}</span>
                  </div>
                )}
              </div>

              {/* إجراء */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full gap-2"
                onClick={() => openEditor(p)}
              >
                <Code2 className="size-3.5" strokeWidth={1.5} />
                <span>تعديل الكود المخصص</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* نافذة تحرير الكود */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-start">
              الكود المخصص: {editing?.label ?? ""}
            </DialogTitle>
            <DialogDescription className="text-start">
              الصق كود HTML/JS المخصص لهذا المكان. سيُحقن مباشرة في الصفحة عند تفعيله.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="code-active" className="text-sm font-medium">
                  تفعيل الكود المخصص
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  عند التفعيل يُستبدل العرض الافتراضي بالكود المخصص.
                </p>
              </div>
              <Switch
                id="code-active"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custom-code">الكود (HTML / JavaScript)</Label>
              <Textarea
                id="custom-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="<ins class='adsbygoogle' ...></ins><script>…</script>"
                dir="ltr"
                className="min-h-[200px] font-mono text-[12px]"
                spellCheck={false}
              />
              <p className="text-[11px] text-muted-foreground">
                يُحفظ الكود في جدول الإعدادات تحت المفتاح{" "}
                <code className="rounded bg-muted px-1" dir="ltr">
                  ads.placement.{editing?.key}.code
                </code>
                .
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-border p-3">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              className="h-11 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ الكود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
