"use client";
import Link from "next/link";
import { Play, Heart, MessageCircle, Eye } from "lucide-react";
import { getThumbnail, detectPlatform } from "@/lib/video-embed";

export function ProfileGrid({ videos, posts }: { videos: any[]; posts: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {videos?.map((video: any) => {
        const thumb = getThumbnail(video.sourceUrl);
        const platform = detectPlatform(video.sourceUrl);
        return (
          <Link key={video.id} href={`/videos?id=${video.id}`} className="relative aspect-square group overflow-hidden rounded-sm bg-gradient-to-br from-red-500/20 via-green-500/20 to-purple-600/20">
            {thumb ? <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> :
              <div className="absolute inset-0 flex items-center justify-center"><div className="text-white text-xs font-bold opacity-50">{platform}</div></div>}
            <div className="absolute top-2 end-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">{platform}</div>
            <Play className="absolute top-2 start-2 w-4 h-4 text-white drop-shadow-lg" fill="white" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white text-sm font-bold"><Heart className="w-4 h-4 fill-current" />{video.likes || 0}</div>
              <div className="flex items-center gap-1 text-white text-sm font-bold"><MessageCircle className="w-4 h-4 fill-current" />{video.comments || 0}</div>
            </div>
          </Link>
        );
      })}
      {posts?.map((post: any) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="relative aspect-square group overflow-hidden rounded-sm bg-muted">
          {post.coverImage ? <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> :
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20"><span className="text-xs font-bold text-foreground/50 px-2 text-center line-clamp-2">{post.title}</span></div>}
          <div className="absolute top-2 start-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">مقال</div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-white text-sm font-bold"><Heart className="w-4 h-4 fill-current" />{post.likes || 0}</div>
            <div className="flex items-center gap-1 text-white text-sm font-bold"><Eye className="w-4 h-4" />{post.views || 0}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
