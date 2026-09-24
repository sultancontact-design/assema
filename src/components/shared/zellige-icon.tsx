// ===================================================================
//  ZelligeIcon — غلاف لأيقونات Lucide React مع ألوان "زليج مراكش"
//  - name: اسم الأيقونة في lucide-react (PascalCase أو camelCase)
//  - color: أحد ألوان المنصة (primary/secondary/accent/copper)
//  - size: 16 | 20 | 24 | 32 | 48... (بكسل)
//  - className: تمرير أصناف إضافية
//
//  الاستخدام:
//    <ZelligeIcon name="Heart" color="primary" size={24} />
//    <ZelligeIcon name="Users" color="secondary" />
// ===================================================================

import * as React from "react";
import { icons, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export type ZelligeColor = "primary" | "secondary" | "accent" | "copper";

interface ZelligeIconProps extends Omit<LucideProps, "ref"> {
  /** اسم أيقونة lucide-react كما هو مُصدَّر (مثل: "Heart", "Users") */
  name: keyof typeof icons | string;
  /** لون زليج مراكش */
  color?: ZelligeColor;
  /** الحجم بالبكسل */
  size?: number | string;
  /** أصناف Tailwind إضافية */
  className?: string;
}

const COLOR_VAR: Record<ZelligeColor, string> = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  copper: "var(--copper)",
};

/**
 * مكوّن ZelligeIcon — يُغلّف أيقونات Lucide React بألوان زليج مراكش.
 * يُعيد null لو الاسم غير معروف.
 */
export function ZelligeIcon({
  name,
  color = "primary",
  size = 24,
  strokeWidth = 2,
  className,
  ...rest
}: ZelligeIconProps) {
  const IconComp = (icons as Record<string, React.ComponentType<LucideProps>>)[
    String(name)
  ];
  if (!IconComp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ZelligeIcon] أيقونة غير معروفة: ${String(name)}`);
    }
    return null;
  }
  return (
    <IconComp
      aria-hidden="true"
      focusable="false"
      strokeWidth={strokeWidth}
      style={{
        color: COLOR_VAR[color],
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
      className={cn("inline-block shrink-0", className)}
      {...rest}
    />
  );
}

/** خريطة بسيطة من الأسماء العربية الشائعة إلى أسماء Lucide لتسهيل الاستخدام */
export const ICON_ALIASES: Record<string, string> = {
  قلب: "Heart",
  مستخدمون: "Users",
  مستخدم: "User",
  تقويم: "CalendarDays",
  محفظة: "Wallet",
  نقود: "Coins",
  جائزة: "Award",
  شارة: "BadgeCheck",
  قمر: "Moon",
  شمس: "Sun",
  نجمة: "Star",
  منزل: "Home",
  جماعة: "Users",
  مجموعة: "Group",
  خريطة: "MapPin",
  هاتف: "Phone",
  بريد: "Mail",
  درع: "Shield",
  زاوية: "ChevronLeft",
};

export default ZelligeIcon;
