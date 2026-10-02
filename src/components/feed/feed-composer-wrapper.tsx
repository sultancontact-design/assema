"use client";

// ===================================================================
//  FeedComposerWrapper — client wrapper for FeedComposer
//  v61.0: Server Component (community/page.tsx) can't pass function
//  props to Client Components. This wrapper handles the onPost
//  callback internally (client-side) without needing a prop.
// ===================================================================

import * as React from "react";
import { FeedComposer } from "@/components/feed/feed-composer";

export function FeedComposerWrapper() {
  // The onPost callback stays client-side (no server boundary crossing)
  const handlePost = React.useCallback((_item: unknown) => {
    // Optionally: trigger a refetch of the unified feed
    // For now, the UnifiedFeed will refetch on its own via its useEffect
    // when the page re-renders or when user navigates back
    // Could dispatch a custom event:
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("feed:new-post"));
    }
  }, []);

  return <FeedComposer onPost={handlePost} />;
}

export default FeedComposerWrapper;
