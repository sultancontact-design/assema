"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import {
  Save, User, Mail, Phone, MapPin, Briefcase, Sparkles,
  Heart, Share2, Instagram, Facebook, MessageCircle,
} from "lucide-react";

// ===================================================================
//  ProfileEditClient v39.0 — تعديل الملف الشخصي
// ===================================================================

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession: string | null;
  skills: string | null;
  interests: string | null;
  bio: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialFacebook: string | null;
  socialWhatsapp: string | null;
  isPublic: boolean;
  allowMessages: boolean;
  avatar: string | null;
}

export function ProfileEditClient({ initial }: { initial: ProfileData }) {
  const [data, setData] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/community/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("فشل الحفظ");
      toast.success("تم حفظ الملف الشخصي");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* صورة الملف الشخصي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            صورة الملف الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={data.avatar ?? ""}
            onChange={(url) => setData({ ...data, avatar: url || null })}
            label="صورة الملف الشخصي"
            aspect="square"
            maxSizeKB={300}
          />
        </CardContent>
      </Card>

      {/* البيانات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            البيانات الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم الشخصي" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} icon={<User className="size-3.5" />} />
            <Field label="اسم العائلة" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} icon={<User className="size-3.5" />} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="البريد الإلكتروني" value={data.email} onChange={(v) => setData({ ...data, email: v })} icon={<Mail className="size-3.5" />} disabled />
            <Field label="الهاتف" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} icon={<Phone className="size-3.5" />} disabled />
          </div>
        </CardContent>
      </Card>

      {/* المعلومات المهنية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5 text-primary" />
            المعلومات المهنية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="المهنة" value={data.profession ?? ""} onChange={(v) => setData({ ...data, profession: v })} icon={<Briefcase className="size-3.5" />} placeholder="مثال: معلم، حرفي، طبيب" />
          <Field label="المهارات (مفصولة بفاصلة)" value={data.skills ?? ""} onChange={(v) => setData({ ...data, skills: v })} icon={<Sparkles className="size-3.5" />} placeholder="مثال: تصميم، طبخ، إصلاح" />
          <Field label="الاهتمامات" value={data.interests ?? ""} onChange={(v) => setData({ ...data, interests: v })} icon={<Heart className="size-3.5" />} placeholder="مثال: رياضة، قراءة، طبخ" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">نبذة تعريفية (Bio)</Label>
            <textarea
              value={data.bio ?? ""}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="اكتب نبذة قصيرة عنك..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* روابط التواصل الاجتماعي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            روابط التواصل الاجتماعي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Instagram" value={data.socialInstagram ?? ""} onChange={(v) => setData({ ...data, socialInstagram: v })} icon={<Instagram className="size-3.5" />} placeholder="@username" />
          <Field label="TikTok" value={data.socialTiktok ?? ""} onChange={(v) => setData({ ...data, socialTiktok: v })} icon={<Sparkles className="size-3.5" />} placeholder="@username" />
          <Field label="Facebook" value={data.socialFacebook ?? ""} onChange={(v) => setData({ ...data, socialFacebook: v })} icon={<Facebook className="size-3.5" />} placeholder="facebook.com/username" />
          <Field label="WhatsApp" value={data.socialWhatsapp ?? ""} onChange={(v) => setData({ ...data, socialWhatsapp: v })} icon={<MessageCircle className="size-3.5" />} placeholder="06XXXXXXXX" />
        </CardContent>
      </Card>

      {/* إعدادات الخصوصية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            إعدادات الخصوصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setData({ ...data, isPublic: !data.isPublic })}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${data.isPublic ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"}`}
            >
              {data.isPublic ? "ملف عام" : "ملف خاص"}
            </button>
            <button
              type="button"
              onClick={() => setData({ ...data, allowMessages: !data.allowMessages })}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${data.allowMessages ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"}`}
            >
              {data.allowMessages ? "الرسائل مفتوحة" : "الرسائل مغلقة"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <a href="/community/profile">إلغاء</a>
        </Button>
        <Button onClick={save} disabled={saving} className="h-11">
          <Save className="size-4" />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, icon, placeholder, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 text-sm"
      />
    </div>
  );
}
