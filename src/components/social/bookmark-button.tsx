"use client";
import * as React from "react";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";

export function BookmarkButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [bookmarked, setBookmarked] = React.useState(false);

  const toggle = async () => {
    setBookmarked(!bookmarked);
    try {
      await fetch("/api/social/bookmark", {
        method: bookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
    } catch { setBookmarked(bookmarked); }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${bookmarked ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
    >
      <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary" : ""}`} />
      <span>{bookmarked ? "محفوظ" : "حفظ"}</span>
    </button>
  );
}
