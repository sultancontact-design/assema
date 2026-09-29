"use client";
import * as React from "react";
import { Loader2, Plus, Home, Search, User, Heart } from "lucide-react";
import Link from "next/link";
import { VideoCard } from "@/components/video/video-card";

export default function VideosPage() {
  const [videos, setVideos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/videos/feed").then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setVideos(Array.isArray(d.videos) ? d.videos : []))
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const c = containerRef.current; if (!c) return;
    const h = () => { const i = Math.round(c.scrollTop / c.clientHeight); if (i !== activeIndex && i >= 0 && i < videos.length) setActiveIndex(i); };
    c.addEventListener("scroll", h, { passive: true }); return () => c.removeEventListener("scroll", h);
  }, [videos.length, activeIndex]);

  if (loading) return (<div className="h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>);
  if (error) return (<div className="h-screen flex items-center justify-center bg-black text-white p-8"><div className="text-center"><p className="text-xl mb-4">خطأ: {error}</p><button onClick={() => location.reload()} className="px-6 py-3 bg-white text-black rounded-full font-bold">إعادة المحاولة</button></div></div>);
  if (videos.length === 0) return (<div className="h-screen flex items-center justify-center bg-black text-white p-8"><div className="text-center"><div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-6 flex items-center justify-center"><Plus className="w-10 h-10" /></div><p className="text-2xl font-bold mb-2">لا توجد فيديوهات بعد</p><p className="text-white/60 mb-6">كن أول من يشارك فيديو</p><Link href="/community/videos/add" className="inline-block px-8 py-3 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] rounded-full font-bold">شارك أول فيديو</Link></div></div>);

  return (
    <div className="h-screen bg-black overflow-hidden relative" dir="rtl">
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3"><Link href="/" className="text-white"><Home className="w-6 h-6" /></Link><span className="text-white font-bold text-lg">الفيديوهات</span></div>
        <div className="flex items-center gap-3"><button className="text-white"><Search className="w-6 h-6" /></button><Link href="/community/videos/add" className="text-white"><Plus className="w-6 h-6" /></Link></div>
      </div>
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide" style={{ scrollSnapType: "y mandatory" }}>
        {videos.map((video, i) => (<div key={video.id} className="h-screen w-full snap-start snap-always" style={{ scrollSnapAlign: "start" }}><VideoCard video={video} isActive={i === activeIndex} /></div>))}
      </div>
      <div className="absolute bottom-0 inset-x-0 z-40 flex items-center justify-around p-4 bg-gradient-to-t from-black/90 to-transparent">
        <Link href="/" className="flex flex-col items-center text-white/60 hover:text-white"><Home className="w-6 h-6" /><span className="text-xs mt-1">الرئيسية</span></Link>
        <Link href="/videos" className="flex flex-col items-center text-white"><Plus className="w-6 h-6" /><span className="text-xs mt-1">الفيديوهات</span></Link>
        <Link href="/community/videos/add" className="flex flex-col items-center text-white/60 hover:text-white"><div className="w-10 h-8 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] rounded-lg flex items-center justify-center"><Plus className="w-5 h-5" /></div></Link>
        <Link href="/community/following" className="flex flex-col items-center text-white/60 hover:text-white"><Heart className="w-6 h-6" /><span className="text-xs mt-1">المتابَعون</span></Link>
        <Link href="/community/profile" className="flex flex-col items-center text-white/60 hover:text-white"><User className="w-6 h-6" /><span className="text-xs mt-1">حسابي</span></Link>
      </div>
    </div>
  );
}
