"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TipTapEditor, estimateReadingTime } from "@/components/admin/tiptap-editor";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, FileText, Eye, Tag } from "lucide-react";

// ===================================================================
//  BlogWriterClient v37.0 — رحلة كتابة المقال للمستخدمين
//  - TipTap editor كامل (bold, italic, headings, lists, links, images)
//  - حفظ تلقائي كمسودة في localStorage + DB
//  - نشر بعد موافقة الأدمن (status: PENDING_REVIEW)
//  - SEO: meta title + description + keywords
//  - تصنيف + وقت القراءة المحسوب
// ===================================================================

interface BlogWriterClientProps {
  userId: string;
  authorName: string;
  availableCategories: string[];
}

const STORAGE_KEY = "blog-draft";

export function BlogWriterClient({
  userId,
  authorName,
  availableCategories,
}: BlogWriterClientProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [category, setCategory] = React.useState(availableCategories[0] ?? "COMMUNITY");
  const [content, setContent] = React.useState("");
  const [metaDescription, setMetaDescription] = React.useState("");
  const [metaKeywords, setMetaKeywords] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

  // استعادة المسودة المحفوظة محلياً
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.excerpt) setExcerpt(d.excerpt);
        if (d.category) setCategory(d.category);
        if (d.content) setContent(d.content);
        if (d.metaDescription) setMetaDescription(d.metaDescription);
        if (d.metaKeywords) setMetaKeywords(d.metaKeywords);
        toast.info("استعدنا مسودتك المحفوظة");
      } catch {}
    }
  }, []);

  // حفظ تلقائي في localStorage كل 5 ثوانٍ
  React.useEffect(() => {
    const id = window.setInterval(() => {
      if (!title && !content) return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title, excerpt, category, content, metaDescription, metaKeywords })
      );
      setLastSaved(new Date().toLocaleTimeString("ar-MA", { timeStyle: "short" }));
    }, 5000);
    return () => window.clearInterval(id);
  }, [title, excerpt, category, content, metaDescription, metaKeywords]);

  const readTime = estimateReadingTime(content);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/community/blog/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, category, content, metaDescription, metaKeywords }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("حُفظت المسودة في حسابك");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!title.trim()) {
      toast.error("أدخل عنوان المقال");
      return;
    }
    if (content.length < 200) {
      toast.error("المحتوى قصير جداً (200 حرف على الأقل)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/blog/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, category, content, metaDescription, metaKeywords }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "فشل الإرسال");
      }
      toast.success("أُرسل المقال للمراجعة — سيظهر للعموم بعد موافقة الأدمن");
      localStorage.removeItem(STORAGE_KEY);
      router.push("/blog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* أدوات الكاتب */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">محرّر المقال</h2>
          <p className="text-sm text-muted-foreground mt-1">
            الكاتب: {authorName} · وقت القراءة المُقدّر: {readTime} دقيقة
            {lastSaved && ` · آخر حفظ تلقائي: ${lastSaved}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="h-10">
            <Save className="size-4" />
            <span>{saving ? "جاري الحفظ..." : "حفظ كمسودة"}</span>
          </Button>
          <Button onClick={handleSubmitForReview} disabled={submitting} className="h-10 bg-primary">
            <Send className="size-4" />
            <span>{submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}</span>
          </Button>
        </div>
      </div>

      {/* العنوان */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText className="size-4 text-primary" />
            عنوان المقال
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: 10 نصائح لميزانية رمضان"
            className="h-12 text-lg font-bold"
            maxLength={120}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{title.length}/120 حرف</span>
          </div>
        </CardContent>
      </Card>

      {/* المقتطف + التصنيف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <label className="text-sm font-bold text-foreground">المقتطف (Excerpt)</label>
            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="ملخّص قصير يظهر في قائمة المقالات"
              maxLength={200}
            />
            <span className="text-xs text-muted-foreground">{excerpt.length}/200</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Tag className="size-4 text-secondary" />
              التصنيف
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="COMMUNITY">COMMUNITY</option>
              <option value="HEALTH">HEALTH</option>
              <option value="FINANCE">FINANCE</option>
              <option value="EDUCATION">EDUCATION</option>
              <option value="RELIGIOUS">RELIGIOUS</option>
              <option value="PARENTING">PARENTING</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* المحرّر TipTap */}
      <Card>
        <CardContent className="p-4">
          <TipTapEditor
            value={content}
            onChange={(html) => setContent(html)}
            placeholder="ابدأ الكتابة هنا..."
            minHeight={400}
          />
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Eye className="size-4 text-accent" />
            إعدادات SEO (اختياري)
          </h3>
          <div>
            <label className="text-xs text-muted-foreground">وصف الميتا (160 حرف)</label>
            <Input
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="وصف يظهر في نتائج البحث"
              maxLength={160}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">كلمات مفتاحية (مفصولة بفاصلة)</label>
            <Input
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="رمضان، ميزانية، نصائح"
            />
          </div>
        </CardContent>
      </Card>

      {/* تنبيه */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
        <p className="font-bold text-foreground mb-1">ملاحظة</p>
        <p className="text-muted-foreground">
          مقالك سيُراجع من طرف فريق التحرير قبل نشره للعموم. هذا يضمن جودة المحتوى
          واحترام ميثاق المنصة الأخلاقي. ستصلك إشعار فور النشر.
        </p>
      </div>

      <div className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/blog">
            <ArrowLeft className="size-4" />
            العودة للمدوّنة
          </Link>
        </Button>
      </div>
    </div>
  );
}
