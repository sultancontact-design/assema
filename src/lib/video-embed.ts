// ===================================================================
//  video-embed.ts v50.0 — thumbnails for ALL platforms
// ===================================================================

export type VideoPlatform =
  | "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "FACEBOOK"
  | "TWITTER" | "VIMEO" | "DAILYMOTION" | "TWITCH"
  | "STREAMABLE" | "SOUNDCLOUD" | "DIRECT" | "IFRAME";

export function detectPlatform(url: string): VideoPlatform {
  if (!url) return "IFRAME";
  if (/youtube\.com|youtu\.be/i.test(url)) return "YOUTUBE";
  if (/tiktok\.com/i.test(url)) return "TIKTOK";
  if (/instagram\.com/i.test(url)) return "INSTAGRAM";
  if (/facebook\.com|fb\.watch/i.test(url)) return "FACEBOOK";
  if (/twitter\.com|x\.com/i.test(url)) return "TWITTER";
  if (/vimeo\.com/i.test(url)) return "VIMEO";
  if (/dailymotion\.com|dai\.ly/i.test(url)) return "DAILYMOTION";
  if (/twitch\.tv/i.test(url)) return "TWITCH";
  if (/streamable\.com/i.test(url)) return "STREAMABLE";
  if (/soundcloud\.com/i.test(url)) return "SOUNDCLOUD";
  if (/\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(url)) return "DIRECT";
  return "IFRAME";
}

export function getEmbedUrl(url: string): { embed: string; type: "iframe" | "video" } | null {
  if (!url) return null;
  const platform = detectPlatform(url);
  if (platform === "YOUTUBE") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
    if (match) return { embed: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`, type: "iframe" };
  }
  if (platform === "TIKTOK") {
    const match = url.match(/\/video\/(\d+)/);
    if (match) return { embed: `https://www.tiktok.com/embed/v2/${match[1]}`, type: "iframe" };
  }
  if (platform === "INSTAGRAM") {
    const match = url.match(/instagram\.com\/(reel|p|tv)\/([^/?]+)/);
    if (match) return { embed: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`, type: "iframe" };
  }
  if (platform === "FACEBOOK") {
    return { embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`, type: "iframe" };
  }
  if (platform === "VIMEO") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return { embed: `https://player.vimeo.com/video/${match[1]}`, type: "iframe" };
  }
  if (platform === "DAILYMOTION") {
    const match = url.match(/(?:video\/|dai\.ly\/)([^_/?]+)/);
    if (match) return { embed: `https://www.dailymotion.com/embed/video/${match[1]}`, type: "iframe" };
  }
  if (platform === "TWITCH") {
    const vid = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (vid) return { embed: `https://player.twitch.tv/?video=${vid[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`, type: "iframe" };
    const ch = url.match(/twitch\.tv\/([^/?]+)/);
    if (ch) return { embed: `https://player.twitch.tv/?channel=${ch[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`, type: "iframe" };
  }
  if (platform === "TWITTER") {
    const match = url.match(/status\/(\d+)/);
    if (match) return { embed: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`, type: "iframe" };
  }
  if (platform === "STREAMABLE") {
    const match = url.match(/streamable\.com\/([^/?]+)/);
    if (match) return { embed: `https://streamable.com/e/${match[1]}`, type: "iframe" };
  }
  if (platform === "DIRECT") return { embed: url, type: "video" };
  return { embed: url, type: "iframe" };
}

// ═══ getThumbnail — يرجع صورة مصغّرة لكل منصة ═══
export function getThumbnail(url: string): string | null {
  if (!url) return null;
  const platform = detectPlatform(url);

  // YouTube — مجاني ومباشر
  if (platform === "YOUTUBE") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }

  // Vimeo — مجاني
  if (platform === "VIMEO") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://vumbnail.com/${match[1]}.jpg`;
  }

  // TikTok / Instagram / Facebook / Twitter / أي موقع — استخدم thum.io
  // thum.io خدمة مجانية لالتقاط صور من أي URL (بدون API key)
  if (platform === "TIKTOK" || platform === "INSTAGRAM" || platform === "FACEBOOK" || platform === "TWITTER" || platform === "IFRAME") {
    return `https://image.thum.io/get/width/400/crop/600/${url}`;
  }

  // Dailymotion
  if (platform === "DAILYMOTION") {
    const match = url.match(/(?:video\/|dai\.ly\/)([^_/?]+)/);
    if (match) return `https://www.dailymotion.com/thumbnail/video/${match[1]}`;
  }

  // Streamable
  if (platform === "STREAMABLE") {
    const match = url.match(/streamable\.com\/([^/?]+)/);
    if (match) return `https://image.thum.io/get/width/400/crop/600/${url}`;
  }

  // DIRECT — لا thumbnail
  return null;
}

// ═══ getCategoryImage — صورة افتراضية حسب فئة المقال ═══
export function getCategoryImage(category?: string | null): string {
  const images: Record<string, string> = {
    HEALTH: "https://images.unsplash.com/photo-1505751172876-fa9706c2c2f0?w=400&h=400&fit=crop",
    FINANCE: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&h=400&fit=crop",
    RELIGIOUS: "https://images.unsplash.com/photo-1542816417-0983c9c9ad86?w=400&h=400&fit=crop",
    PARENTING: "https://images.unsplash.com/photo-1517677208171-0d2c76273335?w=400&h=400&fit=crop",
    EDUCATION: "https://images.unsplash.com/photo-1503676265923-48415fb5e6e3?w=400&h=400&fit=crop",
    COMMUNITY: "https://images.unsplash.com/photo-1559027615-cd4628e35c7d?w=400&h=400&fit=crop",
    MUSIC: "https://images.unsplash.com/photo-1511678278676-0d0e9a1c0cd0?w=400&h=400&fit=crop",
    COOKING: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    SPORTS: "https://images.unsplash.com/photo-1517649763963-0c1cd9b5fb6b?w=400&h=400&fit=crop",
    COMEDY: "https://images.unsplash.com/photo-1517457370909-e6c1f3f4f4a0?w=400&h=400&fit=crop",
    FAMILY: "https://images.unsplash.com/photo-1511895279-series-family?w=400&h=400&fit=crop",
  };
  return images[category || ""] || "https://images.unsplash.com/photo-1495020689067-95885b52a77e?w=400&h=400&fit=crop";
}

// ═══ extractFirstImage — استخراج أول صورة من HTML content ═══
export function extractFirstImage(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}
