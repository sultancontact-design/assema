"use client";

// ===================================================================
//  UnifiedFeedClient — wrapper client component for UnifiedFeed
//  v61.0-fixed: لم يعد يحتاج dynamic import لأن unified-feed.tsx
//  أزال motion/react بالكامل (لا SSR issues الآن)
// ===================================================================

import * as React from "react";
import { UnifiedFeed } from "@/components/community/unified-feed";

export function UnifiedFeedClient({ currentUserId }: { currentUserId?: string }) {
  return <UnifiedFeed currentUserId={currentUserId} />;
}

export default UnifiedFeedClient;
