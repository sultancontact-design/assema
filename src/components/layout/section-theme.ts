// ===================================================================
//  section-theme.ts — v61.0 الجزء 2
//  هوية لونية مستقلة لكل قسم (Per-Section Color Identity)
//  - كل قسم له primary/secondary/accent + gradient
//  - يُستعمل في PageHero + بيانات CSS متغيّرات (--section-*)
// ===================================================================

export type SectionKey =
  | "home"
  | "feed"
  | "discover"
  | "community"
  | "fund"
  | "events"
  | "services"
  | "store"
  | "blog"
  | "prices"
  | "map"
  | "ethics"
  | "videos"
  | "leaderboard"
  | "gamification"
  | "groups"
  | "messages"
  | "discussions"
  | "initiatives"
  | "profile"
  | "members"
  | "following";

export interface SectionTheme {
  primary: string;        // اللون الأساسي
  secondary: string;      // اللون الثانوي
  accent: string;         // لون التمييز
  background: string;     // خلفية فاتحة
  gradient: string;       // Tailwind gradient classes
  glowColor: string;      // لون التوهّج للظلال
  emoji?: string;         // رمز تعبيري (للتعريف فقط)
}

export const SECTION_THEMES: Record<SectionKey, SectionTheme> = {
  home: {
    primary: "#E85A3D",
    secondary: "#F5B220",
    accent: "#299B6D",
    background: "#FBF8F3",
    gradient: "from-orange-500 via-amber-500 to-emerald-500",
    glowColor: "rgba(232, 90, 61, 0.4)",
    emoji: "🏠",
  },
  feed: {
    primary: "#0EA5E9",
    secondary: "#06B6D4",
    accent: "#F5B220",
    background: "#F0F9FF",
    gradient: "from-sky-500 via-cyan-500 to-blue-500",
    glowColor: "rgba(14, 165, 233, 0.4)",
    emoji: "📡",
  },
  discover: {
    primary: "#8B5CF6",
    secondary: "#EC4899",
    accent: "#F5B220",
    background: "#FAF5FF",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    emoji: "🧭",
  },
  community: {
    primary: "#D97706",
    secondary: "#F59E0B",
    accent: "#E85A3D",
    background: "#FFFBEB",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    glowColor: "rgba(217, 119, 6, 0.4)",
    emoji: "👥",
  },
  fund: {
    primary: "#299B6D",
    secondary: "#F5B220",
    accent: "#E85A3D",
    background: "#F0F9F4",
    gradient: "from-emerald-500 via-teal-500 to-green-500",
    glowColor: "rgba(41, 155, 109, 0.4)",
    emoji: "🤝",
  },
  events: {
    primary: "#FF6B35",
    secondary: "#F7C548",
    accent: "#D62828",
    background: "#FFF8F3",
    gradient: "from-orange-500 via-amber-500 to-red-500",
    glowColor: "rgba(255, 107, 53, 0.4)",
    emoji: "📅",
  },
  services: {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    accent: "#06B6D4",
    background: "#F0F7FF",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    glowColor: "rgba(59, 130, 246, 0.4)",
    emoji: "🛠️",
  },
  store: {
    primary: "#8B5CF6",
    secondary: "#EC4899",
    accent: "#F5B220",
    background: "#FAF5FF",
    gradient: "from-purple-500 via-pink-500 to-fuchsia-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    emoji: "🎁",
  },
  blog: {
    primary: "#DC2626",
    secondary: "#F97316",
    accent: "#FBBF24",
    background: "#FEF2F2",
    gradient: "from-red-500 via-orange-500 to-amber-500",
    glowColor: "rgba(220, 38, 38, 0.4)",
    emoji: "📰",
  },
  prices: {
    primary: "#16A34A",
    secondary: "#84CC16",
    accent: "#F5B220",
    background: "#F0FDF4",
    gradient: "from-green-500 via-lime-500 to-emerald-500",
    glowColor: "rgba(22, 163, 74, 0.4)",
    emoji: "🏷️",
  },
  map: {
    primary: "#0EA5E9",
    secondary: "#06B6D4",
    accent: "#6366F1",
    background: "#F0F9FF",
    gradient: "from-sky-500 via-cyan-500 to-indigo-500",
    glowColor: "rgba(14, 165, 233, 0.4)",
    emoji: "🗺️",
  },
  ethics: {
    primary: "#059669",
    secondary: "#10B981",
    accent: "#F5B220",
    background: "#ECFDF5",
    gradient: "from-emerald-600 via-green-500 to-teal-500",
    glowColor: "rgba(5, 150, 105, 0.4)",
    emoji: "⚖️",
  },
  videos: {
    primary: "#FE2C55",
    secondary: "#25F4EE",
    accent: "#8B5CF6",
    background: "#F8F8F8",
    gradient: "from-rose-500 via-cyan-500 to-purple-500",
    glowColor: "rgba(254, 44, 85, 0.4)",
    emoji: "🎥",
  },
  leaderboard: {
    primary: "#F5B220",
    secondary: "#E85A3D",
    accent: "#299B6D",
    background: "#FFFBEB",
    gradient: "from-amber-500 via-orange-500 to-emerald-500",
    glowColor: "rgba(245, 178, 32, 0.4)",
    emoji: "🏆",
  },
  gamification: {
    primary: "#8B5CF6",
    secondary: "#F5B220",
    accent: "#EC4899",
    background: "#FAF5FF",
    gradient: "from-violet-500 via-amber-500 to-pink-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    emoji: "🎮",
  },
  groups: {
    primary: "#7C3AED",
    secondary: "#EC4899",
    accent: "#F5B220",
    background: "#FAF5FF",
    gradient: "from-violet-600 via-purple-500 to-pink-500",
    glowColor: "rgba(124, 58, 237, 0.4)",
    emoji: "👥",
  },
  messages: {
    primary: "#0EA5E9",
    secondary: "#06B6D4",
    accent: "#8B5CF6",
    background: "#F0F9FF",
    gradient: "from-sky-500 via-cyan-500 to-violet-500",
    glowColor: "rgba(14, 165, 233, 0.4)",
    emoji: "💬",
  },
  discussions: {
    primary: "#0891B2",
    secondary: "#06B6D4",
    accent: "#F5B220",
    background: "#ECFEFF",
    gradient: "from-cyan-600 via-teal-500 to-amber-500",
    glowColor: "rgba(8, 145, 178, 0.4)",
    emoji: "💭",
  },
  initiatives: {
    primary: "#F5B220",
    secondary: "#E85A3D",
    accent: "#299B6D",
    background: "#FFFBEB",
    gradient: "from-amber-500 via-orange-500 to-emerald-500",
    glowColor: "rgba(245, 178, 32, 0.4)",
    emoji: "💡",
  },
  profile: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    background: "#F5F3FF",
    gradient: "from-indigo-500 via-violet-500 to-pink-500",
    glowColor: "rgba(99, 102, 241, 0.4)",
    emoji: "👤",
  },
  members: {
    primary: "#2563EB",
    secondary: "#3B82F6",
    accent: "#F5B220",
    background: "#EFF6FF",
    gradient: "from-blue-600 via-blue-500 to-amber-500",
    glowColor: "rgba(37, 99, 235, 0.4)",
    emoji: "🧑",
  },
  following: {
    primary: "#A855F7",
    secondary: "#EC4899",
    accent: "#F5B220",
    background: "#FAF5FF",
    gradient: "from-purple-500 via-pink-500 to-amber-500",
    glowColor: "rgba(168, 85, 247, 0.4)",
    emoji: "🔔",
  },
};

// خريطة الـpath → section key (للاستخدام التلقائي حسب المسار)
export function getSectionFromPath(pathname: string): SectionKey {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/community/fund")) return "fund";
  if (pathname.startsWith("/community/events")) return "events";
  if (pathname.startsWith("/community/services")) return "services";
  if (pathname.startsWith("/community/store")) return "store";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/community/prices")) return "prices";
  if (pathname.startsWith("/community/map")) return "map";
  if (pathname.startsWith("/ethics")) return "ethics";
  if (pathname.startsWith("/videos")) return "videos";
  if (pathname.startsWith("/community/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/community/gamification")) return "gamification";
  if (pathname.startsWith("/community/groups")) return "groups";
  if (pathname.startsWith("/community/messages")) return "messages";
  if (pathname.startsWith("/community/discussions")) return "discussions";
  if (pathname.startsWith("/community/initiatives")) return "initiatives";
  if (pathname.startsWith("/community/profile")) return "profile";
  if (pathname.startsWith("/community/members")) return "members";
  if (pathname.startsWith("/community/following")) return "following";
  if (pathname.startsWith("/community")) return "community";
  return "community";
}
