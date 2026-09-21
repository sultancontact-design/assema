"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("خطأ في واجهة المجتمع:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="max-w-lg w-full warm-shadow">
        <CardContent className="p-8 text-center">
          <div className="grid place-items-center size-16 mx-auto mb-4 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">
            تعذّر تحميل هذه الصفحة
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            حدث خطأ أثناء تحميل محتوى المجتمع. يرجى المحاولة مرة أخرى.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70 mb-4 font-mono" dir="ltr">
              {error.digest}
            </p>
          )}
          <Button onClick={reset} className="h-11">
            <RefreshCw className="size-4" />
            <span>إعادة المحاولة</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
