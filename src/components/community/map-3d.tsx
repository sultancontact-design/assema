"use client";

import * as React from "react";
import Script from "next/script";

// ===================================================================
//  Map3D v20.1 — خريطة احترافية ثلاثية الأبعاد لمراكش
//  "Google Maps quality" — مفتوحة المصدر 100% — بدون API Key
//
//  v20.1: ملفات maplibre محلية في /vendor/ (بدل CDN)
//    - لا DNS خارجي (أسرع على 4G المغربي)
//    - نفس المصدر (لا CORS)
//    - أكثر موثوقية (لا اعتماد على unpkg/jsdelivr)
//
//  مكتبة: MapLibre GL JS v4.7.1 (UMD build — قابل للتحميل كـscript)
//  مصادر الطبقات:
//    1. Base: OpenFreeMap liberty (3D buildings + شوارع + تسميات)
//    2. Satellite: EOX Sentinel-2 Cloudless (10m resolution) + ESRI fallback
//    3. Terrain 3D: AWS Terrarium (exaggeration 1.5) + hillshade
// ===================================================================

declare global {
  interface Window {
    maplibregl?: {
      Map: new (opts: Record<string, unknown>) => MaplibreMapLike;
      Marker: new (opts: Record<string, unknown>) => MarkerLike;
      Popup: new (opts: Record<string, unknown>) => PopupLike;
      NavigationControl: new (opts?: Record<string, unknown>) => unknown;
      ScaleControl: new (opts?: Record<string, unknown>) => unknown;
      FullscreenControl: new () => unknown;
      GeolocateControl: new (opts?: Record<string, unknown>) => unknown;
      workerUrl: string;
      [key: string]: unknown;
    };
  }
}

interface MaplibreMapLike {
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

interface MarkerLike {
  setLngLat(coords: [number, number]): MarkerLike;
  setPopup(popup: PopupLike): MarkerLike;
  addTo(map: MaplibreMapLike): MarkerLike;
}

interface PopupLike {
  setHTML(html: string): PopupLike;
}

// ملفات محلية في /vendor/
const LOCAL_SCRIPT = "/vendor/maplibre-gl.js";
const LOCAL_WORKER = "/vendor/maplibre-gl-csp-worker.js";

// مصادر الطبقات
const STYLE_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";
const SATELLITE_EOX_TILES = ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"];
const SATELLITE_ESRI_TILES = ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"];
const TERRAIN_TILES = ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"];
const MARRAKECH_CENTER: [number, number] = [-7.98, 31.63];

export interface DistrictMarker {
  nameAr: string;
  nameFr?: string;
  members?: number;
  families?: number;
  coords: [number, number];
  color: string;
}

const DISTRICTS: DistrictMarker[] = [
  { nameAr: "المدينة (Medina)", nameFr: "Medina", members: 45, families: 12, coords: [-7.989, 31.629], color: "#D94F30" },
  { nameAr: "جليز (Gueliz)", nameFr: "Gueliz", members: 38, families: 10, coords: [-7.998, 31.643], color: "#3D7EA6" },
  { nameAr: "المنارة (Daoudiate)", nameFr: "Daoudiate", members: 27, families: 8, coords: [-7.950, 31.600], color: "#7D9D3F" },
  { nameAr: "النخيل (Palmeraie)", nameFr: "Palmeraie", members: 22, families: 6, coords: [-7.920, 31.650], color: "#E0A458" },
  { nameAr: "سيدي يوسف بن علي", nameFr: "Sidi Youssef Ben Ali", members: 68, families: 18, coords: [-7.970, 31.610], color: "#8B5CF6" },
];

type ViewMode = "liberty" | "satellite" | "hybrid";

export interface Map3DProps {
  districts?: DistrictMarker[];
  desktopHeight?: number;
  mobileHeight?: number;
}

export function Map3D({
  districts,
  desktopHeight = 600,
  mobileHeight = 400,
}: Map3DProps) {
  const markers = districts ?? DISTRICTS;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MaplibreMapLike | null>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("liberty");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Initialize map when script loaded
  React.useEffect(() => {
    if (!scriptLoaded || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    try {
      const ml = window.maplibregl;
      if (!ml) {
        setError("MapLibre GL JS لم يُحمَّل");
        return;
      }
      ml.workerUrl = LOCAL_WORKER;

      const map = new ml.Map({
        container: containerRef.current,
        style: STYLE_LIBERTY,
        center: MARRAKECH_CENTER,
        zoom: 12,
        pitch: 50,
        bearing: -15,
        maxPitch: 85,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        // 1) EOX Sentinel-2 Cloudless (satellite)
        try {
          map.addSource("satellite-eox", {
            type: "raster",
            tiles: SATELLITE_EOX_TILES,
            tileSize: 256,
            attribution: "Sentinel-2 cloudless © EOX / Copernicus",
            maxzoom: 14,
          });
        } catch (e) { console.warn("EOX:", e); }

        // 2) ESRI fallback satellite
        try {
          map.addSource("satellite-esri", {
            type: "raster",
            tiles: SATELLITE_ESRI_TILES,
            tileSize: 256,
            attribution: "Tiles © Esri",
            maxzoom: 19,
          });
        } catch (e) { console.warn("ESRI:", e); }

        // 3) AWS Terrarium terrain 3D
        try {
          map.addSource("terrain", {
            type: "raster-dem",
            tiles: TERRAIN_TILES,
            tileSize: 256,
            encoding: "terrarium",
            maxzoom: 15,
          });
          map.setTerrain({ source: "terrain", exaggeration: 1.5 });
          if (!map.getLayer("hillshade")) {
            map.addLayer({
              id: "hillshade",
              type: "hillshade",
              source: "terrain",
              paint: {
                "hillshade-shadow-color": "#000000",
                "hillshade-exaggeration": 0.3,
                "hillshade-illumination-anchor": "viewport",
              },
            });
          }
        } catch (e) { console.warn("Terrain:", e); }

        // 4) Satellite layer (hidden by default)
        try {
          map.addLayer({
            id: "satellite-layer",
            type: "raster",
            source: "satellite-eox",
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.9 },
          });
        } catch (e) { console.warn("Sat layer:", e); }

        // 5) District markers
        markers.forEach((d) => {
          const pinEl = document.createElement("div");
          pinEl.innerHTML = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
            <path d="M16 0 C8 0 2 6 2 14 C2 24 16 40 16 40 S30 24 30 14 C30 6 24 0 16 0 Z" fill="${d.color}" stroke="#FBF6EE" stroke-width="2"/>
            <circle cx="16" cy="15" r="6" fill="#FBF6EE"/><circle cx="16" cy="15" r="3" fill="${d.color}"/>
          </svg>`;
          new ml.Marker({ element: pinEl, anchor: "bottom" })
            .setLngLat(d.coords)
            .setPopup(
              new ml.Popup({ offset: 25, maxWidth: "300px" }).setHTML(
                `<div dir="rtl" lang="ar" style="font-family:'Tajawal',sans-serif;padding:8px">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${d.color}"></span>
                    <strong style="color:${d.color};font-size:15px">${d.nameAr}</strong>
                  </div>
                  ${d.nameFr ? `<div style="color:#6b7280;font-size:12px;margin-bottom:6px">${d.nameFr}</div>` : ""}
                  ${d.members !== undefined ? `<div style="font-size:13px;margin-bottom:2px">👥 <strong>${d.members}</strong> عضو</div>` : ""}
                  ${d.families !== undefined ? `<div style="font-size:13px;margin-bottom:2px">🏠 <strong>${d.families}</strong> أسرة</div>` : ""}
                  <div style="font-size:11px;color:#9ca3af;margin-top:6px">📍 ${d.coords[1].toFixed(4)}°, ${d.coords[0].toFixed(4)}°</div>
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
      if (!cancelled) setError(e instanceof Error ? e.message : "خطأ في تحميل الخريطة");
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, [scriptLoaded]);

  // View mode switching
  React.useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    if (viewMode === "satellite" || viewMode === "hybrid") {
      try { map.setLayoutProperty("satellite-layer", "visibility", "visible"); } catch {}
      try { map.setTerrain({ source: "terrain", exaggeration: 1.5 }); } catch {}
    } else {
      try { map.setLayoutProperty("satellite-layer", "visibility", "none"); } catch {}
      try { map.setTerrain({ source: "terrain", exaggeration: 1.5 }); } catch {}
    }
  }, [viewMode, mapLoaded]);

  const height = isMobile ? mobileHeight : desktopHeight;

  return (
    <div className="space-y-3">
      {/* Load MapLibre from local /vendor/ (no CDN — better for 4G) */}
      <Script
        src={LOCAL_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError("فشل تحميل MapLibre GL JS من /vendor/")}
      />

      {/* View mode switcher */}
      <div className="flex gap-2 flex-wrap">
        {([
          { mode: "liberty" as const, icon: "🏙️", label: "مبانٍ 3D" },
          { mode: "satellite" as const, icon: "🛰️", label: "قمر صناعي" },
          { mode: "hybrid" as const, icon: "🗺️", label: "هجين" },
        ]).map(({ mode, icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === mode ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-border">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm" style={{ height }}>
            <div className="text-center">
              <p className="font-bold mb-1">تعذّر تحميل الخريطة</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full"
          style={{ height, minHeight: 300 }}
          dir="rtl"
          aria-label="خريطة ثلاثية الأبعاد لمراكش"
          role="application"
        />
        {!mapLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none">
            <div className="text-center text-muted-foreground">
              <div className="animate-pulse text-5xl mb-2">🗺️</div>
              <p className="text-sm">{scriptLoaded ? "جاري تهيئة الخريطة..." : "جاري تحميل مكتبة الخريطة..."}</p>
              <p className="text-xs mt-1 opacity-70">OpenFreeMap + EOX Sentinel-2 + AWS Terrain</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 end-3 z-10 rounded-lg bg-background/95 backdrop-blur px-4 py-2 text-xs shadow-lg border border-border">
          <span className="font-bold text-primary">📍 مراكش</span>
          <span className="text-muted-foreground"> · المملكة المغربية</span>
        </div>
        <div className="absolute bottom-0 start-0 z-10 text-[10px] bg-background/80 backdrop-blur px-2 py-0.5 rounded-tr-md">
          <a href="https://openfreemap.org" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">OpenFreeMap</a>
          {" · "}
          <a href="https://maps.eox.at" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">EOX</a>
          {" · "}
          <a href="https://registry.opendata.aws/elevation-tiles-prod/" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">AWS Terrain</a>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {markers.map((d) => (
          <div key={d.nameAr} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-medium">{d.nameAr}</span>
            {d.members !== undefined && <span className="text-muted-foreground">({d.members})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Map3D;
