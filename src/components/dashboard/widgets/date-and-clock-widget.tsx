
"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

export function DateAndClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  // Use 24-hour time without AM/PM to focus on the time value and reduce height
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-black/40 rounded-[2.5rem] relative overflow-hidden text-center">
      <div className="flex flex-col items-center gap-4 relative z-10 w-full">
        {/* Hour on Top - Huge and prominent */}
        <div className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] tabular-nums leading-none">
          {timeString}
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
          <Calendar className="w-4 h-4 text-accent" />
          <span className="text-xs text-white/90 font-black uppercase tracking-widest">{dateString}</span>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Satellite Sync Online</span>
        </div>
      </div>
    </div>
  );
}
