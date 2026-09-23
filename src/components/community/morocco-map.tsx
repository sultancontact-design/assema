"use client";

// ===================================================================
//  MoroccoMap — خريطة المغرب التفاعلية بـ 12 جهة (جهات التقسيم الإداري)
//  - كل جهة = SVG <path> قابل للنقر
//  - تُبرَز جهة مراكش-آسفي (المنطقة الافتراضية)
//  - Choropleth: كثافة اللون حسب عدد الأعضاء (مجمّع من جدول District)
//  - تسميات ثلاثية اللغة (عربي رئيسي + فرنسي ثانوي)
//  - قائمة جانبية تُظهِر الترتيب حسب العدد
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users } from "lucide-react";

export interface MoroccoRegionDatum {
  slug: string; // مُعرّف داخلي للجهة
  nameAr: string;
  nameFr: string;
  /** عدد الأعضاء في كل الجهة (مجموع أحياء المنطقة) */
  members: number;
  /** عدد الأحياء المسجّلة في المنطقة */
  districtsCount: number;
  /** SVG path d="..." */
  boundarySvg: string;
  /** هل هي الجهة الرئيسية (مراكش-آسفي)؟ */
  isPrimary?: boolean;
}

interface MoroccoMapProps {
  regions: MoroccoRegionDatum[];
  className?: string;
}

// لون مراكش-آسفي المُبرَز: أخضر الصنوبر (#2D5A3D)
const PINE_RGB = "45, 90, 61";
// باقي الجهات: ترابي الزليج
const TERRACOTTA_RGB = "184, 73, 43";

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  const ratio = value / max;
  return Math.max(0.08, Math.min(1, ratio));
}

function regionFillColor(
  members: number,
  maxMembers: number,
  isPrimary: boolean
): string {
  const alpha = 0.18 + normalize(members, maxMembers) * 0.72;
  const rgb = isPrimary ? PINE_RGB : TERRACOTTA_RGB;
  return `rgba(${rgb}, ${alpha.toFixed(3)})`;
}

export function MoroccoMap({ regions, className }: MoroccoMapProps) {
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const maxMembers = Math.max(1, ...regions.map((r) => r.members));

  const handleMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleClick = (slug: string, isPrimary: boolean) => {
    if (isPrimary) {
      router.push("/community/map");
    }
    // باقي الجهات: نُبقِي المستخدم على الصفحة (لا توجد صفحات لها بعد)
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<SVGPathElement>,
    slug: string,
    isPrimary: boolean
  ) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleClick(slug, isPrimary);
    }
  };

  const hoveredRegion = hoveredSlug
    ? regions.find((r) => r.slug === hoveredSlug) ?? null
    : null;

  // ترتيب: المُبرَز (مراكش-آسفي) في الأعلى
  const orderedRegions = [...regions].sort((a, b) => {
    const ap = a.isPrimary ? 0 : 1;
    const bp = b.isPrimary ? 0 : 1;
    return ap - bp;
  });

  const totalMembers = regions.reduce((s, r) => s + r.members, 0);

  return (
    <div
      ref={containerRef}
      className={`grid gap-4 md:grid-cols-[1fr_280px] ${className ?? ""}`}
      dir="rtl"
    >
      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox="0 0 320 360"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="خريطة المغرب بـ 12 جهة"
          className="block w-full h-auto touch-manipulation"
        >
          <defs>
            <pattern
              id="morocco-zellige-bg"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="22"
                height="22"
                fill="var(--background, #FBF6EE)"
              />
              <circle
                cx="11"
                cy="11"
                r="1.2"
                fill="var(--copper, #C8842A)"
                opacity="0.16"
              />
            </pattern>
            <filter id="morocco-warm-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2.5"
                floodColor="#1F1A17"
                floodOpacity="0.16"
              />
            </filter>
          </defs>

          <rect
            width="320"
            height="360"
            fill="url(#morocco-zellige-bg)"
            rx="8"
            ry="8"
          />

          {/* علامة الشمال (نجمة ثمانية) */}
          <g transform="translate(280 30)" opacity="0.7">
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

          {/* الجهات */}
          {orderedRegions.map((r) => {
            const isHovered = hoveredSlug === r.slug;
            const fill = regionFillColor(r.members, maxMembers, !!r.isPrimary);
            return (
              <motion.path
                key={r.slug}
                d={r.boundarySvg}
                fill={fill}
                stroke={
                  r.isPrimary
                    ? "var(--accent, #C8842A)"
                    : isHovered
                      ? "var(--primary, #B8492B)"
                      : "rgba(31, 26, 23, 0.32)"
                }
                strokeWidth={r.isPrimary ? 2.5 : isHovered ? 1.8 : 1}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#morocco-warm-shadow)"
                tabIndex={0}
                role={r.isPrimary ? "link" : "img"}
                aria-label={
                  r.isPrimary
                    ? `${r.nameAr} (${r.nameFr}) — ${r.members} عضو — انقر للانتقال لخريطة مراكش`
                    : `${r.nameAr} (${r.nameFr}) — ${r.members} عضو`
                }
                style={{
                  cursor: r.isPrimary ? "pointer" : "default",
                  outline: "none",
                }}
                onMouseEnter={() => setHoveredSlug(r.slug)}
                onMouseLeave={() => {
                  setHoveredSlug(null);
                  setTooltipPos(null);
                }}
                onMouseMove={handleMove}
                onClick={() => handleClick(r.slug, !!r.isPrimary)}
                onKeyDown={(e) => handleKeyDown(e, r.slug, !!r.isPrimary)}
                whileHover={{
                  scale: r.isPrimary ? 1.015 : 1.008,
                  transition: { duration: 0.18 },
                }}
                animate={{
                  fill: isHovered
                    ? `rgba(${r.isPrimary ? PINE_RGB : TERRACOTTA_RGB}, ${Math.min(1, normalize(r.members, maxMembers) * 0.72 + 0.4).toFixed(3)})`
                    : fill,
                }}
                transition={{ duration: 0.18 }}
              />
            );
          })}

          {/* تسميات الجهات */}
          {regions.map((r) => {
            const label = centroidFromPath(r.boundarySvg);
            if (!label) return null;
            const isHovered = hoveredSlug === r.slug;
            return (
              <g key={`label-${r.slug}`} pointerEvents="none">
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  fontSize={isHovered || r.isPrimary ? "9" : "7.5"}
                  fontWeight={r.isPrimary ? "700" : "600"}
                  fill="var(--foreground, #1F1A17)"
                  fontFamily="Tajawal, sans-serif"
                >
                  {r.nameAr}
                </text>
                <text
                  x={label.x}
                  y={label.y + 9}
                  textAnchor="middle"
                  fontSize="6"
                  fill="var(--muted-foreground, #6B5D4E)"
                  fontFamily="IBM Plex Sans Arabic, sans-serif"
                  style={{ fontStyle: "italic" }}
                >
                  {r.nameFr}
                </text>
                {r.members > 0 && (
                  <text
                    x={label.x}
                    y={label.y + 18}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="700"
                    fill={r.isPrimary ? "var(--secondary, #2D5A3D)" : "var(--primary, #B8492B)"}
                  >
                    {r.members}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredRegion && tooltipPos && (
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
                <MapPin
                  className={
                    hoveredRegion.isPrimary
                      ? "size-3.5 text-secondary"
                      : "size-3.5 text-primary"
                  }
                />
                {hoveredRegion.nameAr}
                <span className="text-[10px] font-normal text-muted-foreground">
                  ({hoveredRegion.nameFr})
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3 text-secondary" />
                <span className="font-semibold text-foreground">
                  {hoveredRegion.members}
                </span>
                عضو
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {hoveredRegion.districtsCount} حيّ مسجّل
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* قائمة جانبية بالترتيب */}
      <aside className="flex flex-col gap-2">
        <h3 className="font-heading text-sm font-bold text-foreground">
          ترتيب الجهات حسب الأعضاء
        </h3>
        <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-lg border border-border bg-card/50 p-2">
          <ul className="space-y-1">
            {[...regions]
              .sort((a, b) => b.members - a.members)
              .map((r, i) => {
                const pct = totalMembers > 0 ? (r.members / totalMembers) * 100 : 0;
                return (
                  <li
                    key={r.slug}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent/40 transition-colors"
                  >
                    <span className="w-5 text-end font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground line-clamp-1">
                          {r.nameAr}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {r.members}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(2, pct).toFixed(1)}%`,
                            background: r.isPrimary
                              ? "var(--secondary, #2D5A3D)"
                              : "var(--primary, #B8492B)",
                          }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
        <div className="mt-1 flex items-center justify-between rounded-md bg-muted/60 px-2 py-1.5 text-[11px] text-muted-foreground">
          <span>المجموع الكلي:</span>
          <span className="font-bold text-foreground">
            {new Intl.NumberFormat("ar-MA").format(totalMembers)} عضو
          </span>
        </div>
      </aside>
    </div>
  );
}

// -------------------------------------------------------------------
//  Centroid approximation من SVG path بسيط (M..L..Z)
// -------------------------------------------------------------------
function centroidFromPath(path: string): { x: number; y: number } | null {
  try {
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
