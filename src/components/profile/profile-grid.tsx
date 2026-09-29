"use client";
import Link from "next/link";
import { Play, Heart, MessageCircle, Eye, BookOpen, Video } from "lucide-react";
import { detectPlatform } from "@/lib/video-embed";

const PLATFORM_COLORS: Record<string, [string, string]> = {
  YOUTUBE: ["#FF0000", "#CC0000"],
  TIKTOK: ["#FE2C55", "#25F4EE"],
  INSTAGRAM: ["#833AB4", "#FD1D1D"],
  FACEBOOK: ["#1877F2", "#0A5BC4"],
  TWITTER: ["#1DA1F2", "#0E71A8"],
  VIMEO: ["#19B7EA", "#17A0CC"],
  DAILYMOTION: ["#0066DC", "#004FB0"],
  TWITCH: ["#9146FF", "#7000FF"],
  STREAMABLE: ["#0F0F0F", "#2D2D2D"],
  SOUNDCLOUD: ["#FF5500", "#CC4400"],
  DIRECT: ["#22C55E", "#16A34A"],
  IFRAME: ["#6B7280", "#4B5563"],
};

const CATEGORY_COLORS: Record<string, [string, string]> = {
  HEALTH: ["#EF4444", "#B91C1C"],
  FINANCE: ["#F59E0B", "#D97706"],
  RELIGIOUS: ["#10B981", "#059669"],
  PARENTING: ["#EC4899", "#DB2777"],
  EDUCATION: ["#3B82F6", "#2563EB"],
  COMMUNITY: ["#8B5CF6", "#7C3AED"],
  MUSIC: ["#F472B6", "#EC4899"],
  COOKING: ["#FB923C", "#F97316"],
  SPORTS: ["#22C55E", "#16A34A"],
  COMEDY: ["#FBBF24", "#F59E0B"],
  FAMILY: ["#06B6D4", "#0891B2"],
  OTHER: ["#64748B", "#475569"],
};

export function ProfileGrid({ videos, posts }: { videos: any[]; posts: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {/* Videos */}
      {videos?.map((video: any) => {
        const platform = detectPlatform(video.sourceUrl);
        const [c1, c2] = PLATFORM_COLORS[platform] || PLATFORM_COLORS.IFRAME;

        // YouTube + Vimeo have reliable free thumbnails
        let thumb: string | null = null;
        if (platform === "YOUTUBE") {
          const m = video.sourceUrl?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
          if (m) thumb = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
        } else if (platform === "VIMEO") {
          const m = video.sourceUrl?.match(/vimeo\.com\/(\d+)/);
          if (m) thumb = `https://vumbnail.com/${m[1]}.jpg`;
        }
        // video.thumbnailUrl from DB
        if (!thumb && video.thumbnailUrl) thumb = video.thumbnailUrl;

        return (
          <Link key={video.id} href={`/videos?id=${video.id}`} className="relative aspect-square group overflow-hidden rounded-sm">
            {thumb ? (
              <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
                onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.nextElementSibling?.classList.remove("hidden"); }} />
            ) : null}
            {/* Gradient fallback (always rendered, hidden if img succeeds) */}
            <div className={`absolute inset-0 flex items-center justify-center ${thumb ? "hidden" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              <Video className="size-8 text-white/40" />
            </div>

            {/* Platform badge */}
            <div className="absolute top-1.5 end-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">{platform}</div>
            {/* Play icon */}
            <Play className="absolute top-1.5 start-1.5 size-3 text-white drop-shadow-lg" fill="white" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-white text-xs font-bold"><Heart className="size-3.5 fill-current" />{video.likes || 0}</div>
              <div className="flex items-center gap-1 text-white text-xs font-bold"><MessageCircle className="size-3.5 fill-current" />{video.comments || 0}</div>
            </div>
          </Link>
        );
      })}

      {/* Posts */}
      {posts?.map((post: any) => {
        const [c1, c2] = CATEGORY_COLORS[post.category || "OTHER"] || CATEGORY_COLORS.OTHER;
        const thumb = post.coverImage || null;
        const initials = (post.title || "؟").slice(0, 2);

        return (
          <Link key={post.id} href={`/blog/${post.slug}`} className="relative aspect-square group overflow-hidden rounded-sm">
            {thumb ? (
              <img src={thumb} alt={post.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
                onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.nextElementSibling?.classList.remove("hidden"); }} />
            ) : null}
            {/* Gradient fallback */}
            <div className={`absolute inset-0 flex items-center justify-center ${thumb ? "hidden" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              <span className="text-white text-2xl font-extrabold opacity-50">{initials}</span>
            </div>

            {/* Type badge */}
            <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">مقال</div>
            <BookOpen className="absolute top-1.5 end-1.5 size-3 text-white/80" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-white text-xs font-bold"><Heart className="size-3.5 fill-current" />{post.likes || 0}</div>
              <div className="flex items-center gap-1 text-white text-xs font-bold"><Eye className="size-3.5" />{post.views || 0}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
