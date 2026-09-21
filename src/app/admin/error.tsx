"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("خطأ في لوحة الإدارة:", error);
  }, [error]);

  return (
    <div className="p-8 flex items-center justify-center">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="p-6 text-center">
          <div className="grid place-items-center size-12 mx-auto mb-3 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-bold mb-2">
            خطأ في لوحة الإدارة
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            حدث خطأ أثناء معالجة طلبك. يرجى إعادة المحاولة.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70 mb-3 font-mono" dir="ltr">
              {error.digest}
            </p>
          )}
          <Button onClick={reset} size="sm" className="h-10">
            <RefreshCw className="size-4" />
            <span>إعادة المحاولة</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
