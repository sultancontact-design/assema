"use client";
import * as React from "react";
import { Video, Grid3x3, Bookmark, Heart, UserSquare2 } from "lucide-react";

export function ProfileTabs() {
  const [tab, setTab] = React.useState<"videos" | "posts" | "saved" | "liked" | "tagged">("videos");
  const tabs = [
    { key: "videos" as const, label: "الفيديوهات", icon: Video },
    { key: "posts" as const, label: "المقالات", icon: Grid3x3 },
    { key: "saved" as const, label: "المحفوظات", icon: Bookmark },
    { key: "liked" as const, label: "الإعجابات", icon: Heart },
    { key: "tagged" as const, label: "المُشاركات", icon: UserSquare2 },
  ];
  return (
    <div className="border-b mt-6">
      <div className="flex gap-6 justify-center">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${tab === key ? "border-foreground text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="size-4" />
            <span className="text-sm hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
