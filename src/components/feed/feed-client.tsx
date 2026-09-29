"use client";
import * as React from "react";
import { FeedComposer } from "./feed-composer";
import { FeedItem } from "./feed-item";
import { Loader2 } from "lucide-react";

export function FeedClient({ currentUserId }: { currentUserId?: string }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [filter, setFilter] = React.useState<"ALL" | "FOLLOWING">("ALL");

  const loadFeed = React.useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20", filter });
      if (!reset && cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      if (reset) setItems(data.items || []);
      else setItems(prev => [...prev, ...(data.items || [])]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {} finally { setLoading(false); }
  }, [cursor, filter]);

  React.useEffect(() => { setCursor(null); loadFeed(true); }, [filter]);

  const handleNewPost = (newItem: any) => setItems(prev => [newItem, ...prev]);

  return (
    <div className="max-w-2xl mx-auto py-6" dir="rtl">
      {currentUserId && <FeedComposer onPost={handleNewPost} />}
      <div className="flex gap-2 mb-4 sticky top-16 bg-background/95 backdrop-blur z-30 py-2">
        {[{ k: "ALL", l: "الكل" }, { k: "FOLLOWING", l: "من أتابع" }].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k as any)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>{f.l}</button>
        ))}
      </div>
      {loading && items.length === 0 ? <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
      : items.length === 0 ? <div className="text-center py-16 bg-card rounded-2xl"><p className="text-xl font-bold mb-2">لا يوجد محتوى بعد</p><p className="text-muted-foreground">كن أول من ينشر في الحي</p></div>
      : (<div className="space-y-4">{items.map(item => <FeedItem key={item.id} item={item} />)}{hasMore && <button onClick={() => loadFeed()} disabled={loading} className="w-full py-3 text-primary font-medium hover:bg-muted rounded-lg">{loading ? "جاري..." : "تحميل المزيد"}</button>}</div>)}
    </div>
  );
}
