"use client";

// ===================================================================
//  UnifiedFeed v61.0 — شبكة اجتماعية موحدة (10 أنواع منشورات)
//  v61.0-fixed: إزالة motion/react (كان يفشل في SSR على Vercel)
//  - يستعمل div عادية مع transitions Tailwind بدلاً من motion
// ===================================================================

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  PenLine,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  Gift,
  Calendar,
  HandHeart,
  Megaphone,
  BookOpen,
  Video,
  UserPlus,
  ShieldCheck,
  ArrowBigUp,
  ArrowBigDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatNumber, formatMAD, formatDateArabic } from "@/lib/constants";
import { SECTION_THEMES, type SectionKey } from "@/components/layout/section-theme";

// ===================================================================
//  تعريف أنواع المنشورات (10 أنواع)
// ===================================================================

type FeedItemType =
  | "POST"
  | "CONTRIBUTION"
  | "FUND_REQUEST"
  | "EVENT"
  | "SERVICE"
  | "INITIATIVE"
  | "VIDEO"
  | "BLOG"
  | "BADGE_EARNED"
  | "LEVEL_UP"
  | "GROUP_JOINED"
  | "STATUS";

interface FeedItemData {
  id: string;
  type: FeedItemType;
  content?: string;
  targetId?: string;
  mediaUrls?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  // v61.0 Part 5: Reddit-style voting
  upvotes?: number;
  downvotes?: number;
  score?: number;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  };
  // بيانات إضافية يتم جلبها من الـAPI (اختياري)
  metadata?: {
    amount?: number;
    title?: string;
    category?: string;
    level?: number;
    badgeName?: string;
    groupName?: string;
    [key: string]: unknown;
  };
}

interface UnifiedFeedProps {
  currentUserId?: string;
}

// ===================================================================
//  خريطة النوع → هوية بصرية (أيقونة + لون + خلفية)
// ===================================================================

const TYPE_CONFIG: Record<
  FeedItemType,
  {
    icon: React.ComponentType<{ className?: string }>;
    section: SectionKey;
    label: string;
    action: string;
  }
> = {
  POST: {
    icon: PenLine,
    section: "feed",
    label: "منشور",
    action: "نشر",
  },
  CONTRIBUTION: {
    icon: HandHeart,
    section: "fund",
    label: "مساهمة",
    action: "ساهم بـ",
  },
  FUND_REQUEST: {
    icon: ShieldCheck,
    section: "fund",
    label: "طلب صندوق",
    action: "طلب",
  },
  EVENT: {
    icon: Calendar,
    section: "events",
    label: "فعالية",
    action: "أنشأ فعالية",
  },
  SERVICE: {
    icon: Gift,
    section: "services",
    label: "خدمة",
    action: "أضاف خدمة",
  },
  INITIATIVE: {
    icon: Megaphone,
    section: "initiatives",
    label: "مبادرة",
    action: "أطلق مبادرة",
  },
  VIDEO: {
    icon: Video,
    section: "videos",
    label: "فيديو",
    action: "شارك فيديو",
  },
  BLOG: {
    icon: BookOpen,
    section: "blog",
    label: "مقال",
    action: "كتب مقال",
  },
  BADGE_EARNED: {
    icon: Award,
    section: "gamification",
    label: "شارة جديدة",
    action: "حصل على شارة",
  },
  LEVEL_UP: {
    icon: Crown,
    section: "gamification",
    label: "ترقية",
    action: "ترقّى لمستوى",
  },
  GROUP_JOINED: {
    icon: UserPlus,
    section: "groups",
    label: "انضمام",
    action: "انضمّ لـ",
  },
  STATUS: {
    icon: Sparkles,
    section: "community",
    label: "حالة",
    action: "حدّث حالته",
  },
};

// ===================================================================
//  UnifiedFeed — المكوّن الرئيسي
// ===================================================================

export function UnifiedFeed({ currentUserId }: UnifiedFeedProps) {
  const [items, setItems] = React.useState<FeedItemData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);

  const loadFeed = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.items || [])]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  React.useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {items.length === 0 && !loading ? (
        <EmptyFeed />
      ) : (
        items.map((item) => (
          <div key={item.id} className="transition-opacity duration-300">
            <FeedItemCard item={item} />
          </div>
        ))
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadFeed}
          className="w-full py-3 text-primary font-medium hover:bg-muted rounded-xl transition-colors min-h-11"
        >
          تحميل المزيد
        </button>
      )}
    </div>
  );
}

// ===================================================================
//  FeedItemCard — بطاقة منشور واحد (10 أنواع مختلفة بصرياً)
// ===================================================================

function FeedItemCard({ item }: { item: FeedItemData }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.POST;
  const theme = SECTION_THEMES[config.section];
  const Icon = config.icon;
  const user = item.user;
  const displayName = user?.fullName ?? "أبناء الحي";
  const initials = displayName.slice(0, 1);
  const mediaArr = (() => {
    try {
      return JSON.parse(item.mediaUrls || "[]") as string[];
    } catch {
      return [];
    }
  })();

  // v66.0: 5 visually distinct card types
  const cardStyles: Record<string, { className: string; showTopBar: boolean; showHeader: boolean }> = {
    POST: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    STATUS: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    CONTRIBUTION: { className: "bg-green-50 border border-green-200 rounded-xl", showTopBar: false, showHeader: true },
    FUND_REQUEST: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    EVENT: { className: "bg-white border border-gray-200 rounded-xl overflow-hidden", showTopBar: false, showHeader: true },
    VIDEO: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    BLOG: { className: "bg-white border border-gray-200 rounded-xl overflow-hidden", showTopBar: false, showHeader: true },
    BADGE_EARNED: { className: "bg-amber-50 border border-amber-200 rounded-xl", showTopBar: false, showHeader: false },
    LEVEL_UP: { className: "bg-amber-50 border border-amber-200 rounded-xl", showTopBar: false, showHeader: false },
    GROUP_JOINED: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    SERVICE: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
    INITIATIVE: { className: "bg-white border border-gray-200 rounded-xl", showTopBar: false, showHeader: true },
  };
  const cardStyle = cardStyles[item.type] ?? cardStyles.POST;

  return (
    <Card
      className={`${cardStyle.className} transition-shadow hover:shadow-md`}
      style={{
        ["--section-primary" as string]: theme.primary,
        ["--section-secondary" as string]: theme.secondary,
      }}
    >
      {cardStyle.showTopBar && (
        <div
          className="h-1.5"
          style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
          aria-hidden
        />
      )}

      <CardContent className="p-4 md:p-5">
        {/* الرأس: avatar + اسم + نوع + وقت (تخطى للبطاقات الاحتفالية) */}
        {cardStyle.showHeader && (
        <div className="flex items-start gap-3 mb-3">
          <Link href={user?.id ? `/u/${user.id}` : "/community/members"}>
            <Avatar className="size-10 ring-2" style={{ ["--tw-ring-color" as string]: `${theme.primary}30` }}>
              <AvatarFallback
                className="text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                href={user?.id ? `/u/${user.id}` : "/community/members"}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
              <Badge
                variant="outline"
                className="text-[10px] gap-1"
                style={{
                  borderColor: `${theme.primary}40`,
                  color: theme.primary,
                  background: `${theme.primary}10`,
                }}
              >
                <Icon className="size-2.5" />
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateArabic(new Date(item.createdAt))}
            </p>
          </div>
        </div>
        )}

        {/* المحتوى — يختلف حسب النوع */}
        <FeedItemContent item={item} config={config} theme={theme} mediaArr={mediaArr} />

        {/* الإجراءات (إعجاب، تعليق، مشاركة، حفظ) */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <FeedActions item={item} theme={theme} />
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  FeedItemContent — محتوى مختلف لكل نوع
// ===================================================================

function FeedItemContent({
  item,
  config,
  theme,
  mediaArr,
}: {
  item: FeedItemData;
  config: { action: string; label: string; icon: React.ComponentType<{ className?: string }>; section: SectionKey };
  theme: { primary: string; secondary: string; accent: string; emoji?: string };
  mediaArr: string[];
}) {
  // 1) POST / STATUS — نص + صور
  if (item.type === "POST" || item.type === "STATUS") {
    return (
      <div className="space-y-3">
        {item.content && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {item.content}
          </p>
        )}
        {mediaArr.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {mediaArr.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`صورة ${i + 1}`}
                className="rounded-xl max-h-80 object-cover w-full"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2) CONTRIBUTION — بطاقة مساهمة مالية
  if (item.type === "CONTRIBUTION") {
    const amount = item.metadata?.amount ?? 0;
    return (
      <div
        className="rounded-xl p-4"
        style={{ background: `${theme.primary}10` }}
      >
        <p className="text-sm text-muted-foreground mb-1">{config.action}</p>
        <p className="font-heading text-3xl font-extrabold tabular-nums" style={{ color: theme.primary }}>
          {formatMAD(amount)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          مساهمة في صندوق المعروف — شكراً لكرمك 🌹
        </p>
      </div>
    );
  }

  // 3) FUND_REQUEST — بطاقة طلب
  if (item.type === "FUND_REQUEST") {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: `${theme.primary}40` }}>
        <p className="text-xs text-muted-foreground mb-1">{config.action}</p>
        <p className="font-heading text-lg font-bold text-foreground">
          {item.metadata?.title ?? item.content ?? "طلب من الصندوق"}
        </p>
        {item.metadata?.amount && (
          <p className="text-sm mt-1" style={{ color: theme.primary }}>
            المبلغ المطلوب: {formatMAD(item.metadata.amount)}
          </p>
        )}
      </div>
    );
  }

  // 4) EVENT — بطاقة فعالية
  if (item.type === "EVENT") {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: `${theme.primary}40`, background: `${theme.primary}08` }}>
        <p className="text-xs text-muted-foreground mb-1">{config.action}</p>
        <p className="font-heading text-lg font-bold text-foreground">
          {item.metadata?.title ?? item.content ?? "فعالية جديدة"}
        </p>
        {item.metadata?.category && (
          <p className="text-xs mt-1" style={{ color: theme.secondary }}>
            {item.metadata.category}
          </p>
        )}
        <Link
          href={item.targetId ? `/community/events/${item.targetId}` : "/community/events"}
          className="inline-block mt-3 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: theme.primary, color: "white" }}
        >
          عرض الفعالية
        </Link>
      </div>
    );
  }

  // 5) VIDEO — بطاقة فيديو مع صورة مصغرة
  if (item.type === "VIDEO") {
    const videoId = item.targetId || "";
    const youtubeThumb = (() => {
      if (!item.metadata?.sourceUrl) return null;
      const match = String(item.metadata.sourceUrl).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|shorts\/)([^&?/]+)/);
      return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    })();
    return (
      <Link href={videoId ? `/videos/${videoId}` : "/videos"} className="block">
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {youtubeThumb ? (
            <img src={youtubeThumb} alt={item.metadata?.title || "فيديو"} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              <Video className="size-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 grid place-items-center">
            <div className="size-12 rounded-full bg-white/90 grid place-items-center shadow-lg">
              <Play className="size-5 text-primary ms-0.5" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm font-bold text-white line-clamp-1">{item.metadata?.title ?? item.content ?? "فيديو جديد"}</p>
          </div>
        </div>
      </Link>
    );
  }

  // 6) BLOG — بطاقة مقال
  if (item.type === "BLOG") {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: `${theme.primary}40` }}>
        <p className="text-xs text-muted-foreground mb-1">{config.action}</p>
        <p className="font-heading text-base font-bold text-foreground line-clamp-2">
          {item.metadata?.title ?? item.content ?? "مقال جديد"}
        </p>
        <Link
          href={item.targetId ? `/blog/${item.targetId}` : "/blog"}
          className="inline-flex items-center gap-1 mt-2 text-xs font-medium"
          style={{ color: theme.primary }}
        >
          <BookOpen className="size-3" />
          اقرأ المقال
        </Link>
      </div>
    );
  }

  // 7) BADGE_EARNED — بطاقة شارة
  if (item.type === "BADGE_EARNED") {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)` }}
      >
        <div
          className="grid place-items-center size-12 rounded-full"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
        >
          <Award className="size-6 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{config.action}</p>
          <p className="font-heading font-bold text-foreground">
            {item.metadata?.badgeName ?? "شارة جديدة"}
          </p>
        </div>
      </div>
    );
  }

  // 8) LEVEL_UP — بطاقة ترقية
  if (item.type === "LEVEL_UP") {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)` }}
      >
        <div
          className="grid place-items-center size-12 rounded-full"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
        >
          <Crown className="size-6 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{config.action}</p>
          <p className="font-heading text-2xl font-extrabold" style={{ color: theme.primary }}>
            المستوى {item.metadata?.level ?? "?"}
          </p>
        </div>
      </div>
    );
  }

  // 9) GROUP_JOINED — بطاقة اجتماعية
  if (item.type === "GROUP_JOINED") {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: `${theme.primary}40` }}>
        <p className="text-sm text-foreground">
          {config.action}{" "}
          <span className="font-semibold" style={{ color: theme.primary }}>
            {item.metadata?.groupName ?? "مجموعة"}
          </span>
        </p>
      </div>
    );
  }

  // 10) SERVICE / INITIATIVE — افتراضي
  return (
    <div className="rounded-xl p-4 border" style={{ borderColor: `${theme.primary}40` }}>
      <p className="text-xs text-muted-foreground mb-1">{config.action}</p>
      <p className="text-sm text-foreground line-clamp-3">
        {item.metadata?.title ?? item.content ?? "نشاط جديد في الحي"}
      </p>
    </div>
  );
}

// ===================================================================
//  FeedActions — أزرار التفاعل (Vote + Award + تعليق + مشاركة + حفظ)
//  v61.0 Part 5: استبدال زرّ الإعجاب بـ Upvote/Downvote + Awards
// ===================================================================

function FeedActions({
  item,
  theme,
}: {
  item: FeedItemData;
  theme: { primary: string; secondary: string };
}) {
  return (
    <>
      <VoteButtons item={item} theme={theme} />
      <AwardButton item={item} theme={theme} />
      <CommentButton item={item} theme={theme} />
      <ShareMenu item={item} />
      <BookmarkButton item={item} theme={theme} />
      {item.views > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ms-auto">
          <TrendingUp className="size-3" />
          {formatNumber(item.views)} مشاهدة
        </div>
      )}
    </>
  );
}

// ===================================================================
//  CommentButton — opens inline comment section
//  v68.0: Actually works! Toggles comment form + fetches comments
// ===================================================================

function CommentButton({
  item,
  theme,
}: {
  item: FeedItemData;
  theme: { primary: string; secondary: string };
}) {
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoading(true);
      try {
        const res = await fetch(`/api/comments?feedItemId=${item.id}`);
        const data = await res.json();
        setComments(data.comments || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedItemId: item.id, content: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch {
      // silent
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleComments}
        className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-muted min-h-9"
        style={showComments ? { color: theme.primary } : undefined}
        aria-label="تعليق"
        aria-pressed={showComments}
      >
        <MessageCircle className={`size-4 ${showComments ? "fill-current" : ""}`} />
        {item.comments > 0 && <span className="tabular-nums">{formatNumber(item.comments)}</span>}
      </button>

      {/* Inline comment section */}
      {showComments && (
        <div className="absolute bottom-full mb-2 start-0 z-20 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[300px] max-h-[400px] overflow-y-auto" dir="rtl">
          {/* comment form */}
          <form onSubmit={submitComment} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقاً..."
              className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm resize-none"
              disabled={posting}
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="px-3 h-9 rounded-md text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {posting ? "..." : "إرسال"}
            </button>
          </form>

          {/* comments list */}
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-4">جاري التحميل...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">لا توجد تعليقات بعد</div>
          ) : (
            <div className="space-y-2">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                    {(c.user?.fullName || "U").slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-xs font-semibold mb-0.5">{c.user?.fullName || "مستخدم"}</div>
                      <p className="text-xs">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  ShareMenu — مشاركة المنشور (Facebook/X/WhatsApp/Copy)
// ===================================================================

function ShareMenu({ item }: { item: FeedItemData }) {
  const [open, setOpen] = React.useState(false);

  const share = (platform: string) => {
    const url = `${window.location.origin}/feed`;
    const title = item.content?.slice(0, 50) || "منشور من الحي";
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setOpen(false);
      return;
    }
    window.open(links[platform], "_blank", "width=600,height=500");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-muted transition-colors min-h-9"
        aria-label="مشاركة"
        title="مشاركة"
      >
        <Share2 className="size-4" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 start-0 z-20 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[160px]">
          <button onClick={() => share("facebook")} className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted text-sm">
            <span className="text-base">📘</span> فيسبوك
          </button>
          <button onClick={() => share("twitter")} className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted text-sm">
            <span className="text-base">🐦</span> X (تويتر)
          </button>
          <button onClick={() => share("whatsapp")} className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted text-sm">
            <span className="text-base">💬</span> واتساب
          </button>
          <button onClick={() => share("copy")} className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-muted text-sm">
            <span className="text-base">🔗</span> نسخ الرابط
          </button>
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  BookmarkButton — Save/unsave feed item (toggle behavior)
//  v61.0: uses /api/social/bookmark with targetType=FeedItem
// ===================================================================

function BookmarkButton({
  item,
  theme,
}: {
  item: FeedItemData;
  theme: { primary: string; secondary: string };
}) {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/social/bookmark?targetType=FeedItem&targetId=${item.id}`)
      .then((r) => r.json())
      .then((d) => setBookmarked(!!d.bookmarked))
      .catch(() => {});
  }, [item.id]);

  const toggle = async () => {
    if (submitting) return;
    setSubmitting(true);
    const prev = bookmarked;
    setBookmarked(!prev); // optimistic
    try {
      const res = await fetch("/api/social/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "FeedItem", targetId: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(!!data.bookmarked);
      } else {
        setBookmarked(prev); // rollback
      }
    } catch {
      setBookmarked(prev);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={submitting}
      className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-muted transition-colors min-h-9 disabled:opacity-50"
      style={bookmarked ? { color: theme.primary } : undefined}
      aria-label="حفظ"
      aria-pressed={bookmarked}
      title={bookmarked ? "إزالة من المحفوظات" : "حفظ"}
    >
      <Bookmark className={`size-4 ${bookmarked ? "fill-current" : ""}`} />
    </button>
  );
}

// ===================================================================
//  AwardButton — زر الجوائز (Reddit-style awards)
//  - يفتح popover بـ 7 أنواع جوائز
//  - كل جائزة: emoji + label + karma cost
//  - عند النقر: POST /api/feed/[id]/award
//  - يُظهر الجوائز المُعطاة (avatars + count)
// ===================================================================

const AWARD_OPTIONS = [
  { type: "GOLD", emoji: "🥇", label: "ذهبية", cost: 100, color: "#F5B220" },
  { type: "SILVER", emoji: "🥈", label: "فضية", cost: 50, color: "#9CA3AF" },
  { type: "BRONZE", emoji: "🥉", label: "برونزية", cost: 25, color: "#92400E" },
  { type: "HELPFUL", emoji: "❤️", label: "مفيدة", cost: 10, color: "#DC2626" },
  { type: "FUNNY", emoji: "😂", label: "مضحكة", cost: 10, color: "#F59E0B" },
  { type: "WHOLESOME", emoji: "🌟", label: "نبيلة", cost: 15, color: "#10B981" },
  { type: "INSPIRING", emoji: "🚀", label: "ملهمة", cost: 20, color: "#8B5CF6" },
] as const;

function AwardButton({
  item,
  theme,
}: {
  item: FeedItemData;
  theme: { primary: string; secondary: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [awards, setAwards] = React.useState<Array<{ awardType: string; user: { fullName: string } }>>([]);
  const [submitting, setSubmitting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch existing awards on mount
  React.useEffect(() => {
    fetch(`/api/feed/${item.id}/award`)
      .then((r) => r.json())
      .then((d) => setAwards(d.awards || []))
      .catch(() => {});
  }, [item.id]);

  const giveAward = async (awardType: string) => {
    if (submitting) return;
    setSubmitting(awardType);
    setError(null);
    try {
      const res = await fetch(`/api/feed/${item.id}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awardType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل");
        return;
      }
      // Add to local state
      setAwards((prev) => [
        ...prev,
        { awardType, user: { fullName: "أنت" } },
      ]);
      setOpen(false);
    } catch {
      setError("فشل الاتصال");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-muted transition-colors min-h-9"
        style={{ color: theme.primary }}
        aria-label="إعطاء جائزة"
        title="جوائز"
      >
        <Award className="size-4" />
        {awards.length > 0 && (
          <span className="font-bold tabular-nums">{formatNumber(awards.length)}</span>
        )}
      </button>

      {/* Display awards given */}
      {awards.length > 0 && !open && (
        <div className="absolute -top-1 -start-1 flex gap-0.5">
          {awards.slice(0, 3).map((a, i) => {
            const opt = AWARD_OPTIONS.find((o) => o.type === a.awardType);
            return opt ? (
              <span key={i} className="text-xs" title={`${opt.label} من ${a.user.fullName}`}>
                {opt.emoji}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Award picker popover */}
      {open && (
        <div className="absolute bottom-full mb-2 start-0 z-20 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[260px]">
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
            اختر جائزة (تُخصم من رصيدك Karma)
          </div>
          <div className="grid grid-cols-2 gap-1">
            {AWARD_OPTIONS.map((opt) => {
              const given = awards.some((a) => a.awardType === opt.type && a.user.fullName === "أنت");
              return (
                <button
                  key={opt.type}
                  onClick={() => giveAward(opt.type)}
                  disabled={submitting !== null || given}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-start disabled:opacity-50 disabled:cursor-not-allowed min-h-9"
                  style={given ? { opacity: 0.4 } : undefined}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: opt.color }}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {opt.cost} Karma
                    </p>
                  </div>
                  {given && <span className="text-[10px] text-emerald-600">✓</span>}
                  {submitting === opt.type && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="text-[11px] text-rose-600 mt-2 px-1">{error}</p>
          )}
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground py-1"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  VoteButtons — Upvote/Downvote (Reddit-style)
//  - يُرسل POST /api/feed/[id]/vote عند النقر
//  - optimistic update للحالة المحلية
//  - toggle: نقر نفس الزر يُلغي التصويت
// ===================================================================

function VoteButtons({
  item,
  theme,
}: {
  item: FeedItemData;
  theme: { primary: string; secondary: string };
}) {
  const [voteValue, setVoteValue] = React.useState<number>(0); // 1 / -1 / 0
  const [upvotes, setUpvotes] = React.useState(item.upvotes ?? 0);
  const [downvotes, setDownvotes] = React.useState(item.downvotes ?? 0);
  const [submitting, setSubmitting] = React.useState(false);

  // عند mount: اجلب تصويت المستخدم الحالي
  React.useEffect(() => {
    fetch(`/api/feed/${item.id}/vote`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.userVote === "number") setVoteValue(d.userVote);
        if (typeof d.upvotes === "number") setUpvotes(d.upvotes);
        if (typeof d.downvotes === "number") setDownvotes(d.downvotes);
      })
      .catch(() => {});
  }, [item.id]);

  const score = upvotes - downvotes;

  const vote = async (value: 1 | -1) => {
    if (submitting) return;
    const newValue = voteValue === value ? 0 : value; // toggle

    // optimistic update
    const prevValue = voteValue;
    const prevUp = upvotes;
    const prevDown = downvotes;
    setVoteValue(newValue);
    if (prevValue === 1) setUpvotes((u) => u - 1);
    if (prevValue === -1) setDownvotes((d) => d - 1);
    if (newValue === 1) setUpvotes((u) => u + 1);
    if (newValue === -1) setDownvotes((d) => d + 1);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        // rollback
        setVoteValue(prevValue);
        setUpvotes(prevUp);
        setDownvotes(prevDown);
      } else {
        setVoteValue(data.userVote ?? 0);
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
      }
    } catch {
      setVoteValue(prevValue);
      setUpvotes(prevUp);
      setDownvotes(prevDown);
    } finally {
      setSubmitting(false);
    }
  };

  const isUpvoted = voteValue === 1;
  const isDownvoted = voteValue === -1;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
      <button
        onClick={() => vote(1)}
        disabled={submitting}
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors min-h-9 disabled:opacity-50"
        style={isUpvoted ? { color: theme.primary, background: `${theme.primary}20` } : { color: "var(--muted-foreground)" }}
        aria-label="تصويت إيجابي"
        aria-pressed={isUpvoted}
        title="Upvote"
      >
        <ArrowBigUp className={`size-4 ${isUpvoted ? "fill-current" : ""}`} />
      </button>
      <span
        className="font-bold text-xs tabular-nums px-1 min-w-7 text-center"
        style={{
          color: isUpvoted
            ? theme.primary
            : isDownvoted
            ? "#dc2626" // red-600
            : "var(--foreground)",
        }}
      >
        {formatNumber(score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={submitting}
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors min-h-9 disabled:opacity-50"
        style={isDownvoted ? { color: "#dc2626", background: "#dc262620" } : { color: "var(--muted-foreground)" }}
        aria-label="تصويت سلبي"
        aria-pressed={isDownvoted}
        title="Downvote"
      >
        <ArrowBigDown className={`size-4 ${isDownvoted ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  count,
  theme,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  theme: { primary: string; secondary: string };
  label: string;
}) {
  const [active, setActive] = React.useState(false);
  return (
    <button
      onClick={() => setActive((p) => !p)}
      className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-muted min-h-9"
      style={active ? { color: theme.primary } : undefined}
      aria-label={label}
      aria-pressed={active}
    >
      <Icon className={`size-4 ${active ? "fill-current" : ""}`} />
      <span className="tabular-nums">{formatNumber(count)}</span>
    </button>
  );
}

// ===================================================================
//  EmptyFeed — حالة فارغة
// ===================================================================

function EmptyFeed() {
  return (
    <Card className="card-2026 rounded-3xl p-10 text-center">
      <div className="mx-auto mb-4 grid place-items-center size-16 rounded-full bg-gradient-to-br from-primary/15 to-accent/15">
        <Sparkles className="size-7 text-primary" />
      </div>
      <p className="font-heading text-2xl font-bold mb-2 text-foreground">
        لا يوجد نشاط بعد
      </p>
      <p className="text-muted-foreground">
        ابدأ بكتابة منشور أو شارك في الفعاليات القادمة
      </p>
    </Card>
  );
}

export default UnifiedFeed;
