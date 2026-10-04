"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, AlertTriangle, X, MapPin } from "lucide-react";

const EMERGENCY_NUMBERS = [
  { label: "الشرطة", number: "19", color: "bg-blue-600" },
  { label: "الدرك الملكي", number: "177", color: "bg-amber-600" },
  { label: "الإسعاف", number: "150", color: "bg-rose-600" },
  { label: "الوقاية المدنية", number: "15", color: "bg-red-600" },
  { label: "النجدة من الطرق", number: "177", color: "bg-emerald-600" },
  { label: "مكافحة العنف ضد النساء", number: "8350", color: "bg-purple-600" },
];

export function SosButton() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setLocation("غير متاح"),
      { timeout: 5000, enableHighAccuracy: false }
    );
  }, [open]);

  return (
    <>
      {/* Floating SOS button — bottom-right */}
      <button
        onClick={() => setOpen(true)}
        aria-label="زر الطوارئ"
        className="fixed bottom-20 left-4 z-40 md:bottom-4 md:left-4 h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110"
      >
        <AlertTriangle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 animate-ping" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-md border-red-300"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-red-700">أرقام الطوارئ بالمغرب</h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-3 w-3" /> موقعك التقريبي: {location}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-4">
                {EMERGENCY_NUMBERS.map((e) => (
                  <a
                    key={e.label}
                    href={`tel:${e.number}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <div className={`h-7 w-7 rounded-full ${e.color} text-white flex items-center justify-center text-xs`}>
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{e.label}</p>
                      <p className="text-sm font-bold">{e.number}</p>
                    </div>
                  </a>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                ⚠️ استعمل هذه الأرقام فقط في حالات الطوارئ الحقيقية
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
