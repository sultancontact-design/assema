"use client";
import * as React from "react";
import { Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { detectPlatform, getEmbedUrl } from "@/lib/video-embed";

export function VideoCard({ video, isActive }: { video: any; isActive: boolean }) {
  const [liked, setLiked] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(video.likes || 0);
  const [sharesCount, setSharesCount] = React.useState(video.shares || 0);
  const [muted, setMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const embed = getEmbedUrl(video.sourceUrl);
  const platform = detectPlatform(video.sourceUrl);

  React.useEffect(() => {
    if (embed?.type === "video" && videoRef.current) {
      if (isActive) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isActive, embed]);

  const handleLike = async () => {
    const n = !liked; setLiked(n);
    setLikesCount(p => n ? p + 1 : Math.max(0, p - 1));
    try { await fetch(`/api/videos/${video.id}/like`, { method: "POST" }); } catch { setLiked(!n); setLikesCount(p => n ? p - 1 : p + 1); }
  };
  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try { await fetch(`/api/videos/${video.id}/bookmark`, { method: "POST" }); } catch {}
  };
  const handleShare = async () => {
    setSharesCount(p => p + 1);
    const url = `${window.location.origin}/videos/${video.id}`;
    if (navigator.share) { try { await navigator.share({ title: video.title, url }); } catch {} }
    else { navigator.clipboard.writeText(url); }
    fetch(`/api/videos/${video.id}/share`, { method: "POST" }).catch(() => {});
  };

  const renderVideo = () => {
    if (!embed) return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black">
        <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">فتح في المصدر</a>
      </div>
    );
    if (embed.type === "video") return (
      <video ref={videoRef} src={embed.embed} loop muted={muted} playsInline className="w-full h-full object-contain" onClick={() => { if (videoRef.current) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); }} />
    );
    return (
      <iframe src={embed.embed} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" allowFullScreen scrolling="no" loading="lazy" />
    );
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="absolute inset-0">{renderVideo()}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="absolute top-12 end-4 z-30 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80" title="فتح في المصدر"><ExternalLink className="w-4 h-4" /></a>
      <button onClick={() => setMuted(!muted)} className="absolute top-12 start-4 z-30 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>

      <div className="absolute bottom-24 end-4 start-20 text-white z-20">
        <div className="flex items-center gap-3 mb-3">
          {video.user?.avatar ? <img src={video.user.avatar} className="w-12 h-12 rounded-full border-2 border-white object-cover" alt="" /> :
            <div className="grid w-12 h-12 place-items-center rounded-full bg-gradient-to-br from-[#FE2C55] to-[#8B5CF6] text-white font-bold border-2 border-white">{(video.user?.name || "U").slice(0,1)}</div>}
          <div><div className="font-bold">{video.user?.name || "مستخدم"}</div><div className="text-xs text-white/70">{video.user?.district?.nameAr || ""}</div></div>
          <button className="ms-3 px-4 py-1.5 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] rounded-full text-sm font-bold">متابعة</button>
        </div>
        {video.title && <h3 className="text-lg font-bold mb-1">{video.title}</h3>}
        {video.description && <p className="text-sm text-white/80 line-clamp-2 mb-3">{video.description}</p>}
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4" />
          <div className="overflow-hidden whitespace-nowrap"><motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="inline-block">{video.category || "الصوت الأصلي"} · {video.user?.name || "مستخدم"} · {platform}</motion.div></div>
        </div>
      </div>

      <div className="absolute bottom-24 start-4 flex flex-col gap-5 z-20">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"><Heart className={`w-8 h-8 ${liked ? "fill-red-500 text-red-500" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /><span className="text-xs font-medium">{likesCount}</span></button>
        <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"><MessageCircle className="w-8 h-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /><span className="text-xs font-medium">{video.comments || 0}</span></button>
        <button onClick={handleBookmark} className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"><Bookmark className={`w-8 h-8 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /><span className="text-xs font-medium">حفظ</span></button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"><Share2 className="w-8 h-8" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /><span className="text-xs font-medium">{sharesCount}</span></button>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] flex items-center justify-center"><Music className="w-5 h-5 text-white" /></motion.div>
      </div>
    </div>
  );
}
