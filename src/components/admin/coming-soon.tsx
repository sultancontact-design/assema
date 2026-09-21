// ===================================================================
//  صفحة قيد التطوير — تُستخدم للأقسام غير المُنجزة بعد
// ===================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Construction className="size-4 text-accent" strokeWidth={1.5} />
            <span>قيد التطوير</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            هذا القسم سيكون متاحاً في الإصدار القادم من المنصة. شكراً لصبرك.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
