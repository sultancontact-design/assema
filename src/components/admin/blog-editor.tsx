"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TipTapEditor, estimateReadingTime } from "@/components/admin/tiptap-editor";
import { toast } from "sonner";
import { Save, Eye, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "HEALTH", label: "صحة" },
  { value: "EDUCATION", label: "تعليم" },
  { value: "FINANCE", label: "مالية" },
  { value: "PARENTING", label: "تربية" },
  { value: "RELIGIOUS", label: "دينية" },
  { value: "COMMUNITY", label: "مجتمع" },
];

interface BlogPostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tiptapContent?: string | null;
  coverImage?: string | null;
  category: string;
  tags?: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function BlogEditor({
  post,
  mode,
}: {
  post: BlogPostData | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<BlogPostData>(
    post ?? {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      tiptapContent: null,
      coverImage: "",
      category: "COMMUNITY",
      tags: "",
      status: "draft",
      featured: false,
    },
  );
  const [autoSlug, setAutoSlug] = React.useState(mode === "create");

  const onTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: autoSlug ? slugify(title) : f.slug,
    }));
  };

  const onContentChange = (html: string, json: unknown) => {
    setForm((f) => ({
      ...f,
      content: html,
      tiptapContent: JSON.stringify(json),
    }));
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim()) {
      toast.error("العنوان مطلوب");
      return;
    }
    if (!form.excerpt.trim()) {
      toast.error("المقتطف مطلوب");
      return;
    }
    if (!form.content.trim() || form.content === "<p></p>") {
      toast.error("المحتوى مطلوب");
      return;
    }

    setSaving(true);
    try {
      const readingTime = estimateReadingTime(form.content);
      const payload: BlogPostData & { readingTime?: number } = {
        ...form,
        status,
        readingTime,
      };

      const url = mode === "create"
        ? "/api/admin/blog"
        : `/api/admin/blog/${form.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل الحفظ (HTTP ${res.status})`);
        setSaving(false);
        return;
      }

      const data = await res.json();
      toast.success(mode === "create" ? "أُنشئ المقال" : "حُفظ المقال");
      if (mode === "create" && data.id) {
        router.push(`/admin/blog/${data.id}/edit`);
      }
    } catch {
      toast.error("فشل الاتصال");
    }
    setSaving(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowRight className="size-4" />
            <span>العودة لإدارة المدوّنة</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold">
            {mode === "create" ? "📝 مقال جديد" : "✏️ تحرير المقال"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => save("draft")}
            disabled={saving}
            className="h-11"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>حفظ كمسوّدة</span>
          </Button>
          <Button
            onClick={() => save("published")}
            disabled={saving}
            className="h-11"
          >
            <Eye className="size-4" />
            <span>نشر</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="title" className="mb-1.5 block">
                  العنوان <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="مثال: كيف نُلامس أبناءنا في رمضان"
                  className="h-11 text-lg font-bold"
                  maxLength={150}
                />
              </div>
              <div>
                <Label htmlFor="slug" className="mb-1.5 block">
                  الرابط (slug)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setForm((f) => ({
                        ...f,
                        slug: slugify(e.target.value),
                      }));
                    }}
                    placeholder="how-to-touch-our-children-in-ramadan"
                    className="h-11"
                    dir="ltr"
                  />
                  {autoSlug ? (
                    <Badge variant="secondary" className="self-center">
                      تلقائي
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAutoSlug(true);
                        setForm((f) => ({ ...f, slug: slugify(f.title) }));
                      }}
                    >
                      توليد
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt" className="mb-1.5 block">
                  المقتطف <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, excerpt: e.target.value }))
                  }
                  placeholder="جملة أو جملتان تُلخّصان المقال وتظهر في قائمة المقالات"
                  className="min-h-[80px]"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.excerpt.length}/300 حرف
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="mb-1.5 block">المحتوى</Label>
            <TipTapEditor
              value={form.content}
              onChange={onContentChange}
              placeholder="ابدأ الكتابة... استعمل شريط الأدوات لتنسيق النص"
              minHeight={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              زمن القراءة المُقدَّر: {estimateReadingTime(form.content)} دقيقة
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                📋 النشر
              </h3>
              <div>
                <Label className="mb-1.5 block">الفئة</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags" className="mb-1.5 block">
                  وسوم (مفصولة بفاصلة)
                </Label>
                <Input
                  id="tags"
                  value={form.tags ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="صحة، أسرة، رمضان"
                  className="h-11"
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                <Label htmlFor="featured" className="cursor-pointer">
                  مقال مميّز ⭐
                </Label>
                <Switch
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, featured: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                🖼️ الغلاف
              </h3>
              <div>
                <Label htmlFor="coverImage" className="mb-1.5 block">
                  رابط صورة الغلاف (URL)
                </Label>
                <Input
                  id="coverImage"
                  type="url"
                  value={form.coverImage ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coverImage: e.target.value }))
                  }
                  placeholder="https://..."
                  className="h-11"
                  dir="ltr"
                />
              </div>
              {form.coverImage && (
                <div className="aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={form.coverImage}
                    alt="معاينة الغلاف"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
