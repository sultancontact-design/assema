import Link from "next/link";
import { Compass, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex items-center justify-center">
      <Card className="max-w-lg w-full warm-shadow">
        <CardContent className="p-8 text-center">
          <div className="grid place-items-center size-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary">
            <Compass className="size-8" />
          </div>
          <h1 className="font-heading text-5xl font-extrabold mb-2 text-primary">
            404
          </h1>
          <h2 className="font-heading text-xl font-bold mb-2 text-foreground">
            الصفحة غير موجودة
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            يبدو أنك ضللت الطريق. هذه الصفحة غير موجودة أو تم نقلها. عُد إلى
            الصفحة الرئيسية لمتابعة استكشاف منصة المعروف الرقمي.
          </p>
          <ZelligeDivider variant="minimal" className="mb-6 opacity-50" />
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild className="h-11">
              <Link href="/">
                <Home className="size-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link href="/community">
                <ArrowRight className="size-4" />
                <span>لوحة المجتمع</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
