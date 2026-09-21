"use client";

// ===================================================================
//  DistrictHeatmap — خريطة حرارية وهمية للحي
//  SVG شبكي بسيط يُظهر كثافة النشاط (مزيفة الآن — placeholder)
//  النمط: MINIMAL REFINED — شبكة بسيطة بنقاط ذهبية متفاوتة
// ===================================================================

import * as React from "react";

interface HeatmapProps {
  /** عدد الخلايا في كل اتجاه */
  cols?: number;
  rows?: number;
  /** اسم الحي */
  districtName?: string;
}

/** بذرة شبه-عشوائية (مولّدة مرة واحدة) */
function makeIntensity(rows: number, cols: number): number[][] {
  const data: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // موجة بسيطة (مركز أكثر كثافة)
      const dx = (c - cols / 2) / (cols / 2);
      const dy = (r - rows / 2) / (rows / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin((c + r) * 0.6) * 0.2;
      const intensity = Math.max(0, 1 - dist * 0.9) + wave;
      row.push(Math.max(0, Math.min(1, intensity)));
    }
    data.push(row);
  }
  return data;
}

export function DistrictHeatmap({
  cols = 12,
  rows = 8,
  districtName = "سيدي يوسف بن علي",
}: HeatmapProps) {
  const data = React.useMemo(() => makeIntensity(rows, cols), [rows, cols]);

  const cellSize = 28;
  const gap = 4;
  const width = cols * (cellSize + gap);
  const height = rows * (cellSize + gap);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          خريطة النشاط في {districtName}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>منخفض</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="size-2.5 rounded-sm"
                style={{
                  background: `rgba(200, 132, 42, ${0.15 + i * 0.18})`,
                }}
              />
            ))}
          </div>
          <span>مرتفع</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="خريطة حرارية لكثافة النشاط في الحي"
          className="block max-w-full"
        >
          {data.map((row, r) =>
            row.map((intensity, c) => {
              const x = c * (cellSize + gap);
              const y = r * (cellSize + gap);
              const alpha = 0.05 + intensity * 0.85;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={4}
                  fill={`rgba(200, 132, 42, ${alpha.toFixed(2)})`}
                  stroke="rgba(31, 26, 23, 0.04)"
                  strokeWidth={1}
                />
              );
            })
          )}
        </svg>
      </div>

      <p className="text-[11px] text-muted-foreground">
        بيانات استكشافية مبدئية — سيتم ربطها لاحقاً بنشاط الأعضاء في كل منطقة.
      </p>
    </div>
  );
}
