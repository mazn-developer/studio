
"use client";

import { useState, useCallback } from "react";
import { useMediaStore, Reminder } from "@/lib/store";
import { 
  Settings, 
  Bell, 
  Trash2, 
  Edit2,
  Trophy,
  Search,
  Star,
  RefreshCw,
  Plus,
  Globe,
  Zap,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { searchFootballTeams } from "@/lib/football-api";
import { MAJOR_LEAGUES } from "@/lib/football-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
  "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0"
];

const PRAYERS = [
  { id: 'fajr', name: 'الفجر' },
  { id: 'sunrise', name: 'الشروق' },
  { id: 'dhuhr', name: 'الظهر' },
  { id: 'asr', name: 'العصر' },
  { id: 'maghrib', name: 'المغرب' },
  { id: 'isha', name: 'العشاء' },
  { id: 'manual', name: 'يدوي (وقت محدد)' },
];

export function SettingsView() {
  const { 
    reminders, 
    addReminder, 
    removeReminder, 
    updateReminder,
    favoriteTeams, 
    toggleFavoriteTeam,
    favoriteLeagueIds,
    toggleFavoriteLeague,
    mapSettings, 
    updateMapSettings 
  } = useMediaStore();
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Reminder>>({
    label: "",
    relativePrayer: "manual",
    manualTime: "08:00",
    offsetMinutes: 0,
    showCountdown: true,
    countdownWindow: 10,
    showCountup: true,
    countupWindow: 10,
    color: "text-blue-400",
    iconType: "bell"
  });

  const [clubSearch, setClubSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleGlobalSearch = useCallback(async () => {
    if (!clubSearch.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchFootballTeams(clubSearch);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [clubSearch]);

  const handleSubmitReminder = () => {
    if (!form.label?.trim()) return;
    const reminderData: Reminder = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      label: form.label!,
      relativePrayer: (form.relativePrayer as any) || 'manual',
      manualTime: form.manualTime,
      offsetMinutes: form.offsetMinutes || 0,
      showCountdown: form.showCountdown ?? true,
      countdownWindow: form.countdownWindow || 10,
      showCountup: form.showCountup ?? true,
      countupWindow: form.countupWindow || 10,
      completed: false,
      color: form.color || 'text-blue-400',
      iconType: 'bell',
    };
    if (editingId) {
      updateReminder(editingId, reminderData);
      setEditingId(null);
      toast({ title: "تم التعديل", description: "تم تحديث التذكير بنجاح." });
    } else {
      addReminder(reminderData);
      toast({ title: "تمت الإضافة", description: "تمت إضافة التذكير بنجاح." });
    }
    setForm({ label: "", relativePrayer: "manual", manualTime: "08:00", offsetMinutes: 0, showCountdown: true, countdownWindow: 10, showCountup: true, countupWindow: 10, color: "text-blue-400", iconType: "bell" });
  };

  const handleEdit = (r: Reminder) => {
    setEditingId(r.id);
    setForm(r);
  };

  return (
    <div className="p-12 space-y-12 max-w-7xl mx-auto pb-40 animate-in fade-in duration-700 text-right dir-rtl">
      <header className="flex flex-col gap-4">
        <h1 className="text-6xl font-black font-headline text-white tracking-tighter flex items-center gap-6">
          مركز التحكم <Settings className="w-12 h-12 text-primary animate-spin-slow" />
        </h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.6em] text-sm">System Configuration & Preferences</p>
      </header>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="bg-white/5 p-1 rounded-full border border-white/10 h-16 mb-12 flex justify-start w-fit">
          <TabsTrigger value="appearance" className="rounded-full px-10 h-full data-[state=active]:bg-primary font-bold text-lg focusable">المظهر</TabsTrigger>
          <TabsTrigger value="reminders" className="rounded-full px-10 h-full data-[state=active]:bg-primary font-bold text-lg focusable">التذكيرات</TabsTrigger>
          <TabsTrigger value="football" className="rounded-full px-10 h-full data-[state=active]:bg-primary font-bold text-lg focusable">الرياضة</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="premium-glass p-10 space-y-8">
            <CardTitle className="text-2xl font-black text-white">زوم الخريطة</CardTitle>
            <Slider value={[mapSettings.zoom]} min={15} max={21} step={0.1} onValueChange={([v]) => updateMapSettings({ zoom: v })} />
          </Card>
          <Card className="premium-glass p-10">
            <CardTitle className="text-2xl font-black text-white mb-6">الخلفية</CardTitle>
            <div className="grid grid-cols-2 gap-4 h-64">
              {BACKGROUNDS.map((bg, idx) => (
                <button key={idx} onClick={() => updateMapSettings({ backgroundIndex: idx })} className={cn("relative rounded-2xl overflow-hidden border-4 focusable", mapSettings.backgroundIndex === idx ? "border-primary" : "border-transparent opacity-40")}>
                  <img src={`${bg}?auto=format&fit=crop&q=40&w=300`} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="grid grid-cols-1 lg:grid-cols-12 gap-8 outline-none">
          <div className="lg:col-span-6 space-y-8">
            <Card className="premium-glass p-10 space-y-6">
              <CardTitle className="text-2xl font-black text-white">{editingId ? "تعديل التذكير" : "إضافة تذكير ذكي"}</CardTitle>
              <div className="space-y-6">
                <Input placeholder="اسم التذكير..." className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-right text-xl focusable" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                <div className="grid grid-cols-2 gap-6">
                  <Select value={form.relativePrayer} onValueChange={(v) => setForm({ ...form, relativePrayer: v as any })}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focusable"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {PRAYERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.relativePrayer === 'manual' ? (
                    <Input type="time" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-center text-xl focusable" value={form.manualTime} onChange={(e) => setForm({ ...form, manualTime: e.target.value })} />
                  ) : (
                    <Input type="number" placeholder="الإزاحة..." className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-center text-xl focusable" value={form.offsetMinutes} onChange={(e) => setForm({ ...form, offsetMinutes: parseInt(e.target.value) || 0 })} />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-8 py-4 border-y border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40">العد التنازلي (-)</label>
                    <Switch checked={form.showCountdown} onCheckedChange={(v) => setForm({...form, showCountdown: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40">العد التصاعدي (+)</label>
                    <Switch checked={form.showCountup} onCheckedChange={(v) => setForm({...form, showCountup: v})} />
                  </div>
                </div>
                <Button onClick={handleSubmitReminder} className="w-full h-16 bg-primary text-white font-black text-2xl rounded-2xl shadow-xl focusable">حفظ التذكير</Button>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-6 space-y-6 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
            {reminders.map((r) => {
              const baseColor = r.color || 'text-blue-400';
              return (
                <Card key={r.id} className="premium-glass p-6 group relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                      <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center border-2 transition-all", baseColor.replace('text-', 'bg-').split(' ')[0] + '/10', baseColor.replace('text-', 'border-').split(' ')[0] + '/20')}>
                        <Bell className={cn("w-8 h-8", baseColor)} />
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <h3 className="font-black text-2xl text-white">{r.label}</h3>
                        <span className="text-[10px] font-black text-white/40 uppercase">{r.relativePrayer === 'manual' ? r.manualTime : `${PRAYERS.find(p => p.id === r.relativePrayer)?.name} (${r.offsetMinutes >= 0 ? '+' : ''}${r.offsetMinutes})`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="w-14 h-14 rounded-full bg-white/5 focusable"><Edit2 className="w-6 h-6" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeReminder(r.id)} className="w-14 h-14 rounded-full bg-red-600/10 text-red-500 focusable"><Trash2 className="w-6 h-6" /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="football" className="outline-none space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              {/* League Tracking */}
              <Card className="premium-glass p-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                    <Globe className="w-6 h-6 text-accent" />
                    تتبع الدوريات الكبرى
                  </CardTitle>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Master League Tracking</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MAJOR_LEAGUES.map(league => {
                    const isFav = favoriteLeagueIds.includes(league.id);
                    return (
                      <Button
                        key={league.id}
                        variant="outline"
                        onClick={() => toggleFavoriteLeague(league.id)}
                        className={cn(
                          "h-14 rounded-2xl border transition-all font-black text-xs justify-between px-6 focusable",
                          isFav ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {league.name}
                        {isFav ? <Zap className="w-4 h-4 fill-current" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    );
                  })}
                </div>
              </Card>

              {/* Club Search */}
              <Card className="premium-glass p-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                    <Search className="w-6 h-6 text-primary" />
                    البحث عن أندية عالمية
                  </CardTitle>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Global Club Database</p>
                </div>
                <div className="relative flex gap-3">
                  <Input 
                    placeholder="مثال: الهلال، ريال مدريد، ليفربول..." 
                    value={clubSearch} 
                    onChange={(e) => setClubSearch(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()} 
                    className="h-16 bg-white/5 border-white/10 rounded-2xl px-8 text-right text-xl flex-1 focusable shadow-2xl" 
                  />
                  <Button onClick={handleGlobalSearch} disabled={isSearching} className="h-16 w-16 bg-primary rounded-2xl shadow-xl focusable">
                    {isSearching ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Plus className="w-8 h-8" />}
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {searchResults.map((team: any) => {
                    const isFav = favoriteTeams.some(t => t.id === team.team.id);
                    return (
                      <div 
                        key={team.team.id} 
                        onClick={() => toggleFavoriteTeam({ id: team.team.id, name: team.team.name, logo: team.team.logo })}
                        className={cn(
                          "p-4 rounded-[2rem] border transition-all cursor-pointer flex flex-col items-center gap-3 focusable",
                          isFav ? "bg-primary/20 border-primary shadow-glow" : "bg-white/5 border-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="relative w-16 h-16">
                          <img src={team.team.logo} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-black text-center line-clamp-1">{team.team.name}</span>
                        {isFav ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : <Plus className="w-4 h-4 text-white/40" />}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Favorite List */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="premium-glass p-8 space-y-6 h-full">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      قائمة التتبع
                    </CardTitle>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Watchlist</p>
                  </div>
                  <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-xs font-black">{favoriteTeams.length + favoriteLeagueIds.length} عنصر</span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                  {favoriteTeams.length === 0 && favoriteLeagueIds.length === 0 ? (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                      <Trophy className="w-16 h-16" />
                      <p className="text-xs font-black uppercase tracking-widest">قائمة التتبع فارغة</p>
                    </div>
                  ) : (
                    <>
                      {favoriteLeagueIds.map(lid => {
                        const l = MAJOR_LEAGUES.find(ml => ml.id === lid);
                        return (
                          <div key={`l-${lid}`} className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <Shield className="w-8 h-8 text-accent" />
                              <span className="text-sm font-black text-white/80">{l?.name || "دوري مخصص"}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => toggleFavoriteLeague(lid)} className="w-10 h-10 rounded-full bg-red-600/10 text-red-500 focusable"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        );
                      })}
                      {favoriteTeams.map(t => (
                        <div key={`t-${t.id}`} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10">
                              <img src={t.logo} alt="" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-black text-white/80">{t.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => toggleFavoriteTeam(t)} className="w-10 h-10 rounded-full bg-red-600/10 text-red-500 focusable"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
