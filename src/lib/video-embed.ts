// ===================================================================
//  video-embed.ts v46.0 — PURE IFRAME embeds (no external libraries)
//  Works on Vercel because iframes are native HTML, no SSR issues.
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

  // YouTube
  if (platform === "YOUTUBE") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
    if (match) return { embed: `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`, type: "iframe" };
  }

  // TikTok
  if (platform === "TIKTOK") {
    const match = url.match(/\/video\/(\d+)/);
    if (match) return { embed: `https://www.tiktok.com/embed/v2/${match[1]}`, type: "iframe" };
  }

  // Instagram
  if (platform === "INSTAGRAM") {
    const match = url.match(/instagram\.com\/(reel|p|tv)\/([^/?]+)/);
    if (match) return { embed: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`, type: "iframe" };
  }

  // Facebook
  if (platform === "FACEBOOK") {
    return { embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`, type: "iframe" };
  }

  // Vimeo
  if (platform === "VIMEO") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return { embed: `https://player.vimeo.com/video/${match[1]}`, type: "iframe" };
  }

  // Dailymotion
  if (platform === "DAILYMOTION") {
    const match = url.match(/(?:video\/|dai\.ly\/)([^_/?]+)/);
    if (match) return { embed: `https://www.dailymotion.com/embed/video/${match[1]}`, type: "iframe" };
  }

  // Twitch
  if (platform === "TWITCH") {
    const vid = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (vid) return { embed: `https://player.twitch.tv/?video=${vid[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`, type: "iframe" };
    const ch = url.match(/twitch\.tv\/([^/?]+)/);
    if (ch) return { embed: `https://player.twitch.tv/?channel=${ch[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`, type: "iframe" };
  }

  // Twitter
  if (platform === "TWITTER") {
    const match = url.match(/status\/(\d+)/);
    if (match) return { embed: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`, type: "iframe" };
  }

  // Streamable
  if (platform === "STREAMABLE") {
    const match = url.match(/streamable\.com\/([^/?]+)/);
    if (match) return { embed: `https://streamable.com/e/${match[1]}`, type: "iframe" };
  }

  // Direct video file
  if (platform === "DIRECT") {
    return { embed: url, type: "video" };
  }

  // Any other URL → iframe
  return { embed: url, type: "iframe" };
}

export function getThumbnail(url: string): string | null {
  const platform = detectPlatform(url);
  if (platform === "YOUTUBE") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
  }
  if (platform === "VIMEO") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://vumbnail.com/${match[1]}.jpg`;
  }
  return null;
}
