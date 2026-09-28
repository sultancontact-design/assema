"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX, Loader2,
} from "lucide-react";

// react-social-media-embed — MUST use next/dynamic with ssr:false
// (React.lazy doesn't work in Next.js server-rendered components)
const TikTokEmbed = dynamic(
  () => import("react-social-media-embed").then((m: any) => m.TikTokEmbed),
  { ssr: false, loading: () => <EmbedLoader /> }
);
const InstagramEmbed = dynamic(
  () => import("react-social-media-embed").then((m: any) => m.InstagramEmbed),
  { ssr: false, loading: () => <EmbedLoader /> }
);
const YouTubeEmbed = dynamic(
  () => import("react-social-media-embed").then((m: any) => m.YouTubeEmbed),
  { ssr: false, loading: () => <EmbedLoader /> }
);

function EmbedLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Loader2 className="size-8 text-white animate-spin" />
    </div>
  );
}

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

export function VideoCard({ video, isActive }: { video: VideoItem; isActive: boolean }) {
  const [liked, setLiked] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(video.likes);
  const [muted, setMuted] = React.useState(true);
  const [showComments, setShowComments] = React.useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    try { await fetch(`/api/videos/${video.id}/like`, { method: "POST" }); } catch {}
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try { await fetch(`/api/videos/${video.id}/bookmark`, { method: "POST" }); } catch {}
  };

  const handleShare = async () => {
    const url = `https://assema-sultancontact-design.vercel.app/videos/${video.id}`;
    if (navigator.share) { try { await navigator.share({ title: video.title, url }); } catch {} }
    else { navigator.clipboard.writeText(url); }
    try { await fetch(`/api/videos/${video.id}/share`, { method: "POST" }); } catch {}
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* الفيديو */}
      <div className="absolute inset-0 flex items-center justify-center">
        {video.sourcePlatform === "TIKTOK" && (
          <div className="w-full h-full flex items-center justify-center overflow-y-auto">
            <TikTokEmbed url={video.sourceUrl} width={325} />
          </div>
        )}
        {video.sourcePlatform === "INSTAGRAM" && (
          <div className="w-full h-full flex items-center justify-center overflow-y-auto">
            <InstagramEmbed url={video.sourceUrl} width={328} />
          </div>
        )}
        {video.sourcePlatform === "YOUTUBE" && (
          <div className="w-full h-full">
            <YouTubeEmbed url={video.sourceUrl} width="100%" height="100%" />
          </div>
        )}
        {!["TIKTOK", "INSTAGRAM", "YOUTUBE"].includes(video.sourcePlatform) && (
          <video
            src={video.sourceUrl}
            autoPlay={isActive}
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* طبقة تعتيم */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* كتم الصوت */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 start-4 z-20 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      {/* معلومات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-20 end-4 start-20 text-white z-20"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#FE2C55] to-[#8B5CF6] text-white font-bold border-2 border-white text-sm">
            {video.user.fullName.slice(0, 1)}
          </div>
          <div>
            <div className="font-bold text-sm">{video.user.fullName}</div>
          </div>
          <button className="ms-2 px-3 py-1 bg-gradient-to-r from-[#FE2C55] to-[#8B5CF6] rounded-full text-xs font-bold text-white">
            متابعة
          </button>
        </div>
        {video.title && <h3 className="text-base font-bold mb-1">{video.title}</h3>}
        {video.description && <p className="text-xs text-white/80 line-clamp-2 mb-2">{video.description}</p>}
        <div className="flex items-center gap-2 text-xs">
          <Music className="size-3.5" />
          <div className="overflow-hidden whitespace-nowrap">
            <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="inline-block">
              {video.category || "الصوت الأصلي"} · {video.user.fullName} · {video.category || "الصوت الأصلي"} · {video.user.fullName}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* أزرار التفاعل */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 start-4 flex flex-col gap-4 z-20"
      >
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5 text-white">
          <Heart className={`size-7 ${liked ? "fill-red-500 text-red-500" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-[10px] font-medium tabular-nums">{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-0.5 text-white">
          <MessageCircle className="size-7" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-[10px] font-medium tabular-nums">{video.comments}</span>
        </button>
        <button onClick={handleBookmark} className="flex flex-col items-center gap-0.5 text-white">
          <Bookmark className={`size-7 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-[10px] font-medium">حفظ</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5 text-white">
          <Share2 className="size-7" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-[10px] font-medium tabular-nums">{video.shares}</span>
        </button>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="size-11 rounded-full bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] flex items-center justify-center"
        >
          <Music className="size-4 text-white" />
        </motion.div>
      </motion.div>

      {/* لوحة التعليقات */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="absolute bottom-0 inset-x-0 h-[60%] bg-background rounded-t-2xl z-30 overflow-y-auto"
            dir="rtl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base">{video.comments} تعليق</h3>
                <button onClick={() => setShowComments(false)} className="text-2xl">×</button>
              </div>
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="size-8 mx-auto mb-2 opacity-40" />
                كن أول من يعلّق
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
