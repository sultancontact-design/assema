"use client";
import * as React from "react";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Play, Video, FileText, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "فيديو", POST: "مقال", EVENT: "فعالية", CONTRIBUTION: "مساهمة", SERVICE: "خدمة", INITIATIVE: "مبادرة", STATUS: "منشور",
};

export function FeedItem({ item }: { item: any }) {
  const [liked, setLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(item.likes || 0);
  const [bookmarked, setBookmarked] = React.useState(false);

  const handleLike = async () => {
    const n = !liked; setLiked(n); setLikesCount(c => n ? c + 1 : Math.max(0, c - 1));
    try { await fetch(`/api/feed/${item.id}/like`, { method: "POST" }); } catch { setLiked(!n); setLikesCount(c => n ? c - 1 : c + 1); }
  };

  const timeAgo = (date: string) => {
    const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (m < 1) return "الآن"; if (m < 60) return `قبل ${m} د`;
    const h = Math.floor(m / 60); if (h < 24) return `قبل ${h} س`;
    return `قبل ${Math.floor(h / 24)} يوم`;
  };

  const typeIcon = item.type === "VIDEO" ? Play : item.type === "POST" ? FileText : item.type === "EVENT" ? Calendar : MoreHorizontal;

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#FE2C55] to-[#8B5CF6] shrink-0">
          {item.user?.avatar ? <img src={item.user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{(item.user?.name || "U").slice(0,1)}</div>}
        </div>
        <div className="flex-1">
          <span className="font-bold text-sm">{item.user?.name || "مستخدم"}</span>
          <div className="text-xs text-muted-foreground">{item.user?.district?.nameAr || ""} · {timeAgo(item.createdAt)}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">{TYPE_LABELS[item.type] || item.type}</span>
      </div>

      {item.content && <div className="px-4 pb-3 text-sm whitespace-pre-wrap">{item.content}</div>}

      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <div className="border-y">
          {item.mediaUrls.map((url: string, i: number) => (
            <div key={i} className="aspect-video bg-black">
              {url.match(/\.(mp4|webm|mov)/i) ? <video src={url} className="w-full h-full object-cover" controls /> : <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </div>
          ))}
        </div>
      )}

      {item.type !== "STATUS" && item.targetId && (
        <Link href={item.type === "VIDEO" ? `/videos/${item.targetId}` : item.type === "POST" ? `/blog/${item.targetId}` : `/community/events/${item.targetId}`} className="block px-4 py-2 text-xs text-primary hover:underline">
          عرض {TYPE_LABELS[item.type] || "التفاصيل"} ←
        </Link>
      )}

      <div className="flex items-center justify-around border-t p-2">
        <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted flex-1 justify-center ${liked ? "text-red-500" : "text-muted-foreground"}`}>
          <Heart className={`size-5 ${liked ? "fill-current" : ""}`} /><span className="text-sm">{likesCount}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted flex-1 justify-center text-muted-foreground">
          <MessageCircle className="size-5" /><span className="text-sm">{item.comments || 0}</span>
        </button>
        <button onClick={() => setBookmarked(!bookmarked)} className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted flex-1 justify-center ${bookmarked ? "text-amber-500" : "text-muted-foreground"}`}>
          <Bookmark className={`size-5 ${bookmarked ? "fill-current" : ""}`} />
        </button>
      </div>
    </motion.article>
  );
}
