
"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, Timer, BellRing } from "lucide-react";
import { useMediaStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DateAndClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  const { prayerTimes } = useMediaStore();
  
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerInfo = useMemo(() => {
    if (!now || !prayerTimes || prayerTimes.length === 0) return null;
    
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `2026-02-${day}`;
    const pTimes = prayerTimes.find(p => p.date === dateStr) || prayerTimes[0];
    
    const prayers = [
      { name: "الفجر", time: pTimes.fajr, iqamah: 25 },
      { name: "الظهر", time: pTimes.dhuhr, iqamah: 20 },
      { name: "العصر", time: pTimes.asr, iqamah: 20 },
      { name: "المغرب", time: pTimes.maghrib, iqamah: 10 },
      { name: "العشاء", time: pTimes.isha, iqamah: 20 },
    ];

    // Check if currently praying (Iqamah period)
    for (let p of prayers) {
      const azanMins = timeToMinutes(p.time);
      const iqamahMins = azanMins + p.iqamah;
      if (currentMinutes >= azanMins && currentMinutes < iqamahMins) {
        const sinceAzan = currentMinutes - azanMins;
        return {
          type: "iqamah",
          label: `صلاة ${p.name} قائمة`,
          subLabel: `مضى ${sinceAzan} دقائق على الأذان`,
          color: "text-accent"
        };
      }
    }

    // Find next prayer
    let next = prayers.find(p => timeToMinutes(p.time) > currentMinutes);
    if (!next) next = prayers[0];

    const targetMins = timeToMinutes(next.time);
    let diff = targetMins - currentMinutes;
    if (diff < 0) diff += 24 * 60;
    
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return {
      type: "next",
      label: `متبقي لـ ${next.name}`,
      subLabel: `${h > 0 ? h + ' ساعة و ' : ''}${m} دقيقة`,
      color: "text-primary"
    };
  }, [now, prayerTimes]);

  if (!now) return null;

  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-black/40 rounded-[2.5rem] relative overflow-hidden text-center">
      <div className="flex flex-col items-center gap-4 relative z-10 w-full">
        {/* Hour on Top - Big and Clear */}
        <div className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] tabular-nums leading-none">
          {timeString}
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] text-white/90 font-black uppercase tracking-widest">{dateString}</span>
        </div>

        {/* Prayer Info on Bottom */}
        {prayerInfo && (
          <div className={cn(
            "w-full flex flex-col items-center gap-1 p-4 rounded-[2rem] border-2 transition-all duration-500 bg-white/5",
            prayerInfo.type === 'iqamah' ? "border-accent/40 bg-accent/10 shadow-[0_0_30px_rgba(var(--accent),0.1)]" : "border-white/5"
          )}>
            <div className="flex items-center gap-2">
              {prayerInfo.type === 'iqamah' ? <BellRing className="w-4 h-4 text-accent animate-pulse" /> : <Timer className="w-4 h-4 text-primary" />}
              <span className="text-[11px] font-black text-white/80 uppercase tracking-wide">{prayerInfo.label}</span>
            </div>
            <span className={cn("text-2xl font-black drop-shadow-lg", prayerInfo.color)}>
              {prayerInfo.subLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
