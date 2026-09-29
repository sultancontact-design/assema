"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FeedComposer } from "./feed-composer";
import { FeedItem } from "./feed-item";
import { Loader2, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Filter = "ALL" | "FOLLOWING";

export function FeedClient({ currentUserId }: { currentUserId?: string }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [composerOpen, setComposerOpen] = React.useState(false);

  const loadFeed = React.useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20", filter });
        if (!reset && cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/feed?${params}`);
        const data = await res.json();
        if (reset) setItems(data.items || []);
        else setItems((prev) => [...prev, ...(data.items || [])]);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // silent — UI handles empty state
      } finally {
        setLoading(false);
      }
    },
    [cursor, filter]
  );

  React.useEffect(() => {
    setCursor(null);
    loadFeed(true);
  }, [filter, loadFeed]);

  const handleNewPost = (newItem: any) => {
    setItems((prev) => [newItem, ...prev]);
    setComposerOpen(false);
  };

  const filters: { k: Filter; l: string; count?: number }[] = [
    { k: "ALL", l: "الكل" },
    { k: "FOLLOWING", l: "من أتابع" },
  ];

  return (
    <div className="container-fluid py-6 md:py-8" dir="rtl">
      <div className="mx-auto w-full max-w-2xl">
        {/* 2026: Composer is rendered inline when logged in (desktop), hidden on mobile (uses FAB) */}
        {currentUserId && (
          <div className="hidden md:block mb-4">
            <FeedComposer onPost={handleNewPost} />
          </div>
        )}

        {/* Glass-strong filter tabs (sticky) */}
        <div className="sticky top-16 z-30 mb-4 -mx-1 px-1 py-2">
          <div className="glass-strong rounded-full p-1 inline-flex gap-1">
            {filters.map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors min-h-9 ${
                  filter === f.k
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter === f.k && (
                  <motion.span
                    layoutId="feed-filter-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                  />
                )}
                <span className="relative z-10">{f.l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          /* Empty state — 2026 style */
          <div className="card-2026 rounded-3xl p-10 text-center">
            <div className="mx-auto mb-4 grid place-items-center size-16 rounded-full bg-gradient-to-br from-primary/15 to-accent/15">
              <Sparkles className="size-7 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold mb-2 text-foreground">
              لا يوجد محتوى بعد
            </p>
            <p className="text-muted-foreground mb-6">
              كن أول من ينشر في الحي وابدأ النقاش
            </p>
            {currentUserId && (
              <Button
                onClick={() => setComposerOpen(true)}
                className="btn-shine h-11 px-6"
              >
                <PenLine className="size-4 me-1" />
                اكتب منشوراً
              </Button>
            )}
          </div>
        ) : (
          /* Feed items with staggered motion */
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="card-2026 rounded-2xl">
                    <FeedItem item={item} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                onClick={() => loadFeed()}
                disabled={loading}
                className="w-full py-3 text-primary font-medium hover:bg-muted rounded-xl transition-colors min-h-11"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    جاري التحميل...
                  </span>
                ) : (
                  "تحميل المزيد"
                )}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button — mobile only */}
      {currentUserId && (
        <button
          onClick={() => setComposerOpen(true)}
          className="md:hidden fixed bottom-20 end-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-xl grid place-items-center hover:bg-primary/90 transition-colors"
          aria-label="إنشاء منشور جديد"
        >
          <PenLine className="size-6" />
        </button>
      )}

      {/* Mobile composer sheet */}
      {currentUserId && composerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setComposerOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full bg-background rounded-t-3xl p-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <FeedComposer onPost={handleNewPost} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
