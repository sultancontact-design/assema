"use client";
import * as React from "react";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { Play, Eye, Heart, MessageCircle, Share2, Video as VideoIcon, Plus } from "lucide-react";
import Link from "next/link";

interface VideoItem {
  id: string; title: string; description: string | null;
  sourceUrl: string; sourcePlatform: string; thumbnailUrl: string | null;
  views: number; likes: number; comments: number; shares: number;
  category: string | null; createdAt: string;
  user: { fullName: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "موسيقى", COOKING: "طبخ", SPORTS: "رياضة", COMEDY: "كوميديا",
  EDUCATION: "تعليمي", RELIGIOUS: "ديني", FAMILY: "عائلي", OTHER: "آخر",
};
const PLATFORM_COLORS: Record<string, string> = {
  TIKTOK: "bg-pink-100 text-pink-700 dark:bg-pink-900/30",
  YOUTUBE: "bg-red-100 text-red-700 dark:bg-red-900/30",
  INSTAGRAM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
  FACEBOOK: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
};

export function VideoFeedClient({ initialVideos }: { initialVideos: VideoItem[] }) {
  const [videos] = React.useState(initialVideos);

  return (
    <div className="flex flex-col">
      <PageHero
        title="فيديوهات الحي"
        subtitle="مقاطع من حيّ سيدي يوسف بن علي — فعاليات، لحظات، نصائح، وقصص."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="فيديوهات الحي"
        badge={`${videos.length} فيديو`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Add video button */}
        <div className="flex justify-end">
          <Link href="/community/videos/add">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90">
              <Plus className="size-4" />
              شارك فيديو
            </button>
          </Link>
        </div>

        {/* Bento Grid of videos */}
        {videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <VideoIcon className="size-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-lg">لا توجد فيديوهات بعد</p>
              <p className="text-sm mt-1">كن أول من يشارك فيديو من الحي!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v, idx) => (
              <Link key={v.id} href={`/videos/${v.id}`} className={`block group ${idx === 0 ? "sm:col-span-2 lg:col-span-2 row-span-2" : ""}`}>
                <Card className="overflow-hidden warm-shadow lift-on-hover h-full">
                  {/* Thumbnail or gradient */}
                  <div className={`relative ${idx === 0 ? "h-64" : "h-40"} bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 grid place-items-center`}>
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <Play className={`text-foreground/30 ${idx === 0 ? "size-16" : "size-10"}`} />
                    )}
                    <span className="absolute top-3 end-3">
                      <Badge className={`${PLATFORM_COLORS[v.sourcePlatform] ?? "bg-muted"} text-[10px]`}>
                        {v.sourcePlatform}
                      </Badge>
                    </span>
                    {idx === 0 && v.category && (
                      <span className="absolute bottom-3 start-3">
                        <Badge className="bg-primary text-primary-foreground text-[10px]">
                          {CATEGORY_LABELS[v.category] ?? v.category}
                        </Badge>
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className={`font-heading font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors ${idx === 0 ? "text-lg" : "text-sm"}`}>
                      {v.title}
                    </h3>
                    {v.description && (
                      <p className={`text-muted-foreground line-clamp-2 ${idx === 0 ? "text-sm" : "text-xs"}`}>{v.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/60">
                      <span className="flex items-center gap-1"><Eye className="size-3" />{formatNumber(v.views)}</span>
                      <span className="flex items-center gap-1"><Heart className="size-3" />{formatNumber(v.likes)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="size-3" />{formatNumber(v.comments)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{v.user.fullName} · {formatDateArabic(new Date(v.createdAt))}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
