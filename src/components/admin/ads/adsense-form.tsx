"use client";

// ===================================================================
//  AdsenseForm — نموذج إعدادات Google AdSense
//  - حقل Publisher ID (ca-pub-…)
//  - زر تفعيل
//  - زر وضع التجربة
//  - Textarea لتقرير AdSense (يُحفظ كنص)
//  - معاينة كود الـscript
// ===================================================================

import * as React from "react";
import { Save, Eye, Code2, FlaskConical, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdsenseFormProps {
  publisherId: string;
  active: boolean;
  testMode: boolean;
  lastReport: string;
}

export function AdsenseForm({
  publisherId: initialPublisherId,
  active: initialActive,
  testMode: initialTestMode,
  lastReport: initialLastReport,
}: AdsenseFormProps) {
  const [publisherId, setPublisherId] = React.useState(initialPublisherId);
  const [active, setActive] = React.useState(initialActive);
  const [testMode, setTestMode] = React.useState(initialTestMode);
  const [lastReport, setLastReport] = React.useState(initialLastReport);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        "ads.adsense.publisherId": publisherId.trim(),
        "ads.adsense.active": active ? "true" : "false",
        "ads.adsense.testMode": testMode ? "true" : "false",
        "ads.adsense.lastReport": lastReport,
      };
      const res = await fetch("/api/admin/ads/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل حفظ الإعدادات");
        return;
      }
      toast.success("تم حفظ إعدادات AdSense بنجاح");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  const scriptPreview = publisherId.trim()
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId.trim()}" crossorigin="anonymous"></script>`
    : `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="size-4 text-accent" strokeWidth={1.5} />
            <span>إعدادات الحساب</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="adsense-publisher">معرّف الناشر (Publisher ID)</Label>
            <Input
              id="adsense-publisher"
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              يبدأ بـ <code className="rounded bg-muted px-1" dir="ltr">ca-pub-</code> ويتبعه 16 رقماً.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="adsense-active" className="text-sm font-medium">
                تفعيل AdSense
              </Label>
              <p className="text-[11px] text-muted-foreground">
                عند التفعيل يُحقن سكربت AdSense في كل الصفحات.
              </p>
            </div>
            <Switch
              id="adsense-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="adsense-test" className="text-sm font-medium">
                وضع التجربة
              </Label>
              <p className="text-[11px] text-muted-foreground">
                يعرض إعلانات تجريبية لاختبار التكامل دون عرض إعلانات حقيقية.
              </p>
            </div>
            <Switch
              id="adsense-test"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>

          <Button
            className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              "جارٍ الحفظ…"
            ) : (
              <>
                <Save className="size-4" strokeWidth={1.5} />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Code2 className="size-4 text-accent" strokeWidth={1.5} />
              <span>معاينة الكود</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <pre
              dir="ltr"
              className="overflow-x-auto custom-scrollbar rounded-md border border-border bg-muted/30 p-3 text-[11px] font-mono text-foreground"
            >
              <code>{scriptPreview}</code>
            </pre>
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-[11px] text-accent">
              <p className="flex items-center gap-1.5 font-medium">
                <Check className="size-3.5" strokeWidth={1.5} />
                <span>
                  الحالة الحالية: {active ? "مفعّل" : "غير مفعّل"}
                  {testMode ? " · وضع التجربة" : ""}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FlaskConical className="size-4 text-accent" strokeWidth={1.5} />
              <span>تقرير AdSense اليدوي</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <Label htmlFor="adsense-report">
              الصق تقرير AdSense هنا (نص خام — يُحفظ كمرجع)
            </Label>
            <Textarea
              id="adsense-report"
              value={lastReport}
              onChange={(e) => setLastReport(e.target.value)}
              placeholder="صفوف التقرير من AdSense..."
              dir="ltr"
              className="min-h-[120px] font-mono text-[12px]"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
