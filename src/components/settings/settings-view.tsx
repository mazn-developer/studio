
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMediaStore, Reminder, FavoriteTeam } from "@/lib/store";
import { 
  Settings, 
  Youtube, 
  Bell, 
  Trophy, 
  Info, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Save, 
  Maximize, 
  ImageIcon, 
  Search, 
  Check, 
  Star,
  Palette,
  Loader2,
  Globe
} from "lucide-react";
import { YT_KEYS_POOL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { TEAM_LIST, MAJOR_LEAGUES } from "@/lib/football-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { searchFootballTeams } from "@/lib/football-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
  "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0"
];

export function SettingsView() {
  const { 
    reminders, 
    addReminder, 
    removeReminder, 
    favoriteTeams, 
    toggleFavoriteTeam,
    mapSettings, 
    updateMapSettings 
  } = useMediaStore();
  const { toast } = useToast();
  
  const [newReminder, setNewReminder] = useState({ label: "", startHour: 6, endHour: 22 });
  const [clubSearch, setClubSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const isFavTeam = (id: number) => favoriteTeams.some(t => t.id === id);

  const handleGlobalSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await searchFootballTeams(clubSearch, leagueFilter);
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: "Could not find any clubs matching your request." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Search Error", description: "Failed to connect to global database." });
    } finally {
      setIsSearching(false);
    }
  }, [clubSearch, leagueFilter, toast]);

  useEffect(() => {
    if (leagueFilter !== 'all') {
      handleGlobalSearch();
    }
  }, [leagueFilter, handleGlobalSearch]);

  const handleAddReminder = () => {
    if (!newReminder.label.trim()) return;
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      label: newReminder.label,
      iconType: 'bell',
      completed: false,
      color: 'text-blue-400',
      startHour: newReminder.startHour,
      endHour: newReminder.endHour,
    };
    addReminder(reminder);
    setNewReminder({ label: "", startHour: 6, endHour: 22 });
    toast({ title: "تمت الإضافة", description: "تمت إضافة التذكير بنجاح." });
  };

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto pb-40 animate-in fade-in duration-700 text-right">
      <header className="flex flex-col gap-4">
        <h1 className="text-6xl font-black font-headline text-white tracking-tighter flex items-center justify-end gap-6">
          مركز التحكم <Settings className="w-12 h-12 text-primary animate-spin-slow" />
        </h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.6em] text-sm">System Configuration & Preferences</p>
      </header>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="bg-white/5 p-1 rounded-full border border-white/10 h-16 mb-12 flex justify-start w-fit overflow-x-auto no-scrollbar">
          <TabsTrigger value="appearance" className="rounded-full px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-lg focusable">
            <Palette className="w-5 h-5 mr-3" /> المظهر والزوم
          </TabsTrigger>
          <TabsTrigger value="youtube" className="rounded-full px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-lg focusable">
            <Youtube className="w-5 h-5 mr-3" /> YouTube
          </TabsTrigger>
          <TabsTrigger value="reminders" className="rounded-full px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-lg focusable">
            <Bell className="w-5 h-5 mr-3" /> التذكيرات
          </TabsTrigger>
          <TabsTrigger value="football" className="rounded-full px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-lg focusable">
            <Trophy className="w-5 h-5 mr-3" /> الرياضة
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-full px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-lg focusable">
            <Info className="w-5 h-5 mr-3" /> النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-zinc-900/50 border-white/10 rounded-[3rem] p-10 space-y-8">
              <CardTitle className="text-2xl font-black text-white flex items-center gap-4">
                <Maximize className="w-8 h-8 text-primary" /> زوم المتصفح والمنظور
              </CardTitle>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">مستوى زوم الخريطة</label>
                    <span className="text-primary font-black text-lg bg-primary/10 px-4 py-1 rounded-lg border border-primary/20">{mapSettings.zoom.toFixed(1)}</span>
                  </div>
                  <Slider value={[mapSettings.zoom]} min={15} max={21} step={0.1} onValueChange={([val]) => updateMapSettings({ zoom: val })} className="cursor-pointer focusable" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">إمالة الكاميرا</label>
                    <span className="text-primary font-black text-lg bg-primary/10 px-4 py-1 rounded-lg border border-primary/20">{mapSettings.tilt}°</span>
                  </div>
                  <Slider value={[mapSettings.tilt]} min={0} max={85} step={5} onValueChange={([val]) => updateMapSettings({ tilt: val })} className="cursor-pointer focusable" />
                </div>
              </div>
            </Card>
            <Card className="bg-zinc-900/50 border-white/10 rounded-[3rem] p-10">
              <CardTitle className="text-2xl font-black text-white mb-6">خلفية النظام</CardTitle>
              <div className="grid grid-cols-2 gap-4 h-64">
                {BACKGROUNDS.map((bg, idx) => (
                  <button key={idx} onClick={() => updateMapSettings({ backgroundIndex: idx })} className={cn("relative rounded-2xl overflow-hidden border-4 transition-all group focusable", mapSettings.backgroundIndex === idx ? "border-primary scale-105 shadow-glow" : "border-transparent opacity-40 hover:opacity-100")}>
                    <img src={`${bg}?auto=format&fit=crop&q=40&w=300`} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="football" className="space-y-12 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dir-rtl">
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-zinc-900/50 border-white/10 rounded-[2.5rem] p-8 text-right">
                <CardTitle className="text-xl font-black text-white flex items-center justify-end gap-3 mb-6">
                  <Globe className="w-6 h-6 text-primary" /> Global Club Scout
                </CardTitle>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select League</label>
                    <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focusable text-right">
                        <SelectValue placeholder="All Major Leagues" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                        <SelectItem value="all">All Major Leagues</SelectItem>
                        {MAJOR_LEAGUES.map(league => (
                          <SelectItem key={league.id} value={league.id.toString()}>{league.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Team Name</label>
                    <Input placeholder="Search teams..." className="bg-white/5 border-white/10 h-14 px-6 rounded-2xl focusable text-right" value={clubSearch} onChange={(e) => setClubSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()} />
                  </div>
                  <Button onClick={handleGlobalSearch} disabled={isSearching} className="w-full h-14 rounded-2xl bg-primary text-white font-black focusable">
                    {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6 ml-2" />} Scout Database
                  </Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-8 text-right">
              {/* RESULTS ABOVE FAVORITES */}
              {searchResults.length > 0 && (
                <Card className="bg-zinc-900/50 border-white/10 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-top-6 duration-700">
                  <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-black text-white">Scouting Results</CardTitle>
                    <Button variant="ghost" onClick={() => setSearchResults([])} className="text-white/20 hover:text-white rounded-full">إغلاق النتائج</Button>
                  </CardHeader>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {searchResults.map((item) => {
                      const team = { id: item.team.id, name: item.team.name, logo: item.team.logo };
                      const isFav = isFavTeam(team.id);
                      return (
                        <div key={team.id} className={cn("p-4 rounded-[1.5rem] border flex flex-col items-center gap-3 transition-all", isFav ? "bg-primary/15 border-primary shadow-glow" : "bg-white/5 border-white/10")}>
                           <img src={team.logo} className="w-14 h-14 object-contain" alt="" />
                           <span className="text-[10px] font-black text-center truncate w-full uppercase">{team.name}</span>
                           <Button onClick={() => toggleFavoriteTeam(team)} size="icon" className={cn("w-10 h-10 rounded-full", isFav ? "bg-yellow-500 text-black shadow-glow" : "bg-black/60 text-white/40 hover:text-white")}>
                             <Star className={cn("w-5 h-5", isFav && "fill-current")} />
                           </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="bg-zinc-900/50 border-white/10 rounded-[2.5rem] p-8 flex-1">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl font-black text-white flex items-center justify-end gap-3">
                     المفضلات الحالية <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  </CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {favoriteTeams.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/20 italic font-bold uppercase tracking-widest">لا توجد أندية مفضلة حالياً</div>
                  ) : favoriteTeams.map((team) => (
                    <div key={team.id} className="p-4 rounded-[1.5rem] bg-primary/10 border border-primary/30 flex flex-col items-center gap-3 group animate-in zoom-in-95">
                       <img src={team.logo} className="w-14 h-14 object-contain" alt="" />
                       <span className="text-[10px] font-black text-center truncate w-full text-primary uppercase">{team.name}</span>
                       <Button onClick={() => toggleFavoriteTeam(team)} size="icon" className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 className="w-5 h-5" />
                       </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="youtube" className="space-y-8 outline-none">
          <Card className="bg-zinc-900/50 border-white/10 rounded-[3rem] p-10">
            <CardTitle className="text-2xl font-black text-white mb-6">مفاتيح النظام</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {YT_KEYS_POOL.map((key, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                   <code className="text-[10px] text-white/40 truncate max-w-[200px]">{key}</code>
                   <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-accent" : "bg-white/10")} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-8 outline-none">
          <Card className="bg-zinc-900/50 border-white/10 rounded-[3rem] p-10 text-right">
            <h3 className="text-xl font-black text-white mb-6">إضافة تذكير جديد</h3>
            <div className="space-y-4 max-w-md ml-auto">
              <Input placeholder="مثلاً: أذكار الصباح" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 focusable text-right" value={newReminder.label} onChange={(e) => setNewReminder({ ...newReminder, label: e.target.value })} />
              <Button onClick={handleAddReminder} className="w-full h-14 bg-primary rounded-2xl font-black focusable">حفظ التذكير</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-8 outline-none">
          <Card className="bg-zinc-900/50 border-white/10 rounded-[3rem] p-10 flex flex-col items-center gap-6">
             <ShieldCheck className="w-12 h-12 text-accent" />
             <h3 className="text-xl font-black text-white">النظام مفعل وبحالة ممتازة</h3>
             <span className="text-xs text-white/40">v2.8.0 JSONBIN-SYNC-PRO</span>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
