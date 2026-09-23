"use client";

// ===================================================================
//  ShareButtons — أزرار مشاركة على وسائل التواصل
//  - WhatsApp: wa.me/?text=
//  - Facebook: facebook.com/sharer/sharer.php?u=
//  - Telegram: t.me/share/url?url=
//  - Copy link: navigator.clipboard
// ===================================================================

import * as React from "react";
import { toast } from "sonner";
import { MessageCircle, Facebook, Send, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  url: string;
  title?: string;
  text?: string;
  variant?: "default" | "compact" | "icons";
  className?: string;
}

type Platform = "whatsapp" | "facebook" | "telegram" | "copy";

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: typeof MessageCircle; color: string }
> = {
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    color: "text-[#25D366]",
  },
  facebook: {
    label: "فيسبوك",
    icon: Facebook,
    color: "text-[#1877F2]",
  },
  telegram: {
    label: "تيليغرام",
    icon: Send,
    color: "text-[#0088CC]",
  },
  copy: {
    label: "نسخ الرابط",
    icon: Link2,
    color: "text-muted-foreground",
  },
};

export function ShareButtons({
  url,
  title,
  text,
  variant = "default",
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const shareText = title
    ? text
      ? `${title}\n\n${text}`
      : title
    : text ?? "";

  const links: Record<Platform, string> = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
    copy: fullUrl,
  };

  const handleShare = (platform: Platform) => {
    if (platform === "copy") {
      void navigator.clipboard
        .writeText(fullUrl)
        .then(() => {
          setCopied(true);
          toast.success("تم نسخ الرابط بنجاح", {
            description: "يمكنك الآن لصقه ومشاركته مع من تريد",
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error("تعذّر نسخ الرابط", {
            description: "جرّب نسخه يدوياً من شريط العنوان",
          });
        });
      return;
    }
    window.open(links[platform], "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const platforms: Platform[] = ["whatsapp", "facebook", "telegram", "copy"];

  if (variant === "icons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {platforms.map((p) => {
          const Icon = PLATFORM_META[p].icon;
          const isCopied = p === "copy" && copied;
          const FinalIcon = isCopied ? Check : Icon;
          return (
            <Button
              key={p}
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              aria-label={`شارك على ${PLATFORM_META[p].label}`}
              onClick={() => handleShare(p)}
            >
              <FinalIcon className={cn("size-5", isCopied ? "text-secondary" : PLATFORM_META[p].color)} />
            </Button>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {platforms.map((p) => {
          const Icon = PLATFORM_META[p].icon;
          const isCopied = p === "copy" && copied;
          return (
            <Button
              key={p}
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1.5"
              onClick={() => handleShare(p)}
            >
              <Icon className={cn("size-4", isCopied && "text-secondary")} />
              <span className="text-xs">{isCopied ? "تم النسخ" : PLATFORM_META[p].label}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
      {platforms.map((p) => {
        const Icon = PLATFORM_META[p].icon;
        const isCopied = p === "copy" && copied;
        const FinalIcon = isCopied ? Check : Icon;
        return (
          <Button
            key={p}
            type="button"
            variant="outline"
            className="h-14 flex-col gap-1.5"
            onClick={() => handleShare(p)}
          >
            <FinalIcon className={cn("size-5", isCopied ? "text-secondary" : PLATFORM_META[p].color)} />
            <span className="text-xs">{isCopied ? "تم النسخ" : PLATFORM_META[p].label}</span>
          </Button>
        );
      })}
    </div>
  );
}
