
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Moon as MoonIcon, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MoonData {
  image: {
    url: string;
  };
  phase: string | number;
  illumination: number;
  distance: number;
  age: number;
}

export function MoonWidget() {
  const [moonData, setMoonData] = useState<MoonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [infoIndex, setInfoIndex] = useState(0);

  useEffect(() => {
    async function fetchMoonData() {
      const now = new Date();
      const hours = now.getHours();
      let targetDate = new Date(now);

      // NASA logic: If before 18:00, use previous day's data for stability
      if (hours < 18) {
        targetDate.setDate(targetDate.getDate() - 1);
      }

      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const day = targetDate.getDate().toString().padStart(2, '0');
      const nasaDateString = `${year}-${month}-${day}T18:00`;

      try {
        const response = await fetch(`https://svs.gsfc.nasa.gov/api/dialamoon/${nasaDateString}`);
        if (!response.ok) throw new Error("NASA API failed");
        const data = await response.json();
        setMoonData(data);
      } catch (error) {
        console.error("Failed to fetch NASA moon data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMoonData();

    const rotTimer = setInterval(() => {
      setRotation(prev => (prev + 0.05) % 360);
    }, 100);

    const infoTimer = setInterval(() => {
      setInfoIndex((prev) => (prev + 1) % 3);
    }, 4000);

    return () => {
      clearInterval(rotTimer);
      clearInterval(infoTimer);
    };
  }, []);

  const currentInfo = useMemo(() => {
    if (!moonData) return { label: "Syncing", value: "NASA SVS" };
    
    const formattedPhase = typeof moonData.phase === 'string' 
      ? moonData.phase.replace(/-/g, ' ') 
      : String(moonData.phase || "Loading...");

    const infos = [
      { label: "Illumination", value: `${Math.round(moonData.illumination || 0)}%` },
      { label: "Distance", value: `${(moonData.distance || 0).toLocaleString()} KM` },
      { label: "Current Phase", value: formattedPhase },
    ];
    return infos[infoIndex];
  }, [moonData, infoIndex]);

  const hijriDay = "١١";

  return (
    <div className="h-full w-full bg-black rounded-[2.5rem] border border-white/5 overflow-hidden relative group shadow-2xl flex flex-col items-center justify-center">
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000"
          alt="Space Background"
          fill
          className="object-cover opacity-30 group-hover:scale-110 transition-transform duration-[10s]"
          data-ai-hint="space galaxy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>
      
      <CardContent className="p-6 h-full flex flex-col items-center justify-center gap-4 relative z-10 w-full text-center">
        <div className="relative w-36 h-32 flex-shrink-0 mx-auto">
          {loading ? (
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="relative w-32 h-32 mx-auto">
              <div id="hijri-moon-overlay" 
                className="absolute inset-0 flex items-center justify-center z-20 font-black text-6xl opacity-30 pointer-events-none"
                style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.7)', textShadow: '0 4px 10px rgba(0,0,0,0.5)', transform: 'scale(3.5)' }}
              >
                {hijriDay}
              </div>
              <div className="relative w-full h-full rounded-full overflow-hidden ring-[8px] ring-white/5 shadow-[0_0_60px_rgba(59,130,246,0.3)] bg-black">
                {moonData?.image?.url && (
                  <Image
                    src={moonData.image.url}
                    alt="NASA Live Moon"
                    fill
                    className="object-cover transition-transform duration-100 scale-[1.15]"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-1.5 w-full">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <MoonIcon className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80">NASA LIVE FEED</span>
          </div>
          
          <div className="space-y-0 h-12 flex flex-col justify-center">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">{currentInfo.label}</p>
            <h3 className="text-2xl font-black text-white leading-none drop-shadow-2xl capitalize">
              {currentInfo.value}
            </h3>
          </div>

          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  infoIndex === i ? "bg-blue-400 w-4" : "bg-white/10 w-1"
                )} 
              />
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  );
}
