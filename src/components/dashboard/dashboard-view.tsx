
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { MoonWidget } from "./widgets/moon-widget";
import { DateAndClockWidget } from "./widgets/date-and-clock-widget";
import { WeatherWidget } from "./widgets/weather-widget";
import { PlayingNowWidget } from "./widgets/playing-now-widget";
import { PrayerTimelineWidget } from "./widgets/prayer-timeline-widget";
import { MapWidget } from "./widgets/map-widget";
import { ReminderSummaryWidget } from "./widgets/reminder-summary-widget";
import { ActiveAzkarWidget } from "./widgets/active-azkar-widget";
import { useMediaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { X } from "lucide-react";

const LatestVideosWidget = dynamic(() => import("./widgets/latest-videos-widget").then(m => m.LatestVideosWidget), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-zinc-900/20 animate-pulse rounded-[2.5rem]" />
});

const YouTubeSavedWidget = dynamic(() => import("./widgets/youtube-saved-widget").then(m => m.YouTubeSavedWidget), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-zinc-900/20 animate-pulse rounded-[2.5rem]" />
});

const YouTubeSuggestionsWidget = dynamic(() => import("./widgets/youtube-suggestions-widget").then(m => m.YouTubeSuggestionsWidget), { 
  ssr: false
});

export function DashboardView() {
  const { favoriteChannels, activeVideo, wallPlateType, wallPlateData, setWallPlate } = useMediaStore();
  
  const starredChannels = Array.isArray(favoriteChannels) 
    ? favoriteChannels.filter(c => c?.starred) 
    : [];

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, activeVideo]);

  // Wide Screen threshold updated to 968px as requested
  const isWideScreen = windowWidth > 968;

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 relative overflow-y-auto pb-32 no-scrollbar">
      <div className="h-24 shrink-0 w-full" />

      {/* Wall Plate Overlay */}
      {wallPlateType && (
        <div 
          className="fixed inset-0 z-[20000] bg-black flex items-center justify-center animate-in fade-in duration-700 cursor-pointer"
          onClick={() => setWallPlate(null)}
        >
          <button className="absolute top-10 right-10 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white focusable z-50">
            <X className="w-8 h-8" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center p-10">
            {wallPlateType === 'moon' && (
              <div className="relative w-[85vh] h-[85vh] animate-in zoom-in-95 duration-1000">
                <Image src={wallPlateData.image} alt="Moon" fill className="object-contain drop-shadow-[0_0_120px_rgba(59,130,246,0.6)]" unoptimized />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                   <span className="text-[18rem] font-black text-white/95 drop-shadow-2xl">{wallPlateData.day}</span>
                   <span className="text-5xl font-bold text-blue-400/90 uppercase tracking-[0.6em]">{wallPlateData.label}</span>
                </div>
              </div>
            )}
            {wallPlateType === 'manuscript' && (
              <div className="w-full max-w-7xl animate-in zoom-in-95 duration-1000 flex items-center justify-center">
                {wallPlateData.type === 'text' ? (
                  <p className="text-[14rem] md:text-[22rem] font-calligraphy text-white leading-tight drop-shadow-[0_0_100px_rgba(255,255,255,0.9)] text-center px-10">
                    {wallPlateData.content}
                  </p>
                ) : (
                  <img src={wallPlateData.content} alt="Manuscript" className="max-h-[90vh] w-auto object-contain brightness-0 invert drop-shadow-[0_0_120px_rgba(255,255,255,1)]" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[50] opacity-80 pointer-events-none">
        <Image 
          src="https://dmusera.netlify.app/Lexus-Logo.wine.svg" 
          alt="Lexus" 
          width={140} 
          height={30} 
          className="invert brightness-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[380px]">
        <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative shadow-2xl h-full focusable" tabIndex={0} data-nav-id="left-widget-container">
          {isWideScreen ? <ActiveAzkarWidget /> : <MapWidget />}
        </div>

        <div className="md:col-span-4 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden h-full shadow-2xl focusable" tabIndex={0} data-nav-id="car-visualizer-container">
          {isWideScreen ? (
            <ReminderSummaryWidget />
          ) : (
            <>
              <div className="absolute inset-0 w-full h-full">
                <Image 
                  src="https://dmusera.netlify.app/es350gb.png" 
                  alt="Lexus ES" 
                  fill
                  priority
                  className="object-cover drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </>
          )}
        </div>

        <div className="md:col-span-4 flex flex-col gap-6 h-full relative">
          <div className="flex-[1.8] relative overflow-hidden focusable group bg-black/20 rounded-[2.5rem] shadow-2xl" tabIndex={0} data-nav-id="moon-widget-container">
            <Carousel setApi={setApi} opts={{ loop: true }} className="w-full h-full">
              <CarouselContent className="h-full ml-0 overflow-hidden no-scrollbar">
                <CarouselItem className="pl-0 h-full flex items-center justify-center">
                  <MoonWidget />
                </CarouselItem>
                <CarouselItem className="pl-0 h-full flex items-center justify-center">
                  <WeatherWidget />
                </CarouselItem>
                {activeVideo && (
                  <CarouselItem className="pl-0 h-full flex items-center justify-center">
                    <PlayingNowWidget />
                  </CarouselItem>
                )}
              </CarouselContent>
            </Carousel>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {Array.from({ length: count }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    current === i 
                      ? "bg-primary w-6 shadow-[0_0_10px_#0088ff]" 
                      : "bg-white/20 w-1.5"
                  )} 
                />
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-[2.5rem] relative overflow-hidden shadow-2xl focusable max-h-[160px]" tabIndex={0} data-nav-id="clock-widget-container">
            <DateAndClockWidget />
          </div>
        </div>
      </div>

      <div className="w-full p-0 shadow-xl focusable" tabIndex={0} data-nav-id="prayer-timeline-section">
        <PrayerTimelineWidget />
      </div>

      <div className="w-full space-y-8 pb-12">
        <LatestVideosWidget channels={starredChannels} />
        <YouTubeSuggestionsWidget />
        <YouTubeSavedWidget />
      </div>
    </div>
  );
}
