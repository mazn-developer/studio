
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Match } from "@/lib/football-data";
import { fetchFootballData } from "@/lib/football-api";
import { useMediaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Timer, BellRing, ChevronUp, BookOpen, Sparkles } from "lucide-react";
import { FluidGlass } from "@/components/ui/fluid-glass";
import { convertTo12Hour } from "@/lib/constants";

interface IslandItem {
  id: string;
  type: 'match' | 'reminder';
  priority: number;
  data: any;
}

export function LiveMatchIsland() {
  const { favoriteTeams, prayerTimes, belledMatchIds, reminders, isFullScreen } = useMediaStore();
  const [topMatches, setTopMatches] = useState<Match[]>([]);
  const [dhikr] = useState("سبحان الله وبحمده");
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDetailedManually, setIsDetailedManually] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMatches = useCallback(async () => {
    if (isFullScreen) return;
    try {
      const matches = await fetchFootballData('today');
      setTopMatches(matches || []);
    } catch (e) {}
  }, [isFullScreen]);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const formatHH12 = (time24: string) => {
    if (!time24) return "";
    const [h] = time24.split(':').map(Number);
    const h12 = h % 12 || 12;
    return h12.toString();
  };

  const islandQueue = useMemo(() => {
    const items: IslandItem[] = [];
    const currentHour = now.getHours();

    // 1. Reminders (Global Priority)
    reminders.forEach(r => {
      if (skippedIds.includes(r.id)) return;
      if (currentHour >= r.startHour && currentHour < r.endHour) {
        items.push({ id: r.id, type: 'reminder', priority: 10000, data: r });
      }
    });

    const matchItems: IslandItem[] = [];
    topMatches.forEach(m => {
      if (skippedIds.includes(m.id)) return;
      const isFav = favoriteTeams.some(t => t.id === m.homeTeamId || t.id === m.awayTeamId);
      const isBelled = belledMatchIds.includes(m.id);
      const isLive = m.status === 'live';
      const isFinished = m.status === 'finished';
      const isUpcoming = m.status === 'upcoming';
      
      let priority = 0;
      
      // USER SPECIFIED PRIORITIES:
      if (isLive) {
        if (isFav && isBelled) priority = 9000;      // 1. أندية مفضلة بالجرس مباشرة
        else if (isFav) priority = 8000;             // 2. أندية مفضلة مباشرة
        else if (isBelled) priority = 7000;          // 3. بالجرس مباشرة
        else priority = 2000;                        // Live Regular
      } else if (isUpcoming) {
        if (isFav && isBelled) priority = 6000;      // 4. قادمة أندية مفضلة بالجرس
        else if (isFav) priority = 5000;             // 5. قادمة أندية مفضلة
        else if (isBelled) priority = 1500;
        else priority = 500;
      } else if (isFinished) {
        priority = (isFav || isBelled) ? 1000 : 100;
      }

      if (priority > 0) {
        matchItems.push({ id: m.id, type: 'match', priority, data: m });
      }
    });

    // Limit to Top 4 Matches + Reminders
    const sortedMatches = matchItems.sort((a, b) => b.priority - a.priority).slice(0, 4);
    return [...items, ...sortedMatches].sort((a, b) => b.priority - a.priority);
  }, [now, reminders, topMatches, skippedIds, favoriteTeams, belledMatchIds]);

  const prayerIslandData = useMemo(() => {
    if (!prayerTimes?.length) return null;
    const day = now.getDate().toString().padStart(2, '0');
    const pData = prayerTimes.find(p => p.date.endsWith(`-${day}`)) || prayerTimes[0];
    
    const list = [
      { name: "الفجر", time: pData.fajr, iqamah: 25 },
      { name: "الظهر", time: pData.dhuhr, iqamah: 20 },
      { name: "العصر", time: pData.asr, iqamah: 20 },
      { name: "المغرب", time: pData.maghrib, iqamah: 10 },
      { name: "العشاء", time: pData.isha, iqamah: 20 },
    ];

    const tToM = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let prayer = list.find(p => tToM(p.time) + p.iqamah + 10 > currentMins);
    if (!prayer) prayer = list[0];

    return { 
      name: prayer.name, 
      label: "الصلاة القادمة", 
      value: convertTo12Hour(prayer.time).replace(/\s?[AP]M/i, ''),
      phase: 'upcoming' 
    };
  }, [now, prayerTimes]);

  const handleSkip = (id: string) => { 
    setSkippedIds(p => [...p, id]); 
    setActiveIndex(0); 
    setIsDetailedManually(false); 
  };

  if (isFullScreen) return null;

  const activeItem = islandQueue[activeIndex];
  const isMatchExpanded = activeItem?.type === 'match' && isDetailedManually;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-4 pointer-events-none">
      {prayerIslandData && (
        <div className="pointer-events-auto group relative">
          <div className="liquid-glass backdrop-blur-[120px] rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] transition-all duration-700 overflow-hidden relative border border-white/10 w-64 h-16 px-6">
            <FluidGlass />
            <div className="h-full flex items-center justify-between relative z-10 gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-right flex-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{prayerIslandData.label}</span>
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-xl font-black text-white tracking-tight">{prayerIslandData.name}</span>
                  <span className="text-xl font-black text-white/60 tabular-nums">{prayerIslandData.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeItem ? (
        <div className="pointer-events-auto group relative" onClick={() => activeItem.type === 'match' ? setIsDetailedManually(!isDetailedManually) : handleSkip(activeItem.id)}>
          <div className={cn(
            "liquid-glass backdrop-blur-[120px] rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] transition-all duration-700 cursor-pointer overflow-hidden relative border border-white/10",
            isMatchExpanded ? "w-[380px] h-[140px] p-0" : "w-44 h-20 p-0"
          )}>
            <FluidGlass />
            <div className="relative z-10 h-full">
              {activeItem.type === 'match' ? (
                !isMatchExpanded ? (
                  <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
                    {/* ENLARGED LOGOS BACKGROUND - Full Color, Lightened Overlay */}
                    <div className="absolute inset-0 flex items-center justify-between opacity-90">
                      <img src={activeItem.data.homeLogo} className="h-full w-3/5 object-contain scale-[1.9] -translate-x-8" alt="" />
                      <img src={activeItem.data.awayLogo} className="h-full w-3/5 object-contain scale-[1.9] translate-x-8" alt="" />
                    </div>
                    {/* REDUCED OVERLAY GRADIENT */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/5" />
                    
                    <div className="relative w-full h-full flex flex-col items-center justify-center z-20">
                      {/* RTL SCORE FIX: Home score should be on the right in the UI. 
                          In a dir="ltr" span, Away-Home will show Away on left and Home on right. */}
                      <span className="font-black text-5xl tracking-tighter tabular-nums text-white drop-shadow-[0_0_30px_rgba(0,0,0,1)]" dir="ltr">
                        {activeItem.data.status === 'upcoming' 
                          ? formatHH12(activeItem.data.startTime)
                          : `${activeItem.data.score.away}-${activeItem.data.score.home}`}
                      </span>
                      {activeItem.data.status === 'live' && (
                        <span className="text-[10px] font-black text-primary animate-pulse uppercase tracking-widest mt-[-6px] drop-shadow-md">Live '{activeItem.data.minute}</span>
                      )}
                      {activeItem.data.status === 'finished' && (
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-[-6px] drop-shadow-md">FT</span>
                      )}
                      {activeItem.data.status === 'upcoming' && (
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-[-6px] drop-shadow-md">Starting</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col animate-in zoom-in-95 duration-500 text-right overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-2 border-b border-white/10">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-2",
                        activeItem.data.status === 'live' ? "bg-red-600 text-white animate-pulse" : "bg-white/10 text-white/60"
                      )}>
                        <Timer className="w-3.5 h-3.5" />
                        <span>{activeItem.data.status === 'live' ? `${activeItem.data.minute}'` : activeItem.data.status === 'finished' ? 'انتهت' : activeItem.data.startTime}</span>
                      </div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter truncate max-w-[180px] dir-rtl">{activeItem.data.league}</span>
                    </div>

                    <div className="flex items-center justify-between flex-1 px-8 gap-4">
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="h-16 w-16 rounded-2xl p-2 bg-white/5 border border-white/10 flex items-center justify-center relative shadow-xl">
                          <img src={activeItem.data.homeLogo} alt="" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-[9px] font-black text-white text-center line-clamp-1 w-full uppercase">{activeItem.data.homeTeam}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center min-w-[100px]">
                        <div className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl" dir="ltr">
                          {activeItem.data.status === 'upcoming' ? 'VS' : `${activeItem.data.score.away}-${activeItem.data.score.home}`}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="h-16 w-16 rounded-2xl p-2 bg-white/5 border border-white/10 flex items-center justify-center relative shadow-xl">
                          <img src={activeItem.data.awayLogo} alt="" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-[9px] font-black text-white text-center line-clamp-1 w-full uppercase">{activeItem.data.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-between gap-6 whitespace-nowrap px-6">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-2xl"><BookOpen className="w-6 h-6 text-black" /></div>
                  <div className="flex flex-col text-right flex-1">
                    <span className="text-xl font-black text-white tracking-tight leading-tight">{activeItem.data.label}</span>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">تذكير نشط</span>
                  </div>
                  <ChevronUp className="w-5 h-5 text-white/20 animate-bounce" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="liquid-glass backdrop-blur-[100px] rounded-full h-12 px-10 flex items-center gap-4 border border-white/10 min-w-[300px] justify-center pointer-events-auto">
          <span className="text-sm font-black text-white/80 tracking-widest">{dhikr}</span>
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        </div>
      )}

      {islandQueue.length > 1 && (
        <div className="flex items-center gap-2">
          {islandQueue.map((item, idx) => {
            if (idx === activeIndex) return null;
            return (
              <div key={item.id} onClick={() => setActiveIndex(idx)} className="pointer-events-auto w-14 h-14 rounded-full liquid-glass backdrop-blur-[80px] border border-white/20 flex items-center justify-center shadow-2xl cursor-pointer overflow-hidden transition-all hover:scale-110 active:scale-90 p-0">
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  {item.type === 'match' ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center opacity-90 gap-0.5 scale-[1.6]">
                        <img src={item.data.homeLogo} className="w-6 h-6 object-contain" alt="" />
                        <img src={item.data.awayLogo} className="w-6 h-6 object-contain" alt="" />
                      </div>
                      <div className="absolute inset-0 bg-black/5" />
                      <span className="relative z-10 text-[16px] font-black text-white leading-none drop-shadow-lg" dir="ltr">
                        {item.data.status === 'upcoming' 
                          ? formatHH12(item.data.startTime) 
                          : `${item.data.score.away}-${item.data.score.home}`}
                      </span>
                    </>
                  ) : (
                    <BookOpen className="w-6 h-6 text-accent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
