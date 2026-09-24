"use client";

// ===================================================================
//  SpinWheel — عجلة مكافآت SVG تفاعلية
//  - 8 مقاطع ملوّنة
//  - تدور 3 ثواني (framer-motion) ثم تستقر على مقطع
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinSegment {
  label: string;
  reward: "POINTS" | "BADGE";
  value: number;
  weight: number;
  color: string;
  emoji: string;
}

interface SpinWheelProps {
  segments: SpinSegment[];
  eligible: boolean;
  reason?: string;
}

const RADIUS = 110;
const CENTER = 130;

function polarToCartesian(angle: number, radius: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(a),
    y: CENTER + radius * Math.sin(a),
  };
}

function describeArc(start: number, end: number) {
  const startOuter = polarToCartesian(start, RADIUS);
  const endOuter = polarToCartesian(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    "Z",
  ].join(" ");
}

export function SpinWheel({ segments, eligible, reason }: SpinWheelProps) {
  const segmentAngle = 360 / segments.length;
  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [resultIndex, setResultIndex] = React.useState<number | null>(null);
  const [resultBadge, setResultBadge] = React.useState<{
    name: string;
    icon: string;
  } | null>(null);

  const handleSpin = async () => {
    setSpinning(true);
    setResultIndex(null);
    setResultBadge(null);

    try {
      const res = await fetch("/api/community/rewards/spin-wheel", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر الدوران");

      const segment = data.segment as SpinSegment;
      const idx = data.segmentIndex as number;
      const badge = data.badge as { id: string; name: string; icon: string } | undefined;

      // نُضيف دورات كاملة (5+) ثم نُوقف المقطع الفائز أعلى المؤشّر
      const targetAngle = 360 * 5 + (360 - (idx * segmentAngle + segmentAngle / 2));
      setRotation(targetAngle);
      setResultIndex(idx);
      if (badge) setResultBadge({ name: badge.name, icon: badge.icon });

      setTimeout(() => {
        setSpinning(false);
        toast.success(`${segment.emoji} ربحت ${segment.label}!`, {
          description: badge ? `شارة: ${badge.name}` : undefined,
        });
      }, 3100);
    } catch (err) {
      setSpinning(false);
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    }
  };

  return (
    <Card className="warm-shadow overflow-hidden">
      <CardContent className="space-y-4 p-6">
        <div className="text-center">
          <h3 className="font-heading text-lg font-bold text-foreground">
            عجلة المكافآت
          </h3>
          <p className="text-xs text-muted-foreground">
            دوّر مرّة كل 24 ساعة
          </p>
        </div>

        {/* العجلة */}
        <div className="relative flex justify-center">
          <div className="relative size-[260px]">
            {/* المؤشّر (مثلّث أعلى) */}
            <div
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "16px solid #1F1A17",
              }}
              aria-hidden
            />

            <motion.svg
              width={260}
              height={260}
              viewBox="0 0 260 260"
              animate={{ rotate: rotation }}
              transition={{ duration: spinning ? 3 : 0, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "center" }}
              aria-label="عجلة المكافآت"
            >
              {segments.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;
                const midAngle = (startAngle + endAngle) / 2;
                const labelPos = polarToCartesian(midAngle, RADIUS * 0.65);
                return (
                  <g key={i}>
                    <path
                      d={describeArc(startAngle, endAngle)}
                      fill={seg.color}
                      stroke="#FBF6EE"
                      strokeWidth={1.5}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FBF6EE"
                      fontSize={i === segments.length - 1 ? "13" : "16"}
                      fontWeight="bold"
                      fontFamily="Tajawal, sans-serif"
                    >
                      {seg.reward === "BADGE" ? "شارة" : seg.value}
                    </text>
                  </g>
                );
              })}
              {/* مركز */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={12}
                fill="#FBF6EE"
                stroke="#1F1A17"
                strokeWidth={2}
              />
            </motion.svg>
          </div>
        </div>

        {/* النتيجة */}
        {resultIndex !== null && !spinning && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-lg bg-secondary/10 p-3"
          >
            <span className="text-2xl" aria-hidden>
              {segments[resultIndex].emoji}
            </span>
            <div>
              <p className="font-heading text-sm font-bold text-secondary">
                {resultBadge ? `شارة: ${resultBadge.name}` : segments[resultIndex].label}
              </p>
            </div>
          </motion.div>
        )}

        <Button
          onClick={handleSpin}
          disabled={spinning || !eligible || resultIndex !== null}
          className="h-11 w-full"
        >
          {resultIndex !== null ? (
            <>
              <RefreshCw className="size-4" />
              أدر مرّة أخرى (بعد 24 ساعة)
            </>
          ) : spinning ? (
            <Spinner label="جارٍ الدوران..." />
          ) : eligible ? (
            <>
              <Sparkles className="size-4" />
              أدر العجلة
            </>
          ) : (
            reason ?? "غير مؤهّل للدوران"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="size-4 rounded-full border-2 border-current border-t-transparent"
      />
      {label}
    </span>
  );
}
