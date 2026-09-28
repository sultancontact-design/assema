"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { VideoCard } from "@/components/video/video-card";

export default function VideosPage() {
  const [videos, setVideos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/videos/feed")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setVideos(Array.isArray(d.videos) ? d.videos : []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // scroll detection
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;
    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight);
      if (index !== activeIndex && index >= 0 && index < videos.length) {
        setActiveIndex(index);
      }
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [videos, activeIndex]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        <div className="text-center text-white p-8">
          <p className="text-xl mb-4">خطأ: {error}</p>
          <button onClick={() => location.reload()} className="px-6 py-3 bg-white text-black rounded-full font-bold">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        <div className="text-center text-white p-8">
          <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-6 flex items-center justify-center">
            <Plus className="w-10 h-10" />
          </div>
          <p className="text-2xl font-bold mb-2">لا توجد فيديوهات بعد</p>
          <p className="text-white/80 mb-6">كن أول من يشارك فيديو</p>
          <Link href="/community/videos/add" className="inline-block px-6 py-3 bg-white text-black rounded-full font-bold">شارك أول فيديو</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FE2C55]/10 via-[#25F4EE]/5 to-[#8B5CF6]/10 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="sticky top-0 z-50 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-4 rounded-t-3xl shadow-lg mb-4">
          <h1 className="text-white text-2xl font-bold text-center">الفيديوهات</h1>
          <p className="text-white/80 text-xs text-center">{videos.length} فيديو</p>
        </div>

        <div className="relative bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-900" style={{ height: "calc(100vh - 14rem)", maxHeight: "700px" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30" />
          <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {videos.map((video, i) => (
              <div key={video.id} className="h-full w-full snap-start snap-always" onMouseEnter={() => setActiveIndex(i)} onTouchStart={() => setActiveIndex(i)}>
                <VideoCard video={video} isActive={i === activeIndex} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/community/videos/add" className="inline-block px-6 py-3 bg-white text-black rounded-full font-bold shadow-lg">+ شارك فيديو</Link>
        </div>
      </div>
    </div>
  );
}
