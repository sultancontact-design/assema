"use client";

// ===================================================================
//  NotificationSettingsForm — نموذج إعدادات الإشعارات
//  - 10 toggles
//  - ساعات الهدوء (select)
//  - الحدّ اليومي (select)
//  - زر "خذ استراحة" (يوقف الكل مؤقتاً)
// ===================================================================

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Clock, Coffee, Save } from "lucide-react";

type NotificationPref = {
  id: string;
  streakAlerts: boolean;
  mysteryBoxAlerts: boolean;
  socialAlerts: boolean;
  urgencyAlerts: boolean;
  rewardAlerts: boolean;
  challengeAlerts: boolean;
  lossAlerts: boolean;
  achievementAlerts: boolean;
  recommendationAlerts: boolean;
  welcomeBackAlerts: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  dailyLimit: number;
};

const TYPE_FIELDS: {
  field: keyof NotificationPref;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    field: "streakAlerts",
    label: "تنبيهات السلسلة",
    description: "إشعارات السلسلة، المحطات، الـfreezes",
    emoji: "🔥",
  },
  {
    field: "mysteryBoxAlerts",
    label: "الصندوق الغامض",
    description: "إشعار عند الأهلية لفتح صندوق",
    emoji: "🎁",
  },
  {
    field: "socialAlerts",
    label: "إشعارات اجتماعية",
    description: "متابعون، إعجابات، تعليقات",
    emoji: "👥",
  },
  {
    field: "urgencyAlerts",
    label: "تنبيهات الإلحاح",
    description: "سلسلة معرّضة، فرصة تنتهي",
    emoji: "⏰",
  },
  {
    field: "rewardAlerts",
    label: "مكافآت",
    description: "نقاط، شارات، عجلة",
    emoji: "✨",
  },
  {
    field: "challengeAlerts",
    label: "تحديات",
    description: "تحديات موسمية، تقدّم",
    emoji: "🏆",
  },
  {
    field: "lossAlerts",
    label: "تنبيهات الفقدان",
    description: "تحذير من فقدان شارة/نقاط",
    emoji: "💔",
  },
  {
    field: "achievementAlerts",
    label: "إنجازات",
    description: "بلوغ محطة، رقم قياسي",
    emoji: "🏅",
  },
  {
    field: "recommendationAlerts",
    label: "توصيات",
    description: "محتوى أو حدث قد يهمّك",
    emoji: "💡",
  },
  {
    field: "welcomeBackAlerts",
    label: "أهلاً بعودتك",
    description: "إشعار ترحيبي بعد غياب",
    emoji: "👋",
  },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const LIMIT_OPTIONS = [0, 1, 3, 5, 10, 20, 50];

export function NotificationSettingsForm({
  initial,
}: {
  initial: NotificationPref;
}) {
  const [prefs, setPrefs] = React.useState<NotificationPref>(initial);
  const [saving, setSaving] = React.useState(false);
  const [takingBreak, setTakingBreak] = React.useState(false);

  const update = <K extends keyof NotificationPref>(
    field: K,
    value: NotificationPref[K]
  ) => setPrefs((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/community/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streakAlerts: prefs.streakAlerts,
          mysteryBoxAlerts: prefs.mysteryBoxAlerts,
          socialAlerts: prefs.socialAlerts,
          urgencyAlerts: prefs.urgencyAlerts,
          rewardAlerts: prefs.rewardAlerts,
          challengeAlerts: prefs.challengeAlerts,
          lossAlerts: prefs.lossAlerts,
          achievementAlerts: prefs.achievementAlerts,
          recommendationAlerts: prefs.recommendationAlerts,
          welcomeBackAlerts: prefs.welcomeBackAlerts,
          quietHoursStart: prefs.quietHoursStart,
          quietHoursEnd: prefs.quietHoursEnd,
          dailyLimit: prefs.dailyLimit,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "تعذّر الحفظ");
      toast.success("تمّ حفظ تفضيلاتك");
      setPrefs(json.preferences);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setSaving(false);
    }
  };

  const handleBreak = async (hours: number) => {
    setTakingBreak(true);
    try {
      // تعطيل كل الإشعارات + تقييد الحدّ اليومي لـ0
      const res = await fetch("/api/community/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streakAlerts: false,
          mysteryBoxAlerts: false,
          socialAlerts: false,
          urgencyAlerts: false,
          rewardAlerts: false,
          challengeAlerts: false,
          lossAlerts: false,
          achievementAlerts: false,
          recommendationAlerts: false,
          welcomeBackAlerts: false,
          quietHoursStart: 0,
          quietHoursEnd: 23,
          dailyLimit: 0,
        }),
      });
      if (!res.ok) throw new Error("تعذّر تفعيل الاستراحة");
      toast.success(`☕ استراحة لمدة ${hours} ساعة`, {
        description: "كلّ الإشعارات معطّلة. خذ وقتك للراحة.",
      });
      setPrefs({
        ...prefs,
        streakAlerts: false,
        mysteryBoxAlerts: false,
        socialAlerts: false,
        urgencyAlerts: false,
        rewardAlerts: false,
        challengeAlerts: false,
        lossAlerts: false,
        achievementAlerts: false,
        recommendationAlerts: false,
        welcomeBackAlerts: false,
        dailyLimit: 0,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setTakingBreak(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* أنواع الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            أنواع الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {TYPE_FIELDS.map((field, i) => (
            <div key={field.field}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg" aria-hidden>
                    {field.emoji}
                  </span>
                  <div>
                    <Label
                      htmlFor={`field-${field.field}`}
                      className="font-medium text-foreground"
                    >
                      {field.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`field-${field.field}`}
                  checked={prefs[field.field] as boolean}
                  onCheckedChange={(v) => update(field.field, v as never)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ساعات الهدوء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4 text-secondary" />
            ساعات الهدوء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            لن نُرسل لك إشعارات غير حرجة خلال هذه الفترة. الإشعارات الحرجة
            (فقدان سلسلة، تنبيه طوارئ) تمرّ بكل الأحوال.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quiet-start">من الساعة</Label>
              <Select
                value={String(prefs.quietHoursStart)}
                onValueChange={(v) =>
                  update("quietHoursStart", parseInt(v, 10))
                }
              >
                <SelectTrigger id="quiet-start" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quiet-end">إلى الساعة</Label>
              <Select
                value={String(prefs.quietHoursEnd)}
                onValueChange={(v) =>
                  update("quietHoursEnd", parseInt(v, 10))
                }
              >
                <SelectTrigger id="quiet-end" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الحدّ اليومي */}
      <Card>
        <CardHeader>
          <CardTitle>الحدّ اليومي للإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            لن نُرسل لك أكثر من هذا العدد في اليوم — حتى لا يصبح الإشعار ضوضاءً.
          </p>
          <Select
            value={String(prefs.dailyLimit)}
            onValueChange={(v) => update("dailyLimit", parseInt(v, 10))}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {l === 0 ? "بدون إشعارات" : `${l} إشعار/يوم`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* خذ استراحة */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="size-4 text-accent" />
            خذ استراحة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            أوقف كل الإشعارات لفترة. عند تفعيل الاستراحة: كلّ التنبيهات معطّلة
            والحدّ اليومي يُصبح 0. يمكنك إعادة التفعيل من هنا في أي وقت.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={takingBreak}
              onClick={() => void handleBreak(1)}
            >
              ساعة واحدة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={takingBreak}
              onClick={() => void handleBreak(4)}
            >
              4 ساعات
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={takingBreak}
              onClick={() => void handleBreak(8)}
            >
              8 ساعات (نوم)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={takingBreak}
              onClick={() => void handleBreak(24)}
            >
              يوم كامل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ العائم */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 min-w-32 shadow-lg"
        >
          <Save className="size-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ التفضيلات"}
        </Button>
      </div>
    </div>
  );
}
