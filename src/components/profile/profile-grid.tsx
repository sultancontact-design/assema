"use client";
import Link from "next/link";
import { Play, Heart, MessageCircle } from "lucide-react";

export function ProfileGrid({ videos, posts }: { videos: any[]; posts: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 mt-4">
      {videos?.map((video: any) => (
        <Link key={video.id} href={`/videos/${video.id}`} className="relative aspect-square group bg-muted overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FE2C55]/30 via-[#25F4EE]/15 to-[#8B5CF6]/30" />
          <Play className="absolute top-2 end-2 size-4 text-white" fill="white" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <div className="flex gap-4 text-white text-sm">
              <span className="flex items-center gap-1"><Heart className="size-4 fill-current" /> {video.likes || 0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="size-4" /> {video.comments || 0}</span>
            </div>
          </div>
        </Link>
      ))}
      {posts?.map((post: any) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="relative aspect-square group bg-muted overflow-hidden">
          {post.coverImage && <img src={post.coverImage} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <span className="text-white text-sm flex items-center gap-1"><Heart className="size-4" /> {post.likes || 0}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
