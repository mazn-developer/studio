
"use client";

import { useMediaStore } from "@/lib/store";
import { X, Minimize2, Bookmark, Monitor, ChevronDown, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export function GlobalVideoPlayer() {
  const { 
    activeVideo, 
    isPlaying, 
    isMinimized, 
    isFullScreen,
    videoProgress,
    setActiveVideo, 
    setIsPlaying, 
    setIsMinimized, 
    setIsFullScreen,
    toggleSaveVideo,
    savedVideos,
  } = useMediaStore();
  
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    if (!activeVideo || !mounted) return;
    const startSeconds = videoProgress[activeVideo.id] || 0;

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
      }
      playerRef.current = new (window as any).YT.Player('youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: activeVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(startSeconds),
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 1) setIsPlaying(true);
            else if (event.data === 2) setIsPlaying(false);
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }
  }, [activeVideo?.id, mounted]);

  if (!mounted || !activeVideo) return null;

  const isSaved = savedVideos.some(v => v.id === activeVideo.id);

  return (
    <div 
      className={cn(
        "fixed z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl",
        isMinimized 
          ? "bottom-12 left-1/2 -translate-x-1/2 w-[500px] h-28 rounded-[2.5rem] liquid-glass cursor-pointer" 
          : isFullScreen
            ? "inset-0 w-full h-full bg-black"
            : "bottom-8 right-4 w-[50vw] h-[55vh] glass-panel rounded-[3.5rem] bg-black/95 left-auto translate-x-0"
      )}
      style={{ position: 'fixed' }}
      onClick={() => isMinimized && setIsFullScreen(true)}
    >
      <div className={cn(
        "absolute inset-0 transition-all duration-700 overflow-hidden rounded-[inherit]",
        isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <div id="youtube-player-element" className="w-full h-full"></div>
      </div>

      {isMinimized && (
        <div className="h-full w-full flex items-center justify-between px-8 relative z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
              <Image src={activeVideo.thumbnail} alt="" fill className="object-cover" />
            </div>
            <div className="flex flex-col min-w-0 text-right">
              <h4 className="text-base font-black text-white truncate">{activeVideo.title}</h4>
              <span className="text-[9px] text-accent font-black uppercase tracking-widest">{activeVideo.channelTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10 focusable">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setActiveVideo(null); }} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg focusable">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!isMinimized && (
        <div className={cn(
          "fixed bottom-12 z-[5200] flex items-center gap-4",
          isFullScreen ? "left-1/2 -translate-x-1/2" : "right-12"
        )}>
          <div className="flex items-center gap-3 liquid-glass p-4 rounded-full border-2 border-white/20 shadow-2xl">
            <button onClick={() => setIsMinimized(true)} className="w-14 h-14 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center focusable"><ChevronDown className="w-6 h-6" /></button>
            <button onClick={() => setIsFullScreen(!isFullScreen)} className={cn("w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center focusable", isFullScreen ? "bg-primary border-primary" : "bg-white/10 border-white/10")}><Monitor className="w-6 h-6" /></button>
            <button onClick={() => toggleSaveVideo(activeVideo)} className={cn("w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center focusable", isSaved ? "bg-accent border-accent" : "bg-white/10 border-white/10")}><Bookmark className={cn("w-6 h-6", isSaved && "fill-current")} /></button>
            <div className="w-px h-10 bg-white/20 mx-1" />
            <button onClick={() => setActiveVideo(null)} className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center focusable shadow-2xl"><X className="w-7 h-7" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
