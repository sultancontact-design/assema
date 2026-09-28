"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX,
  ExternalLink, Loader2,
} from "lucide-react";
import { detectPlatform, getEmbedUrl } from "@/lib/video-platforms";

// vidflowx — universal video player (supports ALL platforms + direct files)
const VideoPlayer = dynamic(() => import("vidflowx").then((m: any) => m.VideoPlayer || m.default), {
  ssr: false,
  loading: () => <VideoLoader />,
});

// react-player fallback (for platforms vidflowx might not support)
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => <VideoLoader />,
});

function VideoLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
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
  user: { id: string; name: string; avatar: string | null; district: { nameAr: string } | null };
}

export function VideoCard({ video, isActive }: { video: VideoItem; isActive: boolean }) {
  const [liked, setLiked] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(video.likes || 0);
  const [muted, setMuted] = React.useState(true);
  const [showComments, setShowComments] = React.useState(false);

  const platform = detectPlatform(video.sourceUrl);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try { await fetch(`/api/videos/${video.id}/like`, { method: "POST" }); } catch {
      setLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    await fetch(`/api/videos/${video.id}/bookmark`, { method: "POST" }).catch(() => {});
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/videos/${video.id}`;
    if (navigator.share) { try { await navigator.share({ title: video.title, url: video.sourceUrl }); } catch {} }
    else { navigator.clipboard.writeText(video.sourceUrl); }
    await fetch(`/api/videos/${video.id}/share`, { method: "POST" }).catch(() => {});
  };

  // ═══ رندر الفيديو حسب المنصة ═══
  const renderVideo = () => {
    // TikTok → iframe embed
    if (platform === "TIKTOK") {
      const embedUrl = getEmbedUrl(video.sourceUrl, platform);
      return (
        <iframe src={embedUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" />
      );
    }

    // Instagram → iframe embed
    if (platform === "INSTAGRAM") {
      const embedUrl = getEmbedUrl(video.sourceUrl, platform);
      return (
        <iframe src={embedUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen" allowFullScreen scrolling="no" />
      );
    }

    // كل المنصات الأخرى → vidflowx (universal player)
    if (platform !== "IFRAME") {
      return (
        <VideoPlayer
          src={video.sourceUrl}
          autoPlay={isActive}
          muted={muted}
          controls
          style={{ width: "100%", height: "100%" }}
          onError={() => console.warn("vidflowx error:", video.sourceUrl)}
        />
      );
    }

    // IFRAME → محاولة iframe مباشر (لأي موقع)
    return (
      <iframe src={video.sourceUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms" />
    );
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="absolute inset-0">{renderVideo()}</div>

      {/* زر فتح المصدر */}
      <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer"
        className="absolute top-4 end-4 z-30 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
        title="فتح في نافذة جديدة">
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* كتم الصوت */}
      <button onClick={() => setMuted(!muted)}
        className="absolute top-4 start-4 z-30 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors">
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* تعتيم */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* معلومات */}
      <div className="absolute bottom-20 end-4 start-20 text-white z-20 pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          {video.user?.avatar ? (
            <img src={video.user.avatar} className="w-12 h-12 rounded-full border-2 border-white object-cover" alt="" />
          ) : (
            <div className="grid w-12 h-12 place-items-center rounded-full bg-gradient-to-br from-[#FE2C55] to-[#8B5CF6] text-white font-bold border-2 border-white">
              {(video.user?.name || "U").slice(0, 1)}
            </div>
          )}
          <div>
            <div className="font-bold">{video.user?.name || "مستخدم"}</div>
            <div className="text-xs text-white/70">{video.user?.district?.nameAr || ""}</div>
          </div>
          <button className="ms-3 px-4 py-1.5 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] rounded-full text-sm font-bold">
            متابعة
          </button>
        </div>
        {video.title && <h3 className="text-lg font-bold mb-1">{video.title}</h3>}
        {video.description && <p className="text-sm text-white/80 line-clamp-2 mb-3">{video.description}</p>}
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4" />
          <div className="overflow-hidden whitespace-nowrap">
            <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="inline-block">
              {video.category || "الصوت الأصلي"} · {video.user?.name || "مستخدم"} · {platform}
            </motion.div>
          </div>
        </div>
      </div>

      {/* أزرار التفاعل */}
      <div className="absolute bottom-20 start-4 flex flex-col gap-5 z-20">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white">
          <Heart className={`w-8 h-8 ${liked ? "fill-red-500 text-red-500" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium">{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1 text-white">
          <MessageCircle className="w-8 h-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium">{video.comments || 0}</span>
        </button>
        <button onClick={handleBookmark} className="flex flex-col items-center gap-1 text-white">
          <Bookmark className={`w-8 h-8 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium">حفظ</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1 text-white">
          <Share2 className="w-8 h-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
          <span className="text-xs font-medium">{video.shares || 0}</span>
        </button>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* تعليقات */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }}
            className="absolute bottom-0 inset-x-0 h-[60%] bg-background rounded-t-2xl z-30 overflow-y-auto" dir="rtl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base">{video.comments || 0} تعليق</h3>
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
