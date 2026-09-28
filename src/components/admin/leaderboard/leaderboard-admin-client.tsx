"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Trophy, Crown, Eye, EyeOff, Save, Ban, Users, Gift,
} from "lucide-react";

// ===================================================================
//  LeaderboardAdminClient v38.0 — تحكم كامل في لوحة المتصدرين
// ===================================================================

interface LeaderboardConfig {
  id: string;
  period: string;
  isActive: boolean;
  isVisible: boolean;
  minPoints: number;
  topN: number;
  showAvatars: boolean;
  showDistricts: boolean;
  showBadges: boolean;
  reward1st: number;
  reward2nd: number;
  reward3rd: number;
  customMessage: string | null;
}

interface BannedUser {
  id: string;
  userId: string;
  reason: string;
  bannedBy: string;
  expiresAt: string | null;
  createdAt: string;
  user: { fullName: string };
}

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
  ALL_TIME: "كل الوقت",
};

export function LeaderboardAdminClient({
  initialConfigs,
  initialBans,
  initialTopUsers,
}: {
  initialConfigs: LeaderboardConfig[];
  initialBans: BannedUser[];
  initialTopUsers: Array<{ id: string; fullName: string; points: number; level: number; districtName: string | null }>;
}) {
  const [configs, setConfigs] = React.useState(initialConfigs);
  const [bans, setBans] = React.useState(initialBans);
  const [topUsers] = React.useState(initialTopUsers);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [banUserId, setBanUserId] = React.useState("");
  const [banReason, setBanReason] = React.useState("");

  const updateConfig = (id: string, field: keyof LeaderboardConfig, value: string | number | boolean) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveConfig = async (id: string) => {
    setSaving(id);
    const cfg = configs.find(c => c.id === id);
    if (!cfg) return;
    try {
      const r = await fetch("/api/admin/leaderboard/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!r.ok) throw new Error("فشل الحفظ");
      toast.success(`تم حفظ إعدادات ${PERIOD_LABELS[cfg.period] ?? cfg.period}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(null);
    }
  };

  const banUser = async () => {
    if (!banUserId || !banReason) {
      toast.error("اختر مستخدم واكتب السبب");
      return;
    }
    try {
      const r = await fetch("/api/admin/leaderboard/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: banUserId, reason: banReason }),
      });
      if (!r.ok) throw new Error("فشل الحظر");
      const d = await r.json();
      setBans(prev => [...prev, d.ban]);
      setBanUserId("");
      setBanReason("");
      toast.success("تم حظر المستخدم من لوحة المتصدرين");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحظر");
    }
  };

  const unbanUser = async (banId: string) => {
    try {
      const r = await fetch(`/api/admin/leaderboard/ban?id=${banId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("فشل رفع الحظر");
      setBans(prev => prev.filter(b => b.id !== banId));
      toast.success("تم رفع الحظر");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل رفع الحظر");
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="lift-on-hover">
          <CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><Trophy className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">فترات نشطة</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{configs.filter(c => c.isActive).length}</p>
          </CardContent>
        </Card>
        <Card className="lift-on-hover">
          <CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><Eye className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مرئية للعموم</p>
            <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{configs.filter(c => c.isVisible).length}</p>
          </CardContent>
        </Card>
        <Card className="lift-on-hover">
          <CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-foreground mb-2"><Users className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مستخدمون محظورون</p>
            <p className="font-heading font-extrabold text-accent text-2xl tabular-nums">{bans.length}</p>
          </CardContent>
        </Card>
        <Card className="lift-on-hover">
          <CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><Crown className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">أعلى مكافأة</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{Math.max(...configs.map(c => c.reward1st))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bento: configs (8-col) + bans (4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Configs */}
        <div className="lg:col-span-8">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">إعدادات الفترات</h2>
          </div>
          <div className="space-y-4">
            {configs.map((cfg) => (
              <Card key={cfg.id} className="lift-on-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {PERIOD_LABELS[cfg.period] ?? cfg.period}
                      </Badge>
                      {cfg.isActive ? (
                        <Badge className="bg-secondary/10 text-secondary border-secondary/30" variant="outline">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">متوقّف</Badge>
                      )}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => saveConfig(cfg.id)}
                      disabled={saving === cfg.id}
                      className="h-8"
                    >
                      <Save className="size-3.5" />
                      {saving === cfg.id ? "..." : "حفظ"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* toggles */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <ToggleChip
                      label="نشط"
                      checked={cfg.isActive}
                      onChange={(v) => updateConfig(cfg.id, "isActive", v)}
                    />
                    <ToggleChip
                      label="مرئي للعموم"
                      checked={cfg.isVisible}
                      onChange={(v) => updateConfig(cfg.id, "isVisible", v)}
                      icon={cfg.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    />
                    <ToggleChip
                      label="الصور الرمزية"
                      checked={cfg.showAvatars}
                      onChange={(v) => updateConfig(cfg.id, "showAvatars", v)}
                    />
                    <ToggleChip
                      label="الأحياء"
                      checked={cfg.showDistricts}
                      onChange={(v) => updateConfig(cfg.id, "showDistricts", v)}
                    />
                    <ToggleChip
                      label="الشارات"
                      checked={cfg.showBadges}
                      onChange={(v) => updateConfig(cfg.id, "showBadges", v)}
                    />
                  </div>
                  {/* numeric inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <NumField label="حد أدنى للنقاط" value={cfg.minPoints} onChange={(v) => updateConfig(cfg.id, "minPoints", v)} />
                    <NumField label="عدد المتصدرين" value={cfg.topN} onChange={(v) => updateConfig(cfg.id, "topN", v)} />
                    <NumField label="مكافأة الأول" value={cfg.reward1st} onChange={(v) => updateConfig(cfg.id, "reward1st", v)} icon={<Trophy className="size-3.5 text-amber-500" />} />
                    <NumField label="مكافأة الثاني" value={cfg.reward2nd} onChange={(v) => updateConfig(cfg.id, "reward2nd", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumField label="مكافأة الثالث" value={cfg.reward3rd} onChange={(v) => updateConfig(cfg.id, "reward3rd", v)} />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">رسالة مخصّصة</Label>
                      <Input
                        value={cfg.customMessage ?? ""}
                        onChange={(e) => updateConfig(cfg.id, "customMessage", e.target.value)}
                        placeholder="رسالة تظهر أعلى اللوحة"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bans sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Ban form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ban className="size-4 text-red-500" />
                حظر مستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">اختر مستخدم</Label>
                <select
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— اختر —</option>
                  {topUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.points} نقطة)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">السبب</Label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="مثال: سلوك غير رياضي"
                  className="h-9 text-sm"
                />
              </div>
              <Button onClick={banUser} className="w-full h-9" variant="outline">
                <Ban className="size-3.5" />
                حظر من اللوحة
              </Button>
            </CardContent>
          </Card>

          {/* Banned list */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ban className="size-4 text-red-500" />
                المحظورون ({bans.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border max-h-80 overflow-y-auto">
                {bans.length === 0 ? (
                  <li className="p-4 text-center text-sm text-muted-foreground">لا يوجد محظورون</li>
                ) : (
                  bans.map((b) => (
                    <li key={b.id} className="p-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{b.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{b.reason}</p>
                        {b.expiresAt && (
                          <p className="text-[10px] text-muted-foreground">حتى: {new Date(b.expiresAt).toLocaleDateString("ar-MA")}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => unbanUser(b.id)} className="h-7 text-xs">
                        رفع
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ToggleChip({
  label, checked, onChange, icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        checked
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-muted text-muted-foreground border border-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function NumField({
  label, value, onChange, icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="h-9 text-sm tabular-nums"
      />
    </div>
  );
}

export default LeaderboardAdminClient;
