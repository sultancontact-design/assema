import { cn } from "@/lib/utils";

interface ZelligeDividerProps {
  className?: string;
  variant?: "diamond" | "wave" | "stars" | "minimal";
  color?: string;
}

/**
 * v66.0: Simplified divider — replaces all decorative zellige patterns
 * with a clean, minimal horizontal line.
 * Preserves the same API so all 110 existing usages work without changes.
 */
export function ZelligeDivider({
  className,
  variant: _variant,
  color: _color,
}: ZelligeDividerProps) {
  return (
    <div
      className={cn(
        "h-px w-full bg-border/60 my-4",
        className
      )}
      aria-hidden
    />
  );
}
