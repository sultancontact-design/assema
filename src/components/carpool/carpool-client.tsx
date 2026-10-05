"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Users, Coins, Car, Phone, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Ride {
  id: string;
  driverId: string;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string | null;
  seatsTotal: number;
  seatsTaken: number;
  pricePerSeat: number;
  notes: string | null;
  contactInfo: string | null;
  vehicleInfo: string | null;
  regionName: string | null;
  status: string;
  bookingsCount: number;
}

interface Props {
  initialRides: Ride[];
  loggedIn: boolean;
  userId: string | null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const dayLabel = diff < 86_400_000 ? "اليوم" : diff < 172_800_000 ? "غداً" : "بعد غد";
  return `${dayLabel} ${d.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}`;
}

export function CarpoolClient({ initialRides, loggedIn, userId }: Props) {
  const [rides] = useState(initialRides);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    originCity: "",
    destinationCity: "",
    departureTime: "",
    seatsTotal: 4,
    pricePerSeat: 0,
    notes: "",
    contactInfo: "",
    vehicleInfo: "",
    regionName: "",
  });

  const filtered = useMemo(() => {
    let list = rides;
    if (origin.trim()) list = list.filter(r => r.originCity.toLowerCase().includes(origin.toLowerCase()));
    if (destination.trim()) list = list.filter(r => r.destinationCity.toLowerCase().includes(destination.toLowerCase()));
    return list;
  }, [rides, origin, destination]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.originCity || !form.destinationCity || !form.departureTime) {
      toast.error("املأ الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/carpool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("failed");
      toast.success("تم نشر الرحلة");
      setForm({ originCity: "", destinationCity: "", departureTime: "", seatsTotal: 4, pricePerSeat: 0, notes: "", contactInfo: "", vehicleInfo: "", regionName: "" });
      setShowForm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("فشل النشر");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Search bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-2">
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <input type="text" placeholder="من (مدينة المغادرة)" value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full pr-10 pl-3 py-2 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-600" />
              <input type="text" placeholder="إلى (مدينة الوصول)" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full pr-10 pl-3 py-2 rounded-md border border-input bg-background text-sm" />
            </div>
            <Button onClick={() => { if (!loggedIn) { toast.info("سجّل دخول"); return; } setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> اعرض رحلة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="mb-4 border-teal-300/60 bg-teal-50/30 dark:bg-teal-950/10">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">عرض رحلة جديدة</h3>
                <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="من" value={form.originCity} onChange={(e) => setForm({...form, originCity: e.target.value})} className="px-3 py-2 rounded-md border border-input bg-background text-sm" required />
                <input type="text" placeholder="إلى" value={form.destinationCity} onChange={(e) => setForm({...form, destinationCity: e.target.value})} className="px-3 py-2 rounded-md border border-input bg-background text-sm" required />
              </div>
              <input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({...form, departureTime: e.target.value})} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" required />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min="1" max="8" placeholder="مقاعد" value={form.seatsTotal} onChange={(e) => setForm({...form, seatsTotal: parseInt(e.target.value) || 4})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
                <input type="number" min="0" placeholder="سعر/مقعد" value={form.pricePerSeat} onChange={(e) => setForm({...form, pricePerSeat: parseFloat(e.target.value) || 0})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
                <input type="text" placeholder="الجهة" value={form.regionName} onChange={(e) => setForm({...form, regionName: e.target.value})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <input type="text" placeholder="معلومات السيارة" value={form.vehicleInfo} onChange={(e) => setForm({...form, vehicleInfo: e.target.value})} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
              <input type="text" placeholder="معلومات التواصل" value={form.contactInfo} onChange={(e) => setForm({...form, contactInfo: e.target.value})} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
              <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري</> : <><Send className="h-4 w-4" /> نشر</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rides list */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد رحلات مطابقة</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const seatsLeft = r.seatsTotal - r.seatsTaken;
            const full = seatsLeft <= 0;
            return (
              <Card key={r.id} className="hover:border-teal-400 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                      <Car className="h-6 w-6 text-teal-700 dark:text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold">
                          <span className="text-emerald-700 dark:text-emerald-300">{r.originCity}</span>
                          <span className="mx-2 text-muted-foreground">←</span>
                          <span className="text-rose-700 dark:text-rose-300">{r.destinationCity}</span>
                        </h3>
                        <Badge variant={full ? "secondary" : "default"} className={full ? "" : "bg-emerald-100 text-emerald-700 border-emerald-300"}>
                          {full ? "مكتمل" : `${seatsLeft} مقاعد`}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(r.departureTime)}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.seatsTaken}/{r.seatsTotal}</span>
                        <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> {r.pricePerSeat === 0 ? "مجاناً" : `${r.pricePerSeat} درهم`}</span>
                      </div>
                      {r.vehicleInfo && <p className="text-xs mt-1 text-muted-foreground">🚗 {r.vehicleInfo}</p>}
                      {r.notes && <p className="text-xs mt-1 text-muted-foreground line-clamp-1">📝 {r.notes}</p>}
                      {r.contactInfo && !full && (
                        <a href={`tel:${r.contactInfo}`} className="text-xs mt-2 inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 hover:underline">
                          <Phone className="h-3 w-3" /> {r.contactInfo}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
