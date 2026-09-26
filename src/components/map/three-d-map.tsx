"use client";

import * as React from "react";
import Script from "next/script";

// ===================================================================
//  ThreeDMap v32.0 — خريطة MapLibre 3D احترافية
//  - OpenFreeMap liberty (3D buildings + streets + labels)
//  - Stadia Alidade Satellite (real satellite imagery)
//  - AWS Terrarium (3D terrain elevation)
//  - Local /vendor/ worker (no CDN dependency)
//  - Dynamic import with ssr:false (lazy load, saves ~200KB)
//  - 5 district markers with Arabic popups
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
  addSource(id: string, source: Record<string, unknown>): void;
  addLayer(layer: Record<string, unknown>): void;
  setTerrain(opts: Record<string, unknown>): void;
  getLayer(id: string): unknown;
  setLayoutProperty(layer: string, prop: string, val: unknown): void;
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
const SATELLITE_TILES = ["https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}@2x.jpg"];
const SATELLITE_TILES_FALLBACK = ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"];
const TERRAIN_TILES = ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"];
const MARRAKECH: [number, number] = [-7.98, 31.63];

const DISTRICTS = [
  { name: "المدينة (Medina)", coords: [-7.989, 31.629] as [number, number], color: "#E85A3D" },
  { name: "جليز (Gueliz)", coords: [-7.998, 31.643] as [number, number], color: "#299B6D" },
  { name: "المنارة (Daoudiate)", coords: [-7.950, 31.600] as [number, number], color: "#F5B220" },
  { name: "النخيل (Palmeraie)", coords: [-7.920, 31.650] as [number, number], color: "#8B5CF6" },
  { name: "سيدي يوسف بن علي", coords: [-7.970, 31.610] as [number, number], color: "#E85A3D" },
];

type ViewMode = "streets" | "satellite";

export function ThreeDMap() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapInstance | null>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("streets");

  // Initialize map when script loads
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
        zoom: 12,
        pitch: 55,
        bearing: -15,
        maxPitch: 85,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        // 1) Stadia Alidade Satellite (primary satellite)
        try {
          map.addSource("satellite-stadia", {
            type: "raster",
            tiles: SATELLITE_TILES,
            tileSize: 512,
            attribution: "© Stadia Maps © OpenMapTiles",
            maxzoom: 20,
          });
        } catch (e) { console.warn("Stadia source:", e); }

        // 2) ESRI fallback satellite
        try {
          map.addSource("satellite-esri", {
            type: "raster",
            tiles: SATELLITE_TILES_FALLBACK,
            tileSize: 256,
            attribution: "Tiles © Esri",
            maxzoom: 19,
          });
        } catch (e) { console.warn("ESRI source:", e); }

        // 3) AWS Terrarium 3D terrain
        try {
          map.addSource("terrain", {
            type: "raster-dem",
            tiles: TERRAIN_TILES,
            tileSize: 256,
            encoding: "terrarium",
            maxzoom: 15,
          });
          map.setTerrain({ source: "terrain", exaggeration: 1.5 });
        } catch (e) { console.warn("Terrain:", e); }

        // 4) Satellite layer (hidden by default — use streets view first)
        try {
          map.addLayer({
            id: "satellite-layer",
            type: "raster",
            source: "satellite-stadia",
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.9 },
          });
        } catch (e) { console.warn("Sat layer:", e); }

        // 5) District markers
        DISTRICTS.forEach((d) => {
          const pinEl = document.createElement("div");
          pinEl.innerHTML = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
            <path d="M16 0 C8 0 2 6 2 14 C2 24 16 40 16 40 S30 24 30 14 C30 6 24 0 16 0 Z" fill="${d.color}" stroke="#FBF8F3" stroke-width="2"/>
            <circle cx="16" cy="15" r="6" fill="#FBF8F3"/><circle cx="16" cy="15" r="3" fill="${d.color}"/>
          </svg>`;
          new ml.Marker({ element: pinEl, anchor: "bottom" })
            .setLngLat(d.coords)
            .setPopup(
              new ml.Popup({ offset: 25, maxWidth: "300px" }).setHTML(
                `<div dir="rtl" lang="ar" style="font-family:'Tajawal',sans-serif;padding:8px">
                  <strong style="color:${d.color};font-size:15px">${d.name}</strong>
                  <div style="font-size:11px;color:#9ca3af;margin-top:4px">📍 ${d.coords[1].toFixed(4)}°, ${d.coords[0].toFixed(4)}°</div>
                </div>`
              )
            )
            .addTo(map);
        });

        // 6) Controls
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new ml.ScaleControl({ unit: "metric", maxWidth: 150 }), "bottom-left");
        map.addControl(new ml.FullscreenControl(), "top-right");
        try {
          map.addControl(
            new ml.GeolocateControl({
              positionOptions: { enableHighAccuracy: true },
              trackUserLocation: true,
              showAccuracyCircle: true,
              showUserLocation: true,
            }),
            "top-right"
          );
        } catch (e) { console.warn("Geolocate:", e); }

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

  // View mode toggle
  React.useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    try {
      if (viewMode === "satellite") {
        map.setLayoutProperty("satellite-layer", "visibility", "visible");
      } else {
        map.setLayoutProperty("satellite-layer", "visibility", "none");
      }
    } catch {}
  }, [viewMode, mapLoaded]);

  return (
    <div className="space-y-3">
      <Script src={VENDOR_SCRIPT} strategy="afterInteractive" onLoad={() => setScriptLoaded(true)} onError={() => setError("فشل تحميل MapLibre")} />

      {/* View mode toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setViewMode("streets")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "streets" ? "bg-primary text-white shadow-lg" : "bg-white/90 backdrop-blur-md hover:bg-white"}`}
        >
          🗺️ شوارع ومبانٍ
        </button>
        <button
          type="button"
          onClick={() => setViewMode("satellite")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "satellite" ? "bg-primary text-white shadow-lg" : "bg-white/90 backdrop-blur-md hover:bg-white"}`}
        >
          🛰️ قمر صناعي
        </button>
      </div>

      {/* Map container */}
      <div className="relative w-full h-[70vh] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border-2 border-border">
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
              <p className="text-xs mt-1 opacity-70">OpenFreeMap + Stadia Satellite + AWS Terrain</p>
            </div>
          </div>
        )}
        {/* Location badge */}
        <div className="absolute top-4 end-4 z-10 rounded-lg bg-white/90 backdrop-blur-md px-4 py-2 text-xs shadow-lg">
          <span className="font-bold text-primary">📍 مراكش</span>
          <span className="text-muted-foreground"> · المملكة المغربية</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {DISTRICTS.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-medium">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreeDMap;
