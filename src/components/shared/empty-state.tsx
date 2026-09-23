// ===================================================================
//  EmptyState — حالة فارغة صديقة بالأسلوب المغربي
//  - icon, title, message, optional actionLabel/actionHref
//  - optional ZelligeDivider
// ===================================================================

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  divider?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  actionHref,
  divider = false,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("warm-shadow border-dashed border-border/60 bg-muted/20", className)}>
      <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center max-w-md mx-auto">
        <span className="grid place-items-center size-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <Icon className="size-8" />
        </span>
        {divider && <ZelligeDivider variant="minimal" className="opacity-60 mb-4" />}
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {message}
        </p>
        {actionLabel && actionHref && (
          <Button asChild size="lg" className="h-11 px-6">
            <Link href={actionHref}>
              <span>{actionLabel}</span>
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
