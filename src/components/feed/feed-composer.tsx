"use client";
import * as React from "react";
import { Loader2, Send, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedComposer({ onPost }: { onPost: (item: any) => void }) {
  const [content, setContent] = React.useState("");
  const [visibility, setVisibility] = React.useState("DISTRICT");
  const [posting, setPosting] = React.useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, visibility, type: "STATUS" }) });
      const data = await res.json();
      if (data.success) { onPost(data.item); setContent(""); }
    } catch {} finally { setPosting(false); }
  };

  return (
    <div className="bg-card rounded-2xl border p-4 mb-4" dir="rtl">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#8B5CF6] flex-shrink-0" />
        <div className="flex-1">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="ما الجديد في الحي؟" rows={2} className="w-full p-3 border rounded-lg bg-background resize-none text-sm" maxLength={500} />
          <div className="flex items-center justify-between mt-2">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="text-xs px-2 py-1 border rounded bg-background">
              <option value="PUBLIC">عام</option>
              <option value="DISTRICT">حيّي فقط</option>
              <option value="FOLLOWERS">متابعيّ</option>
            </select>
            <Button onClick={handlePost} disabled={posting || !content.trim()} size="sm" className="bg-gradient-to-r from-[#FE2C55] to-[#8B5CF6]">
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} نشر
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
