"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Type, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react";

const SECTIONS = [
  { key: "HOME", label: "الرئيسية" },
  { key: "GROUPS", label: "مجموعات الحي" },
  { key: "FUND", label: "صندوق المعروف" },
  { key: "EVENTS", label: "الفعاليات" },
  { key: "STORE", label: "المتجر" },
  { key: "ETHICS", label: "الأخلاق" },
  { key: "FOOTER", label: "Footer" },
];

interface ContentItem { id: string; key: string; value: string; section: string; labelAr: string; }
interface ImageItem { id: string; key: string; url: string; alt: string; section: string; labelAr: string; }

export function ContentManagementClient() {
  const [content, setContent] = React.useState<ContentItem[]>([]);
  const [images, setImages] = React.useState<ImageItem[]>([]);
  const [activeSection, setActiveSection] = React.useState("HOME");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/content").then(r => r.json()),
      fetch("/api/admin/images").then(r => r.json()),
    ]).then(([c, i]) => {
      setContent(c.items ?? []);
      setImages(i.items ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveContent = async (key: string, value: string) => {
    setSaving(key);
    try {
      const res = await fetch(`/api/admin/content/${key}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      if (res.ok) toast.success("تم الحفظ");
      else toast.error("فشل");
    } catch { toast.error("فشل"); }
    setSaving(null);
  };

  const saveImage = async (key: string, url: string) => {
    setSaving(key);
    try {
      const res = await fetch(`/api/admin/images/${key}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (res.ok) toast.success("تم حفظ الصورة");
      else toast.error("فشل");
    } catch { toast.error("فشل"); }
    setSaving(null);
  };

  const sectionContent = content.filter(c => c.section === activeSection);
  const sectionImages = images.filter(i => i.section === activeSection);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Type className="size-7 text-primary" />
          <span>إدارة المحتوى (CMS)</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          تحكم كامل في كل نص وصورة تظهر في المنصة — {content.length} عنصر نصي + {images.length} صورة
        </p>
      </header>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map(s => {
          const count = content.filter(c => c.section === s.key).length + images.filter(i => i.section === s.key).length;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === s.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">جاري التحميل...</p>
      ) : (
        <div className="space-y-6">
          {/* Images */}
          {sectionImages.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ImageIcon className="size-5" />الصور ({sectionImages.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionImages.map(img => (
                    <div key={img.id} className="space-y-2">
                      <label className="text-sm font-medium">{img.labelAr}</label>
                      <code className="text-[10px] text-muted-foreground block font-molo" dir="ltr">{img.key}</code>
                      <div className="relative h-40 rounded-lg overflow-hidden border">
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      </div>
                      <Input
                        defaultValue={img.url}
                        onBlur={(e) => { if (e.target.value !== img.url) saveImage(img.key, e.target.value); }}
                        placeholder="رابط الصورة"
                        dir="ltr"
                        className="text-xs h-10"
                      />
                      {saving === img.key && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" />تم الحفظ</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Text content */}
          {sectionContent.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Type className="size-5" />النصوص ({sectionContent.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {sectionContent.map(item => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{item.labelAr}</label>
                      <code className="text-[10px] text-muted-foreground font-mono" dir="ltr">{item.key}</code>
                    </div>
                    {item.value.length > 100 ? (
                      <Textarea
                        defaultValue={item.value}
                        onBlur={(e) => { if (e.target.value !== item.value) saveContent(item.key, e.target.value); }}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        defaultValue={item.value}
                        onBlur={(e) => { if (e.target.value !== item.value) saveContent(item.key, e.target.value); }}
                        className="h-10 text-sm"
                      />
                    )}
                    {saving === item.key && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" />تم الحفظ</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
