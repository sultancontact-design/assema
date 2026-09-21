import Link from "next/link";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * شعار "سيدي يوسف بن علي العاصمة" — مؤقت بنمط زليج مغربي
 * مكوّن من نجمة ثمانية (نقشة زليج) + دائرة ذهبية في الوسط
 */
export function SiteLogo({
  className,
  showText = true,
  size = "md",
}: SiteLogoProps) {
  const dimensions = {
    sm: { box: "size-7", text: "text-sm" },
    md: { box: "size-9", text: "text-base" },
    lg: { box: "size-12", text: "text-lg" },
  }[size];

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-heading font-bold transition-opacity hover:opacity-80",
        className
      )}
      aria-label="الصفحة الرئيسية — سيدي يوسف بن علي العاصمة"
    >
      <span
        className={cn(
          "relative grid place-items-center rounded-lg bg-primary text-primary-foreground",
          dimensions.box
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-2/3"
          aria-hidden="true"
        >
          <path
            d="M16 2 L19.5 9.5 L27 6 L23.5 13.5 L31 17 L23.5 20.5 L27 28 L19.5 24.5 L16 31 L12.5 24.5 L5 28 L8.5 20.5 L1 17 L8.5 13.5 L5 6 L12.5 9.5 Z"
            fill="currentColor"
            opacity="0.95"
          />
          <circle cx="16" cy="17" r="3" fill="var(--copper, #C8842A)" />
        </svg>
      </span>
      {showText && (
        <span className={cn("leading-tight", dimensions.text)}>
          <span className="block text-foreground">سيدي يوسف بن علي</span>
          <span className="block text-xs text-muted-foreground font-normal">
            العاصمة
          </span>
        </span>
      )}
    </Link>
  );
}
