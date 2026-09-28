"use client";

import * as React from "react";
import { Reactions } from "@/components/social/reactions";
import { ShareButtons } from "@/components/social/share-buttons";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { Bookmark, Share2, ThumbsUp } from "lucide-react";

// ===================================================================
//  ArticleSocialActions v40.0 — wrapper يجمع Reactions + Share + Bookmark
//  يُستخدم في /blog/[slug] (server component → client wrapper)
// ===================================================================

export function ArticleSocialActions({
  targetType,
  targetId,
  url,
  title,
}: {
  targetType: string;
  targetId: string;
  url: string;
  title: string;
}) {
  const [bookmarked, setBookmarked] = React.useState(false);

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try {
      await fetch("/api/social/bookmark", {
        method: bookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
    } catch {}
  };

  return (
    <div className="flex items-center justify-between py-6 border-y border-border my-8">
      <Reactions targetType={targetType} targetId={targetId} />
      <div className="flex items-center gap-3">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${bookmarked ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary" : ""}`} />
          <span>{bookmarked ? "محفوظ" : "حفظ"}</span>
        </button>
        <ShareButtons url={url} title={title} />
      </div>
    </div>
  );
}
