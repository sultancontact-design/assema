// ===================================================================
//  video-platforms.ts v45.0 — كشف المنصة + embed URLs
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

export function getEmbedUrl(url: string, platform: VideoPlatform): string {
  if (platform === "TIKTOK") {
    const id = url.match(/\/video\/(\d+)/)?.[1];
    return id ? `https://www.tiktok.com/embed/v2/${id}` : url;
  }
  if (platform === "INSTAGRAM") {
    const match = url.match(/instagram\.com\/(reel|p|tv)\/([^/?]+)/);
    return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed/` : url;
  }
  return url;
}

export function getVideoThumbnail(url: string, platform: VideoPlatform): string | null {
  if (platform === "YOUTUBE") {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
  }
  if (platform === "VIMEO") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://vumbnail.com/${match[1]}.jpg` : null;
  }
  return null;
}
