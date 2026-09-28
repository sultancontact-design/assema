"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// ===================================================================
//  ImageUpload v41.0 — رفع صورة (file → base64) أو رابط مباشر
//  - يعمل بدون Supabase Storage (تحويل client-side to base64)
//  - preview + remove + URL paste
//  - مناسب للصور الصغيرة (avatars, thumbnails, cover images)
// ===================================================================

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeKB?: number; // default 500KB
  aspect?: "square" | "wide" | "tall";
}

export function ImageUpload({
  value,
  onChange,
  label = "صورة",
  maxSizeKB = 500,
  aspect = "wide",
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [showUrl, setShowUrl] = React.useState(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" :
    aspect === "tall" ? "aspect-[3/4]" :
    "aspect-video";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // تحقق من الحجم
    const sizeKB = file.size / 1024;
    if (sizeKB > maxSizeKB) {
      toast.error(`الصورة كبيرة جداً (${Math.round(sizeKB)}KB). الحد الأقصى ${maxSizeKB}KB`);
      return;
    }

    setUploading(true);
    try {
      // تحويل إلى base64 (client-side — لا يحتاج server storage)
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onChange(result);
        setUploading(false);
        toast.success("تم تحميل الصورة");
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error("فشل تحميل الصورة");
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setUploading(false);
      toast.error("فشل التحميل");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1">
        <ImageIcon className="size-3.5" />
        {label}
      </Label>

      {value ? (
        // Preview مع زر إزالة
        <div className={`relative ${aspectClass} w-full rounded-lg overflow-hidden border border-border`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 end-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label="إزالة الصورة"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        // منطقة الرفع
        <div className={`${aspectClass} w-full border-2 border-dashed border-border rounded-lg grid place-items-center hover:border-primary/40 transition-colors`}>
          <div className="text-center p-4">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : (
              <>
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground mb-3">اختر صورة من جهازك</p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                  <Upload className="size-3.5" />
                  اختيار ملف
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* رابط URL — قابل للطي */}
      <div>
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LinkIcon className="size-3" />
          {showUrl ? "إخفاء حقل الرابط" : "أو الصق رابط صورة"}
        </button>
        {showUrl && (
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            className="mt-1 h-9 text-sm"
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        الحد الأقصى: {maxSizeKB}KB · يدعم: JPG, PNG, WebP, GIF
      </p>
    </div>
  );
}
