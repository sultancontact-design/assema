"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل الخطأ (في الإنتاج: أرسل لخدمة مراقبة)
    console.error("خطأ في التطبيق:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex items-center justify-center">
      <Card className="max-w-lg w-full warm-shadow">
        <CardContent className="p-8 text-center">
          <div className="grid place-items-center size-16 mx-auto mb-4 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2 text-foreground">
            حدث خطأ غير متوقّع
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            نعتذر عن هذا الإزعاج. يرجى المحاولة مرة أخرى، أو العودة للصفحة
            الرئيسية. إن استمرّ الخطأ، تواصل مع الإدارة.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70 mb-4 font-mono" dir="ltr">
              رمز الخطأ: {error.digest}
            </p>
          )}
          <ZelligeDivider variant="minimal" className="mb-6 opacity-50" />
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} className="h-11">
              <RefreshCw className="size-4" />
              <span>إعادة المحاولة</span>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <a href="/">
                <Home className="size-4" />
                <span>العودة للرئيسية</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
