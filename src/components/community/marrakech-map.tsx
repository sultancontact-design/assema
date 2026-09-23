"use client";

// ===================================================================
//  MarrakechMap — خريطة مراكش التفاعلية
//  - 5 أحياء (arrondissements) على شكل SVG polygons
//  - Choropleth: كثافة اللون حسب عدد الأعضاء
//  - Tooltip على hover يُظهر اسم الحي + عدد الأعضاء
//  - Click ينقل إلى /community/districts/[slug]
//  - Legend تُظهِر مقياس الألوان
//  - Responsive: viewBox + preserveAspectRatio + width 100%
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users } from "lucide-react";

export interface MarrakechDistrictDatum {
  slug: string;
  nameAr: string;
  nameFr: string;
  members: number;
  familiesCount: number;
  contributions: number;
  population: number | null;
  boundarySvg: string; // SVG path d="..."
}

interface MarrakechMapProps {
  districts: MarrakechDistrictDatum[];
  /** slug الحي الذي يجب إبرازه (يستخدم في صفحة الحي المفردة) */
  highlightSlug?: string;
  /** إظهار زر تحديد الموقع (GeolocationButton مدمج) */
  withGeolocation?: boolean;
  /** height className للـsvg */
  className?: string;
}

// -------------------------------------------------------------------
//  Choropleth helpers — كثافة اللون حسب نسبة الأعضاء
//  اللون الأساسي: ترابي الزليج #B8492B مع opacity متدرّجة
// -------------------------------------------------------------------
const TERRACOTTA_RGB = "184, 73, 43"; // --primary في وضع الفاتح

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  const ratio = value / max;
  return Math.max(0.15, Math.min(1, ratio));
}

function districtFillColor(members: number, maxMembers: number): string {
  const alpha = 0.18 + normalize(members, maxMembers) * 0.72;
  return `rgba(${TERRACOTTA_RGB}, ${alpha.toFixed(3)})`;
}

function districtStrokeColor(highlighted: boolean): string {
  return highlighted
    ? "var(--accent, #C8842A)"
    : "rgba(31, 26, 23, 0.35)";
}

function districtStrokeWidth(highlighted: boolean): number {
  return highlighted ? 3 : 1.2;
}

// -------------------------------------------------------------------
//  Component
// -------------------------------------------------------------------
export function MarrakechMap({
  districts,
  highlightSlug,
  withGeolocation = false,
  className,
}: MarrakechMapProps) {
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // الحد الأقصى للأعضاء عبر كل الأحياء (لتطبيع Choropleth)
  const maxMembers = Math.max(1, ...districts.map((d) => d.members));

  const handleMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleClick = (slug: string) => {
    router.push(`/community/districts/${slug}`);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<SVGPathElement>,
    slug: string
  ) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleClick(slug);
    }
  };

  const hoveredDistrict = hoveredSlug
    ? districts.find((d) => d.slug === hoveredSlug) ?? null
    : null;

  // ترتيب الأحياء لإظهار المُبرز في الأعلى (z-order)
  const orderedDistricts = [...districts].sort((a, b) => {
    const ah = a.slug === highlightSlug ? 0 : 1;
    const bh = b.slug === highlightSlug ? 0 : 1;
    return ah - bh;
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className ?? ""}`}
      dir="rtl"
    >
      {/* SVG Map */}
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="خريطة مراكش التفاعلية بأحيائها الخمسة"
        className="block w-full h-auto touch-manipulation"
      >
        {/* خلفية كريم مع نقاط زليج خفيفة */}
        <defs>
          <pattern
            id="zellige-bg"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="20" height="20" fill="var(--background, #FBF6EE)" />
            <circle
              cx="10"
              cy="10"
              r="1"
              fill="var(--copper, #C8842A)"
              opacity="0.18"
            />
          </pattern>
          <filter id="warm-shadow-svg" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#1F1A17"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        <rect
          width="400"
          height="400"
          fill="url(#zellige-bg)"
          rx="8"
          ry="8"
        />

        {/* علامة الشمال (نجمة ثمانية) */}
        <g transform="translate(360 40)" opacity="0.7">
          <path
            d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z"
            fill="var(--accent, #C8842A)"
          />
          <text
            x="0"
            y="22"
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted-foreground, #6B5D4E)"
            fontFamily="Tajawal, sans-serif"
          >
            ش
          </text>
        </g>

        {/* كل حي كـ <path> قابل للنقر */}
        {orderedDistricts.map((d) => {
          const isHovered = hoveredSlug === d.slug;
          const isHighlighted =
            highlightSlug !== undefined && highlightSlug === d.slug;
          const fill = districtFillColor(d.members, maxMembers);
          const stroke = districtStrokeColor(isHighlighted || isHovered);
          const sw = districtStrokeWidth(isHighlighted || isHovered);

          return (
            <motion.path
              key={d.slug}
              d={d.boundarySvg}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#warm-shadow-svg)"
              tabIndex={0}
              role="link"
              aria-label={`${d.nameAr} — ${d.members} عضو — انقر لعرض التفاصيل`}
              style={{ cursor: "pointer", outline: "none" }}
              onMouseEnter={() => setHoveredSlug(d.slug)}
              onMouseLeave={() => {
                setHoveredSlug(null);
                setTooltipPos(null);
              }}
              onMouseMove={handleMove}
              onClick={() => handleClick(d.slug)}
              onKeyDown={(e) => handleKeyDown(e, d.slug)}
              onFocus={() => setHoveredSlug(d.slug)}
              onBlur={() => {
                setHoveredSlug(null);
                setTooltipPos(null);
              }}
              whileHover={{
                scale: 1.012,
                transition: { duration: 0.18 },
              }}
              animate={{
                fill: isHovered
                  ? `rgba(${TERRACOTTA_RGB}, ${Math.min(1, normalize(d.members, maxMembers) * 0.72 + 0.45).toFixed(3)})`
                  : fill,
              }}
              transition={{ duration: 0.18 }}
            />
          );
        })}

        {/* نقاط نابضة لكل حي — حجم النبضة حسب عدد الأعضاء */}
        {districts.map((d) => {
          const centroid = centroidFromPath(d.boundarySvg);
          if (!centroid) return null;
          if (d.members <= 0) return null;
          const ratio = normalize(d.members, maxMembers);
          // نصف قطر النقطة: 4-12 حسب نسبة الأعضاء
          const r = 4 + ratio * 8;
          // شدّة اللون: ترابي أكثر للأحياء الأكثر نشاطاً
          const opacity = 0.45 + ratio * 0.45;
          return (
            <g key={`pulse-${d.slug}`} pointerEvents="none">
              {/* الهالة النابضة الخارجية */}
              <motion.circle
                cx={centroid.x}
                cy={centroid.y}
                r={r}
                fill={`rgba(${TERRACOTTA_RGB}, ${(opacity * 0.4).toFixed(3)})`}
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [opacity * 0.5, 0, opacity * 0.5],
                }}
                transition={{
                  duration: 2.4 + ratio * 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: "center" }}
              />
              {/* النقطة الصلبة */}
              <circle
                cx={centroid.x}
                cy={centroid.y}
                r={Math.max(2.5, r * 0.45)}
                fill={`rgba(${TERRACOTTA_RGB}, ${opacity.toFixed(3)})`}
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />
            </g>
          );
        })}

        {/* تسميات الأحياء — اسم عربي + اسم فرنسي صغير */}
        {districts.map((d) => {
          const label = centroidFromPath(d.boundarySvg);
          if (!label) return null;
          const isHovered = hoveredSlug === d.slug;
          return (
            <g key={`label-${d.slug}`} pointerEvents="none">
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                fontSize={isHovered ? "15" : "13"}
                fontWeight={isHovered ? "700" : "600"}
                fill="var(--foreground, #1F1A17)"
                fontFamily="Tajawal, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {d.nameAr}
              </text>
              <text
                x={label.x}
                y={label.y + 14}
                textAnchor="middle"
                fontSize="9"
                fill="var(--muted-foreground, #6B5D4E)"
                fontFamily="IBM Plex Sans Arabic, sans-serif"
                style={{ pointerEvents: "none", fontStyle: "italic" }}
              >
                {d.nameFr}
              </text>
              {d.members > 0 && (
                <text
                  x={label.x}
                  y={label.y + 28}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="var(--primary, #B8492B)"
                  style={{ pointerEvents: "none" }}
                >
                  {d.members} عضو
                </text>
              )}
            </g>
          );
        })}

        {/* مؤشّر الموقع (إن طُلب) — يُحّقن من GeolocationButton */}
        <g id="user-location-marker" />
      </svg>

      {/* Tooltip HTML عند hover */}
      <AnimatePresence>
        {hoveredDistrict && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: "translate(0, -100%)",
            }}
            dir="rtl"
          >
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <MapPin className="size-3.5 text-primary" />
              {hoveredDistrict.nameAr}
              <span className="text-[10px] font-normal text-muted-foreground">
                ({hoveredDistrict.nameFr})
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3 text-secondary" />
              <span className="font-semibold text-foreground">
                {hoveredDistrict.members}
              </span>
              نشط الآن
            </div>
            {hoveredDistrict.population ? (
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                السكان التقريبيون:{" "}
                <span className="font-medium">
                  {new Intl.NumberFormat("ar-MA").format(
                    hoveredDistrict.population
                  )}
                </span>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend — مقياس الألوان */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>كثافة العضوية</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">منخفضة</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 6 }).map((_, i) => {
                const alpha = 0.18 + (i / 5) * 0.72;
                return (
                  <span
                    key={i}
                    className="size-3 rounded-sm border border-border/50"
                    style={{
                      background: `rgba(${TERRACOTTA_RGB}, ${alpha.toFixed(3)})`,
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[10px]">مرتفعة</span>
          </div>
        </div>

        {withGeolocation && (
          <GeolocationInline
            districts={districts}
            onHighlight={(slug) => setHoveredSlug(slug)}
          />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
//  GeolocationInline — نسخة مصغّرة لاستعمالها داخل الخريطة (لا toast)
//  الزر الكامل في src/components/community/geolocation-button.tsx
// -------------------------------------------------------------------
function GeolocationInline({
  districts,
  onHighlight,
}: {
  districts: MarrakechDistrictDatum[];
  onHighlight?: (slug: string) => void;
}) {
  const [status, setStatus] = React.useState<
    "idle" | "locating" | "denied" | "no-support" | "ok"
  >("idle");
  const [nearestSlug, setNearestSlug] = React.useState<string | null>(null);

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("no-support");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      () => {
        // مراكش: مركز افتراضي نُطبّقه على الخريطة الـ400px
        // نختار أقرب حي ببساطة — أقرب حي له أكبر عدد أعضاء (تجريبي)
        const sorted = [...districts].sort((a, b) => b.members - a.members);
        const nearest = sorted[0];
        if (nearest) {
          setNearestSlug(nearest.slug);
          onHighlight?.(nearest.slug);
          setStatus("ok");
          try {
            localStorage.setItem("mar-suggested-district", nearest.slug);
          } catch {
            // تجاهل
          }
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <MapPin className="size-3.5 text-primary" />
      {status === "locating"
        ? "نحدّد موقعك..."
        : status === "denied"
          ? "تم رفض الإذن"
          : status === "no-support"
            ? "غير مدعوم"
            : status === "ok" && nearestSlug
              ? `اقتراح: ${districts.find((d) => d.slug === nearestSlug)?.nameAr ?? ""}`
              : "حدّد موقعي"}
    </button>
  );
}

// -------------------------------------------------------------------
//  Centroid approximation من SVG path بسيط (M..L..Z)
//  يأخذ متوسط إحداثيات النقاط في الـpath
// -------------------------------------------------------------------
function centroidFromPath(path: string): { x: number; y: number } | null {
  try {
    // نطابق أزواج الأرقام (x y أو x,y) بعد M و L
    const tokens = path.match(/-?\d*\.?\d+(?:\s+-?\d*\.?\d+)?/g);
    if (!tokens || tokens.length === 0) return null;
    const nums: number[] = [];
    for (const t of tokens) {
      const parts = t.trim().split(/\s+|,/).filter(Boolean);
      for (const p of parts) {
        const n = parseFloat(p);
        if (!Number.isNaN(n)) nums.push(n);
      }
    }
    if (nums.length < 4 || nums.length % 2 !== 0) return null;
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (let i = 0; i < nums.length; i += 2) {
      sx += nums[i];
      sy += nums[i + 1];
      count += 1;
    }
    return { x: sx / count, y: sy / count };
  } catch {
    return null;
  }
}
