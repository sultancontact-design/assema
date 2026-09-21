"use client";

// ===================================================================
//  SettingsForm — نموذج إعدادات الموقع
//  - قراءة الإعدادات من جدول Setting (key/value)
//  - تحرير 7 إعدادات موزّعة على 3 مجموعات
//  - زر حفظ → POST /api/admin/settings (stub)
//  - زر تنزيل نسخة احتياطية → toast
// ===================================================================

import * as React from "react";
import { Save, Download, Globe, HeartHandshake, Target, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SettingsMap {
  "site.name": string;
  "site.tagline": string;
  "site.description": string;
  "fund.threshold.ethics": string;
  "fund.disbursement.deadline": string;
  "community.target.families": string;
  "community.target.contributions": string;
  "community.target.events": string;
}

interface DistrictInfo {
  name: string;
  city: string;
  region: string;
  familiesCount: number;
  usersCount: number;
}

export function SettingsForm({
  initialSettings,
  district,
}: {
  initialSettings: SettingsMap;
  district: DistrictInfo;
}) {
  const [settings, setSettings] = React.useState<SettingsMap>(initialSettings);
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof SettingsMap>(key: K, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        toast.error("فشل حفظ الإعدادات");
        return;
      }
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  function handleBackup() {
    toast.info("سيتم توفير النسخ الاحتياطي قريباً", {
      description: "الميزة في طور التطوير — اشكر صبرك.",
    });
  }

  return (
    <div className="space-y-6">
      {/* قسم: إعدادات الموقع */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Globe className="size-4 text-accent" strokeWidth={1.5} />
            <span>إعدادات الموقع</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="site-name">اسم الموقع</Label>
              <Input
                id="site-name"
                value={settings["site.name"]}
                onChange={(e) => set("site.name", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-tagline">الشعار النصّي</Label>
              <Input
                id="site-tagline"
                value={settings["site.tagline"]}
                onChange={(e) => set("site.tagline", e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-desc">وصف الموقع</Label>
            <Textarea
              id="site-desc"
              value={settings["site.description"]}
              onChange={(e) => set("site.description", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* قسم: إعدادات الصندوق */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HeartHandshake className="size-4 text-accent" strokeWidth={1.5} />
            <span>إعدادات الصندوق</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="threshold-ethics">
                حد تصويت لجنة النزاهة (درهم)
              </Label>
              <Input
                id="threshold-ethics"
                type="number"
                value={settings["fund.threshold.ethics"]}
                onChange={(e) =>
                  set("fund.threshold.ethics", e.target.value)
                }
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                الطلبات فوق هذا المبلغ تتطلّب تصويت لجنة النزاهة.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline-hours">
                أقصى مدة للصرف (ساعات)
              </Label>
              <Input
                id="deadline-hours"
                type="number"
                value={settings["fund.disbursement.deadline"]}
                onChange={(e) =>
                  set("fund.disbursement.deadline", e.target.value)
                }
                className="h-10"
              />
              <p className="text-[11px] text-muted-foreground">
                الموعد المستهدف لصرف الطلبات الموافَق عليها.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قسم: أهداف المجتمع */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target className="size-4 text-accent" strokeWidth={1.5} />
            <span>أهداف المجتمع</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-families">هدف الأسر المسجّلة</Label>
              <Input
                id="target-families"
                type="number"
                value={settings["community.target.families"]}
                onChange={(e) =>
                  set("community.target.families", e.target.value)
                }
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-contrib">هدف المساهمات الشهرية</Label>
              <Input
                id="target-contrib"
                type="number"
                value={settings["community.target.contributions"]}
                onChange={(e) =>
                  set("community.target.contributions", e.target.value)
                }
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-events">هدف الفعاليات المنظّمة</Label>
              <Input
                id="target-events"
                type="number"
                value={settings["community.target.events"]}
                onChange={(e) =>
                  set("community.target.events", e.target.value)
                }
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6"
        >
          <Save className="size-4" strokeWidth={1.5} />
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      {/* قسم: النسخ الاحتياطي */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Download className="size-4 text-accent" strokeWidth={1.5} />
            <span>النسخ الاحتياطي</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            تنزيل نسخة احتياطية كاملة من قاعدة البيانات (المستخدمون، المساهمات،
            الطلبات، الفعاليات).
          </p>
          <Button
            variant="outline"
            className="h-11"
            onClick={handleBackup}
          >
            <Download className="size-4" strokeWidth={1.5} />
            تنزيل نسخة احتياطية
          </Button>
        </CardContent>
      </Card>

      {/* قسم: معلومات الحي */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Building2 className="size-4 text-accent" strokeWidth={1.5} />
            <span>معلومات الحي</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-muted-foreground">اسم الحي</dt>
              <dd className="font-medium text-foreground">{district.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">المدينة</dt>
              <dd className="font-medium text-foreground">{district.city}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">الجهة</dt>
              <dd className="font-medium text-foreground">{district.region}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">عدد الأسر</dt>
              <dd className="font-medium text-foreground">
                {district.familiesCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">عدد الأعضاء</dt>
              <dd className="font-medium text-foreground">
                {district.usersCount}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
