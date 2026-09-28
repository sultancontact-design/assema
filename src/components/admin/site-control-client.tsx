"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHero } from "@/components/community/page-hero";
import {
  Home, Share2, Video, LayoutGrid, ToggleLeft, ToggleRight,
  BarChart3, Settings as SettingsIcon,
} from "lucide-react";

// ===================================================================
//  SiteControlClient v41.0 — تحكم تفاعلي في FeatureFlags
//  5 تبويبات: الرئيسية + التفاعل + الفيديوهات + الأقسام + الأرقام
// ===================================================================

interface FlagData {
  id: string;
  key: string;
  category: string;
  status: string;
  isEnabled: boolean;
  descriptionAr: string | null;
}

const SECTIONS = [
  {
    name: "الرئيسية",
    icon: Home,
    keys: [
      "home.hero", "home.stats", "home.activity_feed", "home.fomo_banner",
      "home.stories_carousel", "home.map_preview", "home.ads",
      "home.upcoming_events", "home.blog_section",
    ],
  },
  {
    name: "التفاعل الاجتماعي",
    icon: Share2,
    keys: [
      "social.reactions", "social.follow", "social.comments",
      "social.share", "social.bookmark", "social.followers_count",
      "social.likes_count",
    ],
  },
  {
    name: "الفيديوهات",
    icon: Video,
    keys: [
      "videos.enabled", "videos.comments", "videos.likes",
      "videos.bookmarks", "videos.tiktok", "videos.youtube",
      "videos.instagram", "videos.facebook",
    ],
  },
  {
    name: "الأقسام الرئيسية",
    icon: LayoutGrid,
    keys: [
      "community.enabled", "fund.enabled", "events.enabled",
      "services.enabled", "store.enabled", "blog.enabled",
      "map.enabled", "prices.enabled", "gamification.enabled", "wallet.enabled",
    ],
  },
];

const LABELS: Record<string, string> = {
  "home.hero": "قسم Hero",
  "home.stats": "الإحصائيات",
  "home.activity_feed": "آخر الأنشطة",
  "home.fomo_banner": "شريط العروض",
  "home.stories_carousel": "قصص النجاح",
  "home.map_preview": "معاينة الخريطة",
  "home.ads": "الإعلانات",
  "home.upcoming_events": "الفعاليات القادمة",
  "home.blog_section": "المدونة",
  "social.reactions": "الإعجابات",
  "social.follow": "المتابعة",
  "social.comments": "التعليقات",
  "social.share": "المشاركة",
  "social.bookmark": "حفظ العناصر",
  "social.followers_count": "إظهار عدد المتابعين",
  "social.likes_count": "إظهار عدد الإعجابات",
  "videos.enabled": "قسم الفيديو",
  "videos.comments": "التعليقات",
  "videos.likes": "الإعجابات",
  "videos.bookmarks": "الحفظ",
  "videos.tiktok": "مصدر TikTok",
  "videos.youtube": "مصدر YouTube",
  "videos.instagram": "مصدر Instagram",
  "videos.facebook": "مصدر Facebook",
  "community.enabled": "المجتمع",
  "fund.enabled": "صندوق المعروف",
  "events.enabled": "الفعاليات",
  "services.enabled": "الخدمات",
  "store.enabled": "المتجر",
  "blog.enabled": "المدونة",
  "map.enabled": "الخريطة",
  "prices.enabled": "الأسعار",
  "gamification.enabled": "المكافآت",
  "wallet.enabled": "المحفظة",
};

export function SiteControlClient({ initialFlags }: { initialFlags: FlagData[] }) {
  const [flags, setFlags] = React.useState<Record<string, FlagData>>(() => {
    const map: Record<string, FlagData> = {};
    initialFlags.forEach(f => { map[f.key] = f; });
    return map;
  });
  const [saving, setSaving] = React.useState<string | null>(null);

  const toggle = async (key: string) => {
    const flag = flags[key];
    if (!flag) return;
    const newValue = !flag.isEnabled;
    setSaving(key);
    setFlags(prev => ({ ...prev, [key]: { ...prev[key]!, isEnabled: newValue, status: newValue ? "ACTIVE" : "HIDDEN" } }));

    try {
      const r = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: newValue, status: newValue ? "ACTIVE" : "HIDDEN" }),
      });
      if (!r.ok) throw new Error("فشل");
      toast.success(`${LABELS[key] ?? key}: ${newValue ? "مُفعّل" : "مُعطّل"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
      setFlags(prev => ({ ...prev, [key]: { ...prev[key]!, isEnabled: !newValue } }));
    } finally {
      setSaving(null);
    }
  };

  const stats = {
    total: Object.keys(flags).length,
    active: Object.values(flags).filter(f => f.isEnabled).length,
    hidden: Object.values(flags).filter(f => !f.isEnabled).length,
  };

  return (
    <div className="flex flex-col">
      <PageHero
        title="مركز التحكم الشامل"
        subtitle="تحكّم في كل ما يظهر في المنصة — أفعّل/عطّل الميزات والأقسام."
        image="https://images.unsplash.com/photo-1551269901-5c5e14c25b58?auto=format&fit=crop&w=1920&q=80"
        imageAlt="مركز التحكم الشامل"
        badge={`${stats.active}/${stats.total} مُفعّلة`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary mb-2"><ToggleRight className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مُفعّلة</p>
            <p className="font-heading font-extrabold text-secondary text-2xl tabular-nums">{stats.active}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 mb-2"><ToggleLeft className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">مُعطّلة</p>
            <p className="font-heading font-extrabold text-amber-600 text-2xl tabular-nums">{stats.hidden}</p>
          </CardContent></Card>
          <Card className="lift-on-hover"><CardContent className="p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2"><BarChart3 className="size-5" /></div>
            <p className="text-xs text-muted-foreground mb-1">إجمالي</p>
            <p className="font-heading font-extrabold text-primary text-2xl tabular-nums">{stats.total}</p>
          </CardContent></Card>
        </div>

        {/* 4 تبويبات */}
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.name} className="overflow-hidden">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <SectionIcon className="size-4" />
                  {section.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {section.keys.map((key) => {
                    const flag = flags[key];
                    const isEnabled = flag?.isEnabled ?? true;
                    return (
                      <li key={key} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-foreground">{LABELS[key] ?? key}</p>
                          <code className="text-[10px] text-muted-foreground">{key}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          disabled={saving === key || !flag}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-secondary" : "bg-muted-foreground/30"} ${!flag ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label={isEnabled ? "إيقاف" : "تفعيل"}
                        >
                          <span className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${isEnabled ? "-translate-x-5" : "-translate-x-0.5"}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
