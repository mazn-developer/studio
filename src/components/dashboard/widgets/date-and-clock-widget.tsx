"use client";

import { useEffect, useState } from "react";

export function DateAndClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const hours24 = now.getHours();
  let hours12 = hours24 % 12;
  hours12 = hours12 ? hours12 : 12;
  const timeString = `${hours12}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-2 rounded-[2.5rem] relative overflow-hidden text-center transition-all duration-700 premium-glass">
      <div className="flex items-center justify-center relative z-10 w-[95%] h-full">
        <div className="relative flex items-center justify-center w-full h-full">
          <svg className="w-full h-full max-h-32 drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-visible" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="clockFill" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
              </linearGradient>
              <linearGradient id="clockStroke" x1="100%" x2="0%" y1="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="central"
              className="text-[121.2px] font-black tracking-tighter tabular-nums"
              fill="url(#clockFill)"
              stroke="url(#clockStroke)"
              strokeWidth="1.2"
            >
              {timeString}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
