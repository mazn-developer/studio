"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Timer, Clock, Calendar, Star, Trophy, Activity, Tv, Mic2, RefreshCw, Bell, BellRing, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiMatchSummary } from "./ai-match-summary";
import { useMediaStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchFootballData } from "@/lib/football-api";
import { cn } from "@/lib/utils";
import { convertTo12Hour } from "@/lib/constants";

const MAJOR_CLUBS_IDS = [541, 529, 40, 50, 33, 42, 157, 505, 489, 496, 85, 2931, 2939, 2930, 1029, 1038];
const MAJOR_LEAGUES_IDS = [2, 3, 39, 140, 135, 165, 61, 307, 233];

export function FootballView() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [filterType, setFilterType] = useState<"all" | "major" | "arab" | "euro">("all");
  
  const { favoriteTeams, toggleFavoriteTeam, favoriteLeagueIds, belledMatchIds, toggleBelledMatch } = useMediaStore();

  const isFavTeam = (id: number) => favoriteTeams.some(t => t.id === id);
  const isBelled = (id: string) => belledMatchIds.includes(id);

  const loadMatches = async (view: string) => {
    setLoading(true);
    try {
      const result = await fetchFootballData(view === 'live' ? 'live' : view === 'yesterday' ? 'yesterday' : view === 'tomorrow' ? 'tomorrow' : 'today');
      setMatches(result);
      setError(null);
    } catch (err: any) {
      setError("فشل الاتصال بمزود البيانات. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches(activeTab);
    const interval = setInterval(() => {
      if (activeTab !== "favorites") {
        loadMatches(activeTab);
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [activeTab]);

  const filteredAndSortedMatches = useMemo(() => {
    if (!matches.length) return [];
    
    let result = [...matches];

    // Status Filters
    if (activeTab === "live") {
      result = result.filter(m => m.status === 'live');
    } else if (activeTab === "favorites") {
      result = result.filter(m => isFavTeam(m.homeTeamId) || isFavTeam(m.awayTeamId) || favoriteLeagueIds.includes(m.leagueId));
    }

    // Type Filters
    if (filterType === "major") {
      result = result.filter(m => MAJOR_LEAGUES_IDS.includes(m.leagueId) || MAJOR_CLUBS_IDS.includes(m.homeTeamId) || MAJOR_CLUBS_IDS.includes(m.awayTeamId));
    } else if (filterType === "arab") {
      result = result.filter(m => [307, 233, 301, 305, 312, 292].includes(m.leagueId));
    } else if (filterType === "euro") {
      result = result.filter(m => [2, 3, 39, 140, 135, 165, 61].includes(m.leagueId));
    }

    // Grouping & Sorting
    return result.sort((a, b) => {
      const aIsBelled = isBelled(a.id);
      const bIsBelled = isBelled(b.id);
      if (aIsBelled && !bIsBelled) return -1;
      if (!aIsBelled && bIsBelled) return 1;

      const aIsMajor = MAJOR_CLUBS_IDS.includes(a.homeTeamId) || MAJOR_CLUBS_IDS.includes(a.awayTeamId);
      const bIsMajor = MAJOR_CLUBS_IDS.includes(b.homeTeamId) || MAJOR_CLUBS_IDS.includes(b.awayTeamId);
      
      const aInMajorLeague = MAJOR_LEAGUES_IDS.includes(a.leagueId);
      const bInMajorLeague = MAJOR_LEAGUES_IDS.includes(b.leagueId);

      if ((aIsMajor || aInMajorLeague) && !(bIsMajor || bInMajorLeague)) return -1;
      if (!(aIsMajor || aInMajorLeague) && (bIsMajor || bInMajorLeague)) return 1;

      return a.leagueId - b.leagueId;
    });
  }, [matches, activeTab, filterType, favoriteTeams, favoriteLeagueIds, belledMatchIds]);

  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredAndSortedMatches.forEach(m => {
      const key = m.league;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [filteredAndSortedMatches]);

  const renderMatchCard = (match: any) => {
    const isFavMatch = isFavTeam(match.homeTeamId) || isFavTeam(match.awayTeamId);
    const isBelledMatch = isBelled(match.id);
    const isLive = match.status === 'live';
    const isMajorGame = MAJOR_CLUBS_IDS.includes(match.homeTeamId) && MAJOR_CLUBS_IDS.includes(match.awayTeamId);

    return (
      <Card 
        key={match.id} 
        className={cn(
          "relative overflow-hidden transition-all duration-500 border-white/5 group focusable premium-glass",
          isBelledMatch ? "ring-2 ring-accent bg-accent/5" : isFavMatch || isMajorGame ? "ring-2 ring-primary bg-primary/10" : "bg-card/40"
        )}
        tabIndex={0}
      >
        <div className="absolute top-0 left-0 p-2 z-20 flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleBelledMatch(match.id); }}
            className={cn(
              "w-10 h-10 rounded-full border border-white/10 backdrop-blur-3xl flex items-center justify-center transition-all active:scale-90",
              isBelledMatch ? "bg-accent text-black shadow-glow" : "bg-black/60 text-white/20 hover:text-white"
            )}
          >
            {isBelledMatch ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
          </button>
        </div>

        <CardContent className="p-5 mt-2">
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                {isLive ? (
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                    {match.minute}'
                  </div>
                ) : (
                  <div className="bg-white/5 text-white/60 px-3 py-1 rounded-full text-[10px] font-black border border-white/5">
                    {convertTo12Hour(match.startTime)}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase text-white/70 dir-rtl">
                {match.status === 'finished' ? 'انتهت' : isLive ? 'مباشر' : 'مجدولة'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col items-center flex-1 gap-2 relative">
                <div className={cn("h-16 w-16 rounded-2xl p-2.5 flex items-center justify-center border transition-all", isFavTeam(match.homeTeamId) ? "bg-primary/20 border-primary" : "bg-white/5 border-white/5")}>
                  <img src={match.homeLogo} alt="" className="h-full w-full object-contain" />
                </div>
                <span className={cn("text-[10px] font-black text-center line-clamp-2 min-h-[24px] uppercase tracking-tighter", isFavTeam(match.homeTeamId) ? "text-primary" : "text-white")}>
                  {match.homeTeam}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center min-w-[80px]">
                <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                  {/* RTL FIX: Flip score display to match logo positions */}
                  {match.status === "upcoming" ? convertTo12Hour(match.startTime) : `${match.score.away}-${match.score.home}`}
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 gap-2 relative">
                <div className={cn("h-16 w-16 rounded-2xl p-2.5 flex items-center justify-center border transition-all", isFavTeam(match.awayTeamId) ? "bg-primary/20 border-primary" : "bg-white/5 border-white/5")}>
                  <img src={match.awayLogo} alt="" className="h-full w-full object-contain" />
                </div>
                <span className={cn("text-[10px] font-black text-center line-clamp-2 min-h-[24px] uppercase tracking-tighter", isFavTeam(match.awayTeamId) ? "text-primary" : "text-white")}>
                  {match.awayTeam}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 py-3 border-t border-white/5 mt-2 dir-rtl">
              <div className="flex items-center gap-1.5">
                <Tv className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black text-white/90 truncate">{match.channel}</span>
              </div>
              <div className="flex items-center gap-1.5 border-r border-white/5 pr-2">
                <Mic2 className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-black text-white/90 truncate">{match.commentator}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8 space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-headline font-bold text-white tracking-tighter flex items-center gap-3">
            مركز كووورة <Trophy className="w-8 h-8 text-accent animate-bounce" />
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Global Football Hub</p>
        </div>
        <Button variant="outline" onClick={() => loadMatches(activeTab)} disabled={loading} className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all focusable">
          <RefreshCw className={cn("w-4 h-4 ml-2", loading && "animate-spin")} /> تحديث
        </Button>
      </header>

      <div className="flex flex-col gap-6">
        <Tabs defaultValue="today" onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] h-16 w-full max-w-xl shadow-2xl backdrop-blur-3xl">
              <TabsTrigger value="yesterday" className="flex-1 rounded-[1.5rem] font-black text-xs">أمس</TabsTrigger>
              <TabsTrigger value="today" className="flex-1 rounded-[1.5rem] font-black text-xs">اليوم</TabsTrigger>
              <TabsTrigger value="tomorrow" className="flex-1 rounded-[1.5rem] font-black text-xs">غداً</TabsTrigger>
              <TabsTrigger value="live" className="flex-1 rounded-[1.5rem] font-black text-xs data-[state=active]:bg-red-600 flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" /> المباشرة
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1 rounded-[1.5rem] font-black text-xs data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center justify-center gap-2">
                <Star className="h-4 w-4" /> المفضلة
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 h-16 shadow-2xl">
              <Button variant="ghost" onClick={() => setFilterType("all")} className={cn("rounded-full px-6 h-full font-black text-xs", filterType === "all" ? "bg-white/10 text-white" : "text-white/40")}>الكل</Button>
              <Button variant="ghost" onClick={() => setFilterType("major")} className={cn("rounded-full px-6 h-full font-black text-xs flex items-center gap-2", filterType === "major" ? "bg-primary text-white" : "text-white/40")}><Shield className="w-4 h-4" /> القمة</Button>
              <Button variant="ghost" onClick={() => setFilterType("arab")} className={cn("rounded-full px-6 h-full font-black text-xs flex items-center gap-2", filterType === "arab" ? "bg-emerald-600 text-white" : "text-white/40")}><Globe className="w-4 h-4" /> العرب</Button>
              <Button variant="ghost" onClick={() => setFilterType("euro")} className={cn("rounded-full px-6 h-full font-black text-xs flex items-center gap-2", filterType === "euro" ? "bg-blue-600 text-white" : "text-white/40")}><Globe className="w-4 h-4" /> أوروبا</Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-black animate-pulse uppercase tracking-[0.3em]">جاري جلب البيانات...</p>
              </div>
            ) : Object.keys(groupedMatches).length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center gap-6 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <Calendar className="h-20 w-20 text-white/5" />
                <h3 className="text-2xl font-black text-white/40 uppercase tracking-widest">لا توجد مباريات مطابقة</h3>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedMatches).map(([leagueName, leagueMatches]) => (
                  <div key={leagueName} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                      <div className="h-8 w-1 bg-primary rounded-full shadow-glow" />
                      <h2 className="text-xl font-black text-white/90 uppercase tracking-tight dir-rtl">{leagueName}</h2>
                      <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-black">{leagueMatches.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {leagueMatches.map((m) => renderMatchCard(m))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}