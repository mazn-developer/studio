
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Match } from "@/lib/football-data";
import { fetchFootballData } from "@/lib/football-api";
import { useMediaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Clock, BellRing } from "lucide-react";
import { FluidGlass } from "@/components/ui/fluid-glass";

export function LiveMatchIsland() {
  const { favoriteTeams, favoriteLeagueIds, prayerTimes, belledMatchIds } = useMediaStore();
  const [topMatches, setTopMatches] = useState<Match[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDetailed, setIsDetailed] = useState(false);
  
  const [prayerAlert, setPrayerNotification] = useState<{ 
    type: 'azan' | 'iqamah' | 'countdown' | 'countup', 
    name: string,
    timeLabel: string,
    isCountingDown: boolean
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const matches = await fetchFootballData('today');
      if (!matches || matches.length === 0) {
        setTopMatches([]);
        return;
      }

      // Priority logic: Live > Belled > Favorite Team > Favorite League
      const prioritized = [...matches]
        .sort((a, b) => {
          // 1. Live Matches first
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (a.status !== 'live' && b.status === 'live') return 1;

          // 2. Belled Matches
          const aBelled = belledMatchIds.includes(a.id);
          const bBelled = belledMatchIds.includes(b.id);
          if (aBelled && !bBelled) return -1;
          if (!aBelled && bBelled) return 1;

          // 3. Favorite Team Matches
          const aIsFavTeam = favoriteTeams.some(t => t.id === a.homeTeamId || t.id === a.awayTeamId);
          const bIsFavTeam = favoriteTeams.some(t => t.id === b.homeTeamId || t.id === b.awayTeamId);
          if (aIsFavTeam && !bIsFavTeam) return -1;
          if (!aIsFavTeam && bIsFavTeam) return 1;

          // 4. Favorite League Matches
          const aIsFavLeague = favoriteLeagueIds.includes(a.leagueId || 0);
          const bIsFavLeague = favoriteLeagueIds.includes(b.leagueId || 0);
          if (aIsFavLeague && !bIsFavLeague) return -1;
          if (!aIsFavLeague && bIsFavLeague) return 1;

          return 0;
        })
        .slice(0, 3);
      
      setTopMatches(prioritized);
    } catch (error) {
      console.error("Island Sync Error:", error);
    }
  }, [belledMatchIds, favoriteTeams, favoriteLeagueIds]);

  useEffect(() => {
    const checkPrayers = () => {
      if (!prayerTimes || prayerTimes.length === 0) return;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      const day = now.getDate().toString().padStart(2, '0');
      const dateStr = `2026-02-${day}`;
      const pData = prayerTimes.find(p => p.date === dateStr) || prayerTimes[0];
      
      const list = [
        { name: "الفجر", time: pData.fajr, iqamah: 25 },
        { name: "الظهر", time: pData.dhuhr, iqamah: 20 },
        { name: "العصر", time: pData.asr, iqamah: 20 },
        { name: "المغرب", time: pData.maghrib, iqamah: 10 },
        { name: "العشاء", time: pData.isha, iqamah: 20 },
      ];

      const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      let activeAlert = null;

      for (let p of list) {
        const azanMins = timeToMinutes(p.time);
        const iqamahMins = azanMins + p.iqamah;

        if (currentMinutes >= azanMins - 3 && currentMinutes < azanMins) {
          const diffSecs = (azanMins * 60) - (currentMinutes * 60 + currentSeconds);
          const m = Math.floor(diffSecs / 60);
          const s = diffSecs % 60;
          activeAlert = { type: 'countdown', name: p.name, timeLabel: `باقي للأذان ${m}:${s.toString().padStart(2,'0')}`, isCountingDown: true };
          break;
        }
        if (currentMinutes >= azanMins && currentMinutes < azanMins + 3) {
          const diffSecs = (currentMinutes * 60 + currentSeconds) - (azanMins * 60);
          const m = Math.floor(diffSecs / 60);
          const s = diffSecs % 60;
          activeAlert = { type: 'azan', name: p.name, timeLabel: `حان وقت الأذان (+${m}:${s.toString().padStart(2,'0')})`, isCountingDown: false };
          break;
        }
        if (currentMinutes >= iqamahMins - 5 && currentMinutes < iqamahMins) {
          const diffSecs = (iqamahMins * 60) - (currentMinutes * 60 + currentSeconds);
          const m = Math.floor(diffSecs / 60);
          const s = diffSecs % 60;
          activeAlert = { type: 'countdown', name: p.name, timeLabel: `باقي للإقامة ${m}:${s.toString().padStart(2,'0')}`, isCountingDown: true };
          break;
        }
        if (currentMinutes >= iqamahMins && currentMinutes < iqamahMins + 10) {
          const diffSecs = (currentMinutes * 60 + currentSeconds) - (iqamahMins * 60);
          const m = Math.floor(diffSecs / 60);
          const s = diffSecs % 60;
          activeAlert = { type: 'iqamah', name: p.name, timeLabel: `الصلاة قائمة منذ ${m}:${s.toString().padStart(2,'0')}`, isCountingDown: false };
          break;
        }
      }

      setPrayerNotification(activeAlert);
    };
    
    const interval = setInterval(checkPrayers, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); 
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (topMatches.length === 0 && !prayerAlert) return null;

  const handleIslandClick = (index: number) => {
    if (index === activeIndex) {
      setIsDetailed(!isDetailed);
    } else {
      setActiveIndex(index);
      setIsDetailed(false);
    }
  };

  if (prayerAlert) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] pointer-events-auto">
        <div className={cn(
          "liquid-glass rounded-full shadow-[0_40px_100px_rgba(0,0,0,1)] border-2 transition-all duration-700 w-[500px] h-24 flex items-center justify-between px-10 relative overflow-hidden",
          prayerAlert.isCountingDown ? "border-primary ring-8 ring-primary/10" : "border-accent ring-8 ring-accent/10"
        )}>
          <FluidGlass scale={2} />
          <div className="flex items-center gap-6 relative z-10">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-2xl animate-bounce", prayerAlert.isCountingDown ? "bg-primary" : "bg-accent")}>
              <BellRing className="w-8 h-8 text-black fill-current" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-xl">
                {prayerAlert.name}
              </span>
              <span className={cn("text-sm font-black uppercase tracking-widest", prayerAlert.isCountingDown ? "text-primary" : "text-accent")}>
                {prayerAlert.timeLabel}
              </span>
            </div>
          </div>
          <span className="text-2xl animate-spin-slow relative z-10">✨</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 pointer-events-none">
      {topMatches.map((match, idx) => {
        const isActive = idx === activeIndex;
        const isLive = match.status === 'live';

        if (isActive) {
          return (
            <div key={match.id} className="pointer-events-auto">
              <div 
                onClick={() => handleIslandClick(idx)}
                className={cn(
                  "liquid-glass rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer overflow-hidden focusable outline-none relative",
                  isDetailed ? "w-[600px] h-52 px-12" : "w-80 h-16 px-6"
                )}
              >
                <FluidGlass scale={isDetailed ? 3 : 1.5} />
                <div className="h-full flex items-center justify-between relative z-10">
                  {!isDetailed ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <img src={match.homeLogo} alt="" className="w-9 h-9 object-contain drop-shadow-2xl" />
                        <div className={cn("px-4 py-1.5 rounded-2xl border backdrop-blur-md min-w-[100px] flex justify-center items-center", isLive ? "bg-red-600/20 border-red-500/40" : "bg-primary/20 border-primary/40")}>
                          <span className="font-black tabular-nums tracking-tighter text-xl text-white">
                            {isLive ? `${match.score?.home} - ${match.score?.away}` : match.startTime}
                          </span>
                        </div>
                        <img src={match.awayLogo} alt="" className="w-9 h-9 object-contain drop-shadow-2xl" />
                      </div>
                      <div className="flex items-center gap-3">
                        {isLive ? <span className="text-base font-black text-accent animate-pulse">{match.minute}'</span> : <Clock className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full animate-in zoom-in-95 duration-700">
                      <div className="flex flex-col items-center gap-3 w-32">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 p-3 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                          <img src={match.homeLogo} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[12px] font-black text-white truncate w-full text-center">{match.homeTeam}</span>
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <div className={cn("flex items-center gap-2 px-5 py-2 rounded-full border shadow-lg backdrop-blur-3xl", isLive ? "bg-red-600/30 border-red-500" : "bg-primary/30 border-primary")}>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isLive ? "LIVE" : "UPCOMING"}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className="text-8xl font-black text-white tabular-nums drop-shadow-2xl">{isLive ? match.score?.home : match.startTime.split(':')[0]}</span>
                          <span className="text-4xl font-black text-primary animate-pulse tracking-tighter">:</span>
                          <span className="text-8xl font-black text-white tabular-nums drop-shadow-2xl">{isLive ? match.score?.away : match.startTime.split(':')[1]}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-3 w-32">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 p-3 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                          <img src={match.awayLogo} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[12px] font-black text-white truncate w-full text-center">{match.awayTeam}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div key={match.id} onClick={() => handleIslandClick(idx)} className="pointer-events-auto w-16 h-16 rounded-full liquid-glass border border-white/20 flex flex-col items-center justify-center p-0 shadow-2xl cursor-pointer relative overflow-hidden">
               <FluidGlass scale={0.5} />
               <div className="flex flex-col items-center gap-0 relative z-10 w-full h-full justify-center scale-90">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src={match.homeLogo} alt="" className="w-5 h-5 object-contain" />
                    <img src={match.awayLogo} alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-white mt-0.5">{isLive ? `${match.score?.home}-${match.score?.away}` : match.startTime}</span>
               </div>
            </div>
          );
        }
      })}
    </div>
  );
}
