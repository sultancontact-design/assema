"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * زر إعادة المحاولة — مكوّن عميل صغير يستدعي window.location.reload()
 * يُستعمل في صفحة /~offline لأن الصفحة الرئيسية Server Component.
 */
export function RetryButton() {
  return (
    <Button
      size="lg"
      variant="default"
      className="h-12 px-8 text-base"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }}
    >
      <RefreshCw className="size-4" />
      <span>إعادة المحاولة</span>
    </Button>
  );
}
