"use client";
import Link from "next/link";
import { Play, Heart, MessageCircle, Eye } from "lucide-react";
import { getThumbnail, detectPlatform, getCategoryImage, extractFirstImage } from "@/lib/video-embed";

export function ProfileGrid({ videos, posts }: { videos: any[]; posts: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {/* Videos */}
      {videos?.map((video: any) => {
        const thumb = getThumbnail(video.sourceUrl);
        const platform = detectPlatform(video.sourceUrl);
        return (
          <Link key={video.id} href={`/videos?id=${video.id}`} className="relative aspect-square group overflow-hidden rounded-sm bg-gradient-to-br from-[#FE2C55]/30 via-[#25F4EE]/15 to-[#8B5CF6]/30">
            {thumb ? (
              <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-xs font-bold opacity-50">{platform}</div>
              </div>
            )}
            {/* Platform badge */}
            <div className="absolute top-1.5 end-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">{platform}</div>
            {/* Play icon */}
            <Play className="absolute top-1.5 start-1.5 w-3 h-3 text-white drop-shadow-lg" fill="white" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-white text-xs font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {video.likes || 0}
              </div>
              <div className="flex items-center gap-1 text-white text-xs font-bold">
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                {video.comments || 0}
              </div>
            </div>
          </Link>
        );
      })}

      {/* Posts */}
      {posts?.map((post: any) => {
        // Try coverImage → extract from content → category fallback
        const thumb = post.coverImage || extractFirstImage(post.content || post.excerpt || "") || getCategoryImage(post.category);
        return (
          <Link key={post.id} href={`/blog/${post.slug}`} className="relative aspect-square group overflow-hidden rounded-sm bg-muted">
            <img src={thumb} alt={post.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = getCategoryImage(post.category); }} />
            {/* Type badge */}
            <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">مقال</div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-white text-xs font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {post.likes || 0}
              </div>
              <div className="flex items-center gap-1 text-white text-xs font-bold">
                <Eye className="w-3.5 h-3.5" />
                {post.views || 0}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
