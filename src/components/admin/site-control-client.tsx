"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

const SECTIONS = [
  {
    key: "home", name: "الرئيسية",
    flags: [
      { key: "home.hero.enabled", label: "قسم Hero" },
      { key: "home.stats.enabled", label: "الإحصائيات" },
      { key: "home.activity_feed.enabled", label: "آخر الأنشطة" },
      { key: "home.fomo_banner.enabled", label: "شريط العروض" },
      { key: "home.stories.enabled", label: "قصص النجاح" },
      { key: "home.events.enabled", label: "الفعاليات" },
      { key: "home.blog.enabled", label: "المدونة" },
      { key: "home.ads.enabled", label: "الإعلانات" },
    ],
  },
  {
    key: "social", name: "التفاعل",
    flags: [
      { key: "social.reactions.enabled", label: "الإعجابات" },
      { key: "social.follow.enabled", label: "المتابعة" },
      { key: "social.comments.enabled", label: "التعليقات" },
      { key: "social.share.enabled", label: "المشاركة" },
      { key: "social.bookmark.enabled", label: "الحفظ" },
    ],
  },
  {
    key: "videos", name: "الفيديوهات",
    flags: [
      { key: "videos.enabled", label: "قسم الفيديو" },
      { key: "videos.likes.enabled", label: "الإعجابات" },
      { key: "videos.comments.enabled", label: "التعليقات" },
      { key: "videos.bookmarks.enabled", label: "الحفظ" },
      { key: "videos.tiktok.enabled", label: "TikTok" },
      { key: "videos.youtube.enabled", label: "YouTube" },
      { key: "videos.instagram.enabled", label: "Instagram" },
      { key: "videos.facebook.enabled", label: "Facebook" },
    ],
  },
  {
    key: "sections", name: "الأقسام الرئيسية",
    flags: [
      { key: "community.enabled", label: "المجتمع" },
      { key: "fund.enabled", label: "صندوق المعروف" },
      { key: "events.enabled", label: "الفعاليات" },
      { key: "services.enabled", label: "الخدمات" },
      { key: "store.enabled", label: "المتجر" },
      { key: "blog.enabled", label: "المدونة" },
      { key: "map.enabled", label: "الخريطة" },
      { key: "prices.enabled", label: "الأسعار" },
      { key: "gamification.enabled", label: "المكافآت" },
      { key: "wallet.enabled", label: "المحفظة" },
    ],
  },
];

export function SiteControlClient() {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("home");

  const loadFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/feature-flags", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("يجب تسجيل الدخول كمشرف");
        if (res.status === 403) throw new Error("غير مصرح لك بالوصول");
        throw new Error(`خطأ ${res.status}`);
      }
      const data = await res.json();
      const map: Record<string, boolean> = {};
      if (Array.isArray(data.flags)) {
        data.flags.forEach((f: any) => { map[f.key] = f.isEnabled !== false; });
      }
      setFlags(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadFlags(); }, []);

  const toggle = async (key: string, value: boolean) => {
    setSaving(key);
    setFlags(prev => ({ ...prev, [key]: value }));
    try {
      const flag = await db_lookup(key);
      const res = await fetch(`/api/admin/feature-flags/${flag?.id ?? key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: value }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
    } catch {
      setFlags(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(null);
    }
  };

  // helper — we don't have flag IDs in client state, so use key-based PATCH
  // The API at /api/admin/feature-flags/[id] accepts both ID and key
  async function db_lookup(_key: string) { return null; }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold mb-2">خطأ</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button onClick={loadFlags} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">مركز التحكم الشامل</h1>
          <p className="text-muted-foreground mt-1">تحكم كامل في كل ما يظهر في المنصة</p>
        </div>
        <button onClick={loadFlags} className="p-2 hover:bg-muted rounded-full transition-colors" title="تحديث">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveTab(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === s.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {SECTIONS.filter(s => s.key === activeTab).map(section => (
        <Card key={section.key}>
          <CardContent className="p-6">
            <div className="space-y-1">
              {section.flags.map(field => (
                <div key={field.key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-medium">{field.label}</div>
                    <code className="text-xs text-muted-foreground">{field.key}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(field.key, !(flags[field.key] ?? true))}
                    disabled={saving === field.key}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flags[field.key] ?? true ? "bg-primary" : "bg-muted-foreground/30"}`}
                    aria-label={flags[field.key] ? "إيقاف" : "تفعيل"}
                  >
                    <span className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${flags[field.key] ?? true ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
