"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHero } from "@/components/community/page-hero";
import { Loader2, Video, Link as LinkIcon, Tag, Check } from "lucide-react";
import Link from "next/link";

// react-social-media-embed — lazy loaded
const TikTokEmbed = React.lazy(() => import("react-social-media-embed").then(m => ({ default: m.TikTokEmbed })));
const InstagramEmbed = React.lazy(() => import("react-social-media-embed").then(m => ({ default: m.InstagramEmbed })));
const YouTubeEmbed = React.lazy(() => import("react-social-media-embed").then(m => ({ default: m.YouTubeEmbed })));

function detectPlatform(url: string): string | null {
  if (/tiktok\.com/i.test(url)) return "TIKTOK";
  if (/youtube\.com|youtu\.be/i.test(url)) return "YOUTUBE";
  if (/instagram\.com/i.test(url)) return "INSTAGRAM";
  if (/facebook\.com|fb\.watch/i.test(url)) return "FACEBOOK";
  return null;
}

export default function AddVideoPageClient() {
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const platform = detectPlatform(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) { toast.error("الرابط غير مدعوم — استخدم TikTok / YouTube / Instagram"); return; }
    if (!title.trim()) { toast.error("العنوان مطلوب"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: url,
          title,
          description: description || null,
          category: category || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل النشر");

      toast.success("تم نشر الفيديو بنجاح!");
      setTimeout(() => { window.location.href = "/videos"; }, 1000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل النشر");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <PageHero
        title="شارك فيديو"
        subtitle="أضف فيديو من TikTok أو YouTube أو Instagram — معاينة فورية قبل النشر."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="شارك فيديو"
        badge="مساهمة مجتمعية"
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* النموذج */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="size-5 text-primary" />
                إضافة فيديو
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* رابط الفيديو */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="size-3.5" />
                    رابط الفيديو *
                  </Label>
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    required
                    dir="ltr"
                    className="h-10"
                  />
                  {platform && (
                    <p className="text-sm text-secondary flex items-center gap-1 mt-1">
                      <Check className="size-3.5" />
                      تم التعرف على: {platform}
                    </p>
                  )}
                  {!platform && url.length > 5 && (
                    <p className="text-sm text-amber-600 mt-1">
                      الرابط غير مدعوم — استخدم TikTok / YouTube / Instagram
                    </p>
                  )}
                </div>

                {/* العنوان */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">العنوان *</Label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الفيديو"
                    required
                    className="h-10"
                  />
                </div>

                {/* الوصف */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">الوصف (اختياري)</Label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف الفيديو..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* التصنيف */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="size-3.5" />
                    التصنيف
                  </Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">اختر التصنيف</option>
                    <option value="MUSIC">موسيقى</option>
                    <option value="COOKING">طبخ</option>
                    <option value="SPORTS">رياضة</option>
                    <option value="COMEDY">كوميديا</option>
                    <option value="EDUCATION">تعليمي</option>
                    <option value="RELIGIOUS">ديني</option>
                    <option value="FAMILY">عائلي</option>
                    <option value="OTHER">آخر</option>
                  </select>
                </div>

                {/* أزرار */}
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !platform} className="flex-1 h-11">
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? "جاري النشر..." : "نشر الفيديو"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/videos">إلغاء</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* معاينة فورية */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Video className="size-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-foreground">معاينة فورية</h2>
            </div>
            {url && platform ? (
              <Card className="overflow-hidden border-4 border-gray-900 bg-black rounded-2xl">
                <CardContent className="p-0">
                  <div className="aspect-[9/16] max-w-xs mx-auto overflow-auto">
                    <React.Suspense fallback={<div className="flex items-center justify-center h-full text-white/40 animate-pulse">جاري المعاينة...</div>}>
                      {platform === "TIKTOK" && <TikTokEmbed url={url} width="100%" />}
                      {platform === "INSTAGRAM" && <InstagramEmbed url={url} width="100%" />}
                      {platform === "YOUTUBE" && <YouTubeEmbed url={url} width="100%" />}
                    </React.Suspense>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Video className="size-12 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-sm">المعاينة تظهر هنا</p>
                  <p className="text-xs mt-1">الصق رابط TikTok أو YouTube أو Instagram</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
