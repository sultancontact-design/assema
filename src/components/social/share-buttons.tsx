"use client";
import * as React from "react";
import { Share2, MessageCircle, Facebook, Twitter, Link2, Check } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const fullUrl = `https://assema-sultancontact-design.vercel.app${url}`;

  const share = (platform: string) => {
    const urls: Record<string, string> = {
      WHATSAPP: `https://wa.me/?text=${encodeURIComponent(title + " " + fullUrl)}`,
      FACEBOOK: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      TWITTER: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    };
    if (platform === "COPY") {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
    fetch("/api/social/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, url, targetType: "SHARE", targetId: url }),
    }).catch(() => {});
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => share("WHATSAPP")} className="p-2 rounded-full hover:bg-muted" title="WhatsApp"><MessageCircle className="w-4 h-4 text-green-600" /></button>
      <button onClick={() => share("FACEBOOK")} className="p-2 rounded-full hover:bg-muted" title="Facebook"><Facebook className="w-4 h-4 text-blue-600" /></button>
      <button onClick={() => share("TWITTER")} className="p-2 rounded-full hover:bg-muted" title="Twitter"><Twitter className="w-4 h-4 text-sky-500" /></button>
      <button onClick={() => share("COPY")} className="p-2 rounded-full hover:bg-muted" title="نسخ الرابط">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}</button>
    </div>
  );
}
