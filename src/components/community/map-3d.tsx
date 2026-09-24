"use client";

// ===================================================================
//  Map3D — خريطة ثلاثية الأبعاد لمراكش باستخدام MapLibre GL JS
//  - بلاطات مجانية من OpenFreeMap (liberty style) — لا تتطلّب API key
//  - إمالة 45° (pitch) لتجسيم 3D
//  - 5 علامات للأحياء مع popups عند النقر
//  - أزرار التحكّم (Zoom + Rotate) + مقياس
//  - إسناد بالعربية
//  - متجاوب: 500px على سطح المكتب، 300px على الجوال
// ===================================================================

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MaplibreMap, Marker as MaplibreMarker, Popup as MaplibrePopup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ===================================================================
//  Map3D — client component
// ===================================================================
export interface DistrictMarker {
  slug: string;
  name: string;
  nameFr?: string | null;
  members: number;
  families: number;
  longitude: number;
  latitude: number;
  color?: string;
}

export interface Map3DProps {
  districts: DistrictMarker[];
  /** ارتفاع بالبكسل على سطح المكتب */
  desktopHeight?: number;
  /** ارتفاع بالبكسل على الجوال */
  mobileHeight?: number;
  highlightSlug?: string;
}

// اللوحة الأصلية: زليج مراكش
const ZELLIGE_COLORS = ["#B8492B", "#2D5A3D", "#C8842A", "#1F1A17", "#8B5A2B"];

// إنشاء عنصر دبوس مغربي الشكل
function createPinElement(color: string, size: number): HTMLElement {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.style.width = `${size}px`;
  el.style.height = `${size * 1.22}px`;
  el.innerHTML = `
    <svg width="${size}" height="${size * 1.22}" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10 14 20 14 20s14-10 14-20C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#FBF6EE" stroke-width="1.5" />
      <circle cx="14" cy="14" r="5" fill="#FBF6EE" />
      <circle cx="14" cy="14" r="3" fill="${color}" />
    </svg>
  `;
  return el;
}

export function Map3D({
  districts,
  desktopHeight = 500,
  mobileHeight = 300,
  highlightSlug,
}: Map3DProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MaplibreMap | null>(null);
  const markersRef = React.useRef<MaplibreMarker[]>([]);
  const [height, setHeight] = React.useState(desktopHeight);

  // استجابة للعرض: 500 على سطح المكتب، 300 على الجوال
  React.useEffect(() => {
    function updateHeight() {
      setHeight(window.innerWidth < 768 ? mobileHeight : desktopHeight);
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [desktopHeight, mobileHeight]);

  // تهيئة الخريطة
  React.useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // تجنّب التهيئة المزدوجة في React strict mode

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-7.9811, 31.6295], // [lng, lat] Marrakech
      zoom: 12,
      pitch: 45,
      bearing: 0,
      attributionControl: { compact: true },
      locale: {
        "AttributionControl.TogglePreview": "إظهار/إخفاء الإسناد",
        "NavigationControl.ZoomIn": "تكبير",
        "NavigationControl.ZoomOut": "تصغير",
        "NavigationControl.ResetBearing": "إعادة ضبط الاتجاه",
        "ScaleControl.Feet": "قدم",
        "ScaleControl.Meters": "متر",
        "FullscreenControl.Enter": "ملء الشاشة",
        "FullscreenControl.Exit": "إنهاء ملء الشاشة",
      } as Record<string, string>,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric", maxWidth: 150 }),
      "bottom-left"
    );

    mapRef.current = map;

    // تنظيف عند الإزالة
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // إضافة/تحديث العلامات عند تغيّر الأحياء
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function addMarkers() {
      if (!map) return;
      // إزالة العلامات القديمة
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      districts.forEach((d, i) => {
        const color = d.color ?? ZELLIGE_COLORS[i % ZELLIGE_COLORS.length];
        const isHighlight = highlightSlug === d.slug;
        const size = isHighlight ? 36 : 28;

        const el = createPinElement(color, size);
        el.setAttribute("aria-label", d.name);
        el.title = d.name;

        // إنشاء popup
        const popup = new maplibregl.Popup({
          offset: [0, -34],
          closeButton: true,
          closeOnClick: false,
          maxWidth: "260px",
        }).setHTML(`
          <div dir="rtl" class="text-start" style="font-family: 'Tajawal', sans-serif;">
            <p style="font-weight: bold; font-size: 13px; color: #1F1A17; margin: 0 0 2px;">
              ${d.name}
            </p>
            ${d.nameFr ? `<p style="font-size: 11px; color: #6b7280; margin: 0 0 6px;" dir="ltr">${d.nameFr}</p>` : ""}
            <div style="font-size: 11px; color: #6b7280; line-height: 1.6;">
              <p style="margin: 0;">أعضاء: <span style="font-weight: 600; color: #1F1A17;">${d.members.toLocaleString("ar-MA")}</span></p>
              <p style="margin: 0;">أسر: <span style="font-weight: 600; color: #1F1A17;">${d.families.toLocaleString("ar-MA")}</span></p>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([d.longitude, d.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on("load", addMarkers);
    }

    return () => {
      map.off("load", addMarkers);
    };
  }, [districts, highlightSlug]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-card warm-shadow"
      style={{ height: `${height}px` }}
      dir="ltr"
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* تسمية مصغّرة — اسم المدينة */}
      <div
        className="absolute top-2 end-2 rounded-md bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm border border-border"
        dir="rtl"
      >
        مراكش · المملكة المغربية
      </div>
    </div>
  );
}

export default Map3D;
