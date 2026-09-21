import Link from "next/link";
import { ShieldX, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export default function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ ip?: string }>;
}) {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 flex items-center justify-center">
      <Card className="max-w-lg w-full warm-shadow border-destructive/30">
        <CardContent className="p-8 text-center">
          <div className="grid place-items-center size-16 mx-auto mb-4 rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="size-8" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold mb-2 text-foreground">
            هذا القسم محمي
          </h1>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            هذا القسم محمي بقائمة IP المسموح بها. إن كنت تعتقد أن هذا خطأ،
            تواصل مع الإدارة.
          </p>

          <AwaitedIPAlert searchParams={searchParams} />

          <ZelligeDivider variant="minimal" className="mb-6 opacity-50" />

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild className="h-11">
              <Link href="/">
                <Home className="size-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
            <p className="mb-1">للتواصل مع الإدارة:</p>
            <p dir="ltr" className="font-mono">contact@syba-community.ma</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function AwaitedIPAlert({
  searchParams,
}: {
  searchParams: Promise<{ ip?: string }>;
}) {
  const params = await searchParams;
  if (!params.ip) return null;

  return (
    <div className="flex items-center gap-2 justify-center bg-muted/50 border border-border rounded-md p-3 mb-4 text-sm">
      <AlertTriangle className="size-4 text-amber-600" />
      <span className="text-muted-foreground">عنوان IP الخاص بك:</span>
      <span className="font-mono font-bold text-foreground" dir="ltr">
        {params.ip}
      </span>
    </div>
  );
}
