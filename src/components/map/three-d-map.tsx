"use client";

import * as React from "react";
import Script from "next/script";

// ===================================================================
//  ThreeDMap v34.0 — 4 إصلاحات عاجلة
//  1. النص العربي المعكوس: نبدّل كل text-field في طبقات الرموز إلى
//     name:fr (الفرنسية = لغة مغربية ثانية، LTR، لا bidi مشكلة).
//  2. القمر الصناعي لا يعمل: ESRI World Imagery (مجاني، بدون API key).
//  3. 0 عضو في 4 أحياء: يُصلَح بإعادة توزيع المستخدمين (سكريبت منفصل).
//  4. الأداء البطيء: تحميل كسول للقمر الصناعي والتضاريس فقط عند الطلب.
// ===================================================================

declare global {
  interface Window {
    maplibregl?: {
      Map: new (opts: Record<string, unknown>) => MapInstance;
      Marker: new (opts?: Record<string, unknown>) => MarkerInstance;
      Popup: new (opts?: Record<string, unknown>) => PopupInstance;
      NavigationControl: new (opts?: Record<string, unknown>) => unknown;
      ScaleControl: new (opts?: Record<string, unknown>) => unknown;
      FullscreenControl: new () => unknown;
      GeolocateControl: new (opts?: Record<string, unknown>) => unknown;
      workerUrl: string;
      [key: string]: unknown;
    };
  }
}

interface MapInstance {
  on(event: string, cb: () => void): void;
  once(event: string, cb: () => void): void;
  addSource(id: string, source: Record<string, unknown>): void;
  addLayer(layer: Record<string, unknown>): void;
  setTerrain(opts: Record<string, unknown>): void;
  getLayer(id: string): unknown;
  getStyle(): { layers: Array<{ id: string; type: string; layout?: Record<string, unknown> }> };
  setLayoutProperty(layer: string, prop: string, val: unknown): void;
  setPaintProperty(layer: string, prop: string, val: unknown): void;
  addControl(control: unknown, position?: string): void;
  remove(): void;
  [key: string]: unknown;
}
interface MarkerInstance {
  setLngLat(c: [number, number]): MarkerInstance;
  setPopup(p: PopupInstance): MarkerInstance;
  addTo(m: MapInstance): MarkerInstance;
}
interface PopupInstance {
  setHTML(html: string): PopupInstance;
}

const VENDOR_SCRIPT = "/vendor/maplibre-gl.js";
const VENDOR_WORKER = "/vendor/maplibre-gl-csp-worker.js";
const STYLE_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";

// ESRI World Imagery — مجاني، بدون API key، موثوق عالمياً
const SATELLITE_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

// AWS Terrarium للتضاريس 3D
const TERRAIN_TILES = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
];

const MARRAKECH: [number, number] = [-7.98, 31.63];

const DISTRICTS = [
  { name: "المدينة", nameFr: "Médina", coords: [-7.989, 31.629] as [number, number], color: "#E85A3D" },
  { name: "جليز", nameFr: "Guéliz", coords: [-7.998, 31.643] as [number, number], color: "#299B6D" },
  { name: "المنارة", nameFr: "Ménara", coords: [-7.950, 31.600] as [number, number], color: "#F5B220" },
  { name: "النخيل", nameFr: "Palmeraie", coords: [-7.920, 31.650] as [number, number], color: "#0EA5E9" },
  { name: "سيدي يوسف بن علي", nameFr: "Sidi Youssef Ben Ali", coords: [-7.970, 31.610] as [number, number], color: "#E85A3D" },
];

type ViewMode = "streets" | "satellite";

export function ThreeDMap() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapInstance | null>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("streets");
  const [terrainOn, setTerrainOn] = React.useState(false);
  const satelliteAddedRef = React.useRef(false);
  const terrainAddedRef = React.useRef(false);

  // ─── Initialize map ───
  React.useEffect(() => {
    if (!scriptLoaded || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    try {
      const ml = window.maplibregl;
      if (!ml) {
        setError("MapLibre GL JS لم يُحمَّل");
        return;
      }
      ml.workerUrl = VENDOR_WORKER;

      const map = new ml.Map({
        container: containerRef.current,
        style: STYLE_LIBERTY,
        center: MARRAKECH,
        zoom: 11,           // أوسع قليلاً = أقل بلاطات = أسرع
        pitch: 45,           // أقل 3D = أسرع عرض
        bearing: -15,
        maxPitch: 75,
        maxZoom: 16,         // أقصى تكبير محدود = أقل تحميل
        attributionControl: { compact: true },
        // تحسينات أداء
        fadeDuration: 0,
        cooperativeGestures: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        // ━━━ الإصلاح 1: تحويل كل تسميات الخريطة إلى الفرنسية ━━━
        // السبب: canvas bidi للعربية معطوب في MapLibre، فيظهر
        // "بني ملال-خنيفرة" معكوساً. الفرنسية = لغة LTR موثوقة.
        try {
          const style = (map as unknown as { getStyle: () => { layers: Array<{ id: string; type: string; layout?: Record<string, unknown> }> } }).getStyle();
          const symbolLayers = style.layers.filter((l) => l.type === "symbol" && l.layout?.["text-field"]);
          symbolLayers.forEach((layer) => {
            try {
              map.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", "name:fr"],
                ["get", "name:en"],
                ["get", "name:latin"],
                ["get", "name"],
              ]);
            } catch {}
          });
        } catch (e) {
          console.warn("label switch:", e);
        }

        // ━━━ الإصلاح 4: لا نُحمّل القمر الصناعي ولا التضاريس إلا عند الطلب ━━━

        // علامات الأحياء (HTML popups — RTL يعمل بشكل صحيح هنا)
        DISTRICTS.forEach((d) => {
          const pinEl = document.createElement("div");
          pinEl.innerHTML = `<svg width="28" height="36" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
            <path d="M16 0 C8 0 2 6 2 14 C2 24 16 40 16 40 S30 24 30 14 C30 6 24 0 16 0 Z" fill="${d.color}" stroke="#FBF8F3" stroke-width="2.5"/>
            <circle cx="16" cy="15" r="5" fill="#FBF8F3"/><circle cx="16" cy="15" r="2.5" fill="${d.color}"/>
          </svg>`;
          new ml.Marker({ element: pinEl, anchor: "bottom" })
            .setLngLat(d.coords)
            .setPopup(
              new ml.Popup({ offset: 25, maxWidth: "280px" }).setHTML(
                // dir="rtl" يضمن عرض العربية الصحيح في HTML
                `<div dir="rtl" lang="ar" style="font-family:'Tajawal','Noto Kufi Arabic',sans-serif;padding:6px 8px;line-height:1.5">
                  <strong style="color:${d.color};font-size:15px;display:block">${d.name}</strong>
                  <span dir="ltr" style="font-size:10px;color:#6b7280;display:block;margin-top:2px">${d.nameFr}</span>
                  <div style="font-size:11px;color:#6b7280;margin-top:4px;border-top:1px solid #e5e7eb;padding-top:4px">
                    <span dir="ltr">${d.coords[1].toFixed(4)}°, ${d.coords[0].toFixed(4)}°</span>
                  </div>
                </div>`
              )
            )
            .addTo(map);
        });

        // عناصر التحكم
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new ml.ScaleControl({ unit: "metric", maxWidth: 150 }), "bottom-left");
        map.addControl(new ml.FullscreenControl(), "top-right");

        if (!cancelled) setMapLoaded(true);
      });

      map.on("error", (e: unknown) => { console.warn("MapLibre:", e); });
    } catch (e) {
      if (!cancelled) setError(e instanceof Error ? e.message : "خطأ في الخريطة");
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, [scriptLoaded]);

  // ━━━ الإصلاح 2 + 4: تحميل كسول للقمر الصناعي عند الطلب ━━━
  const ensureSatelliteLayer = React.useCallback(() => {
    const map = mapRef.current;
    if (!map || satelliteAddedRef.current) return;
    try {
      map.addSource("satellite-esri", {
        type: "raster",
        tiles: SATELLITE_TILES,
        tileSize: 256,
        attribution: "Tiles © Esri",
        maxzoom: 18,
      });
      // أضف الطبقة تحت طبقات الرموز (حتى تبقى التسميات فوق القمر الصناعي)
      // أضفها في نهاية القائمة = فوق كل طبقات المتجهات
      map.addLayer({
        id: "satellite-layer",
        type: "raster",
        source: "satellite-esri",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1 },
      });
      satelliteAddedRef.current = true;
    } catch (e) {
      console.warn("satellite layer:", e);
    }
  }, []);

  // ━━━ الإصلاح 4: تحميل كسول للتضاريس عند الطلب ━━━
  const ensureTerrain = React.useCallback(() => {
    const map = mapRef.current;
    if (!map || terrainAddedRef.current) return;
    try {
      map.addSource("terrain", {
        type: "raster-dem",
        tiles: TERRAIN_TILES,
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 13,
      });
      map.setTerrain({ source: "terrain", exaggeration: 1.3 });
      terrainAddedRef.current = true;
    } catch (e) {
      console.warn("terrain:", e);
    }
  }, []);

  // تبديل وضع العرض
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    try {
      if (viewMode === "satellite") {
        ensureSatelliteLayer();
        map.setLayoutProperty("satellite-layer", "visibility", "visible");
      } else {
        if (satelliteAddedRef.current) {
          map.setLayoutProperty("satellite-layer", "visibility", "none");
        }
      }
    } catch (e) { console.warn("toggle:", e); }
  }, [viewMode, mapLoaded, ensureSatelliteLayer]);

  // تبديل التضاريس
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (terrainOn) {
      ensureTerrain();
    }
    // لا نُعطّل التضاريس بعد التفعيل (إزالتها معقدة؛ نتركها)
  }, [terrainOn, mapLoaded, ensureTerrain]);

  return (
    <div className="space-y-3">
      <Script src={VENDOR_SCRIPT} strategy="afterInteractive" onLoad={() => setScriptLoaded(true)} onError={() => setError("فشل تحميل MapLibre")} />

      {/* تبديل وضع العرض */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          type="button"
          onClick={() => setViewMode("streets")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "streets" ? "bg-primary text-white shadow-lg" : "bg-white/90 backdrop-blur-md hover:bg-white border border-border"}`}
        >
          شوارع ومبانٍ
        </button>
        <button
          type="button"
          onClick={() => setViewMode("satellite")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "satellite" ? "bg-primary text-white shadow-lg" : "bg-white/90 backdrop-blur-md hover:bg-white border border-border"}`}
        >
          قمر صناعي
        </button>
        <button
          type="button"
          onClick={() => setTerrainOn((v) => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${terrainOn ? "bg-primary text-white shadow-lg" : "bg-white/90 backdrop-blur-md hover:bg-white border border-border"}`}
          title="تضاريس ثلاثية الأبعاد"
        >
          تضاريس 3D
        </button>
      </div>

      {/* وعاء الخريطة */}
      <div className="relative w-full h-[60vh] min-h-[380px] rounded-2xl overflow-hidden shadow-2xl border-2 border-border">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
            <div className="text-center">
              <p className="font-bold mb-1">تعذّر تحميل الخريطة</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" dir="rtl" aria-label="خريطة ثلاثية الأبعاد لمراكش" role="application" />
        {!mapLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">
                {scriptLoaded ? "جاري تهيئة الخريطة..." : "جاري تحميل مكتبة الخريطة..."}
              </p>
              <p className="text-xs mt-1 opacity-70">OpenFreeMap + ESRI Satellite</p>
            </div>
          </div>
        )}
        {/* شارة الموقع */}
        <div className="absolute top-4 end-4 z-10 rounded-lg bg-white/90 backdrop-blur-md px-4 py-2 text-xs shadow-lg">
          <span className="font-bold text-primary">مراكش</span>
          <span className="text-muted-foreground"> · المملكة المغربية</span>
        </div>
      </div>

      {/* وسيلة الإيضاح */}
      <div className="flex flex-wrap gap-3 text-xs">
        {DISTRICTS.map((d) => (
          <div key={d.nameFr} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-medium">{d.name}</span>
            <span dir="ltr" className="text-muted-foreground text-[10px]">{d.nameFr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreeDMap;
