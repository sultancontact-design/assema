"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Music, Play, Plus,
} from "lucide-react";
import { VideoFeedSkeleton } from "@/components/video/video-feed-skeleton";

// ===================================================================
//  VideoFeed v40.0 — TikTok-Style Vertical Feed
//  - full-screen vertical scroll with snap
//  - auto-play active video
//  - like + comment + bookmark + share actions on left
//  - user info + title + description on right
//  - music marquee at bottom
// ===================================================================

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  sourcePlatform: string;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  category: string | null;
  user: { fullName: string };
}

export function VideoFeed({ initialVideos }: { initialVideos: VideoItem[] }) {
  const [videos] = React.useState(initialVideos);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // التقاط السكرول للتنقل بين الفيديوهات + تسجيل المشاهدة
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight);
      if (index !== activeIndex && index >= 0 && index < videos.length) {
        setActiveIndex(index);
        // تسجيل المشاهدة
        const video = videos[index];
        if (video) {
          fetch("/api/social/view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetType: "VIDEO", targetId: video.id }),
          }).catch(() => {});
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [videos, activeIndex]);

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">لا توجد فيديوهات بعد</p>
          <a href="/community/videos/add" className="text-primary hover:underline">شارك أول فيديو</a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="video-feed-container h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black"
      dir="rtl"
      style={{ scrollbarWidth: "none" }}
    >
      {videos.map((video, i) => (
        <div
          key={video.id}
          className="h-screen w-full snap-start snap-always flex items-center justify-center relative"
        >
          <VideoCard video={video} isActive={i === activeIndex} />
        </div>
      ))}
    </div>
  );
}

// ━━━ VideoCard — TikTok style ━━━
function VideoCard({ video, isActive }: { video: VideoItem; isActive: boolean }) {
  const [liked, setLiked] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(video.likes);
  const [paused, setPaused] = React.useState(!isActive);
  const [showComments, setShowComments] = React.useState(false);

  React.useEffect(() => { setPaused(!isActive); }, [isActive]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    try {
      await fetch(`/api/videos/${video.id}/like`, { method: "POST" });
    } catch {}
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try {
      await fetch(`/api/videos/${video.id}/bookmark`, { method: "POST" });
    } catch {}
  };

  const handleShare = async () => {
    const url = `https://assema-sultancontact-design.vercel.app/videos/${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
    try {
      await fetch(`/api/videos/${video.id}/share`, { method: "POST" });
    } catch {}
  };

  // TikTok embed URL
  const getTikTokEmbedUrl = (url: string) => {
    const m = url.match(/\/video\/(\d+)/);
    return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : url;
  };

  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-black">
      {/* الفيديو / Embed */}
      <div className="absolute inset-0 flex items-center justify-center">
        {video.sourcePlatform === "TIKTOK" ? (
          <iframe
            src={getTikTokEmbedUrl(video.sourceUrl)}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 flex items-center justify-center">
                <Play className="size-16 text-white/40" fill="white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* زر التشغيل/الإيقاف */}
      <button onClick={() => setPaused(!paused)} className="absolute inset-0 z-10" aria-label="تشغيل/إيقاف">
        {paused && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Play className="size-20 text-white/90 drop-shadow-lg" fill="white" />
          </motion.div>
        )}
      </button>

      {/* طبقة تعتيم */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      {/* المعلومات أسفل يمين (RTL) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-20 end-4 start-20 text-white z-20"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="grid size-12 place-items-center rounded-full bg-primary text-white font-bold border-2 border-white">
            {video.user.fullName.slice(0, 1)}
          </div>
          <div>
            <div className="font-bold text-base">{video.user.fullName}</div>
          </div>
          <button className="ms-3 px-4 py-1.5 border-2 border-white rounded-md text-sm font-bold hover:bg-white/10 transition-colors">
            متابعة
          </button>
        </div>
        {video.title && <h3 className="text-lg font-bold mb-1">{video.title}</h3>}
        {video.description && <p className="text-sm text-white/90 line-clamp-2 mb-3">{video.description}</p>}
        {/* موسيقى — مثل TikTok */}
        <div className="flex items-center gap-2 text-sm">
          <Music className="size-4" />
          <div className="overflow-hidden whitespace-nowrap">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              {video.category || "الصوت الأصلي"} · {video.user.fullName} · {video.category || "الصوت الأصلي"} · {video.user.fullName}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* أزرار التفاعل على يسار (RTL) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 start-4 flex flex-col gap-5 z-20"
      >
        {/* Avatar + متابعة */}
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-full bg-primary text-white font-bold border-2 border-white">
            {video.user.fullName.slice(0, 1)}
          </div>
          <button className="absolute -bottom-1 start-1/2 -translate-x-1/2 size-5 bg-red-500 rounded-full flex items-center justify-center text-white">
            <Plus className="size-3" />
          </button>
        </div>

        {/* إعجاب */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white">
          <Heart className={`size-8 ${liked ? "fill-red-500 text-red-500" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium tabular-nums">{likesCount}</span>
        </button>

        {/* تعليقات */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 text-white">
          <MessageCircle className="size-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium tabular-nums">{video.comments}</span>
        </button>

        {/* حفظ */}
        <button onClick={handleBookmark} className="flex flex-col items-center gap-1 text-white">
          <Bookmark className={`size-8 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium">حفظ</span>
        </button>

        {/* مشاركة */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 text-white">
          <Share2 className="size-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium tabular-nums">{video.shares}</span>
        </button>

        {/* قرص الموسيقى الدوّار */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="size-12 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center"
        >
          <Music className="size-5 text-white" />
        </motion.div>
      </motion.div>

      {/* لوحة التعليقات (Sheet) */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="absolute bottom-0 inset-x-0 h-[70%] bg-background rounded-t-2xl z-30 overflow-y-auto"
            dir="rtl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{video.comments} تعليق</h3>
                <button onClick={() => setShowComments(false)} className="text-2xl">×</button>
              </div>
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="size-8 mx-auto mb-2 opacity-40" />
                كن أول من يعلّق على هذا الفيديو
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
