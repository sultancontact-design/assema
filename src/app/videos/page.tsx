"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { VideoCard } from "@/components/video/video-card";

export default function VideosPage() {
  const [videos, setVideos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/videos/feed")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setVideos(Array.isArray(d.videos) ? d.videos : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // scroll detection for active video + view tracking
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;
    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight);
      if (index !== activeIndex && index >= 0 && index < videos.length) {
        setActiveIndex(index);
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="size-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-500 mb-4">خطأ: {error}</p>
          <button onClick={() => location.reload()} className="px-4 py-2 bg-primary text-white rounded">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        <div className="text-center text-white p-8">
          <p className="text-2xl mb-4">لا توجد فيديوهات بعد</p>
          <a href="/community/videos/add" className="px-6 py-3 bg-white text-black rounded-full font-bold">
            شارك أول فيديو
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FE2C55]/10 via-[#25F4EE]/5 to-[#8B5CF6]/10 py-8">
      <div className="max-w-md mx-auto">
        {/* رأس الصفحة */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-4 rounded-t-3xl shadow-lg mb-4">
          <h1 className="text-white text-2xl font-bold text-center">الفيديوهات</h1>
          <p className="text-white/80 text-xs text-center">{videos.length} فيديو</p>
        </div>

        {/* إطار الهاتف */}
        <div
          className="relative bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-900 mx-auto"
          style={{ height: "calc(100vh - 12rem)", maxHeight: "700px" }}
        >
          {/* الشريط العلوي (notch) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30" />

          {/* المحتوى — scrollable */}
          <div
            ref={containerRef}
            className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          >
            {videos.map((video, i) => (
              <div
                key={video.id}
                className="h-full w-full snap-start snap-always flex items-center justify-center relative"
              >
                <VideoCard video={video} isActive={i === activeIndex} />
              </div>
            ))}
          </div>
        </div>

        {/* زر إضافة */}
        <div className="text-center mt-4">
          <a
            href="/community/videos/add"
            className="inline-block px-6 py-3 bg-white text-black rounded-full font-bold shadow-lg"
          >
            + شارك فيديو
          </a>
        </div>
      </div>
    </div>
  );
}
