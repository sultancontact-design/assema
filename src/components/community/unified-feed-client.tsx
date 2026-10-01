"use client";

// ===================================================================
//  UnifiedFeedClient — wrapper client component for UnifiedFeed
//  v61.0: UnifiedFeed يستعمل motion/react الذي يفشل في SSR على Vercel
//  هذا المكوّن عميل (client component) يُحمّل UnifiedFeed ديناميكياً
//  مع ssr: false لتخطّي الـ SSR
// ===================================================================

import * as React from "react";
import dynamic from "next/dynamic";

const UnifiedFeed = dynamic(
  () => import("@/components/community/unified-feed").then((m) => m.UnifiedFeed),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse bg-muted rounded-xl" aria-label="جاري التحميل" />
    ),
  }
);

export function UnifiedFeedClient({ currentUserId }: { currentUserId?: string }) {
  return <UnifiedFeed currentUserId={currentUserId} />;
}

export default UnifiedFeedClient;
