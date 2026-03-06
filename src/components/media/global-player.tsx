
"use client";

import { useMediaStore } from "@/lib/store";
import { X, Minimize2, Bookmark, Monitor, ChevronDown, Play, Pause, Tv, List, SkipForward, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Hls from "hls.js";
import { useRouter } from "next/navigation";
import { fetchChannelDetails } from "@/lib/youtube";

export function GlobalVideoPlayer() {
  const router = useRouter();
  const { 
    activeVideo, 
    activeIptv,
    isPlaying, 
    isMinimized, 
    isFullScreen,
    videoProgress,
    playlist,
    iptvPlaylist,
    nextTrack,
    prevTrack,
    nextIptvChannel,
    prevIptvChannel,
    setActiveVideo, 
    setActiveIptv,
    setIsPlaying, 
    setIsMinimized, 
    setIsFullScreen,
    toggleSaveVideo,
    savedVideos,
    toggleFavoriteIptvChannel,
  } = useMediaStore();
  
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<any>(null);
  const videoTagRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  // Strict Navigation Lock & Sandbox
  useEffect(() => {
    const handleFrameSecurity = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(frame => {
        if (!frame.getAttribute('sandbox')) {
          // STRICT SANDBOX: Only allow basic scripts and same-origin. 
          // NO POPUPS, NO TOP NAVIGATION (STOPS YOUTUBE REDIRECTS)
          frame.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
        }
      });
    };
    const observer = new MutationObserver(handleFrameSecurity);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Persistent Player Initialization
  useEffect(() => {
    if (!activeVideo || !mounted || activeIptv) return;
    
    const initPlayer = () => {
      if (playerRef.current) return;
      
      playerRef.current = new (window as any).YT.Player('youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: activeVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(videoProgress[activeVideo.id] || 0),
          enablejsapi: 1,
          mute: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            updateQuality(event.target);
          },
          onStateChange: (event: any) => {
            if (event.data === 1) setIsPlaying(true);
            else if (event.data === 2) setIsPlaying(false);
            else if (event.data === 0) nextTrack();
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) initPlayer();
    else (window as any).onYouTubeIframeAPIReady = initPlayer;
  }, [activeVideo?.id, mounted, activeIptv]);

  // Handle video source change without re-init
  useEffect(() => {
    if (playerRef.current && activeVideo && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(activeVideo.id);
    }
  }, [activeVideo?.id]);

  // Quality Control based on State (Programmatic only)
  const updateQuality = (player: any) => {
    if (!player || typeof player.setPlaybackQuality !== 'function') return;
    if (isMinimized) {
      player.setPlaybackQuality('tiny'); // 144p
    } else if (isFullScreen) {
      player.setPlaybackQuality('medium'); // 480p Auto
    } else {
      player.setPlaybackQuality('small'); // 240p
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      updateQuality(playerRef.current);
    }
  }, [isMinimized, isFullScreen]);

  useEffect(() => {
    if (activeIptv && videoTagRef.current && activeIptv.type !== 'web') {
      const url = `http://playstop.watch:2095/live/W87d737/Pd37qj34/${activeIptv.stream_id}.m3u8`;
      if (hlsRef.current) hlsRef.current.destroy();
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(videoTagRef.current);
        hlsRef.current = hls;
      }
    }
  }, [activeIptv?.stream_id]);

  if (!mounted || (!activeVideo && !activeIptv)) return null;

  const handleAddToIptv = async () => {
    if (!activeVideo) return;
    const details = await fetchChannelDetails(activeVideo.channelId!);
    toggleFavoriteIptvChannel({
      stream_id: activeVideo.id,
      name: details?.name || activeVideo.channelTitle || activeVideo.title,
      stream_icon: details?.image || activeVideo.thumbnail,
      category_id: "direct",
      url: `https://www.youtube.com/embed/${activeVideo.id}`,
      type: "web",
      starred: true
    });
  };

  return (
    <div className={cn(
      "fixed z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl overflow-hidden",
      isMinimized 
        ? "bottom-12 left-1/2 -translate-x-1/2 w-[500px] h-28 rounded-[2.5rem] liquid-glass" 
        : isFullScreen
          ? "inset-0 w-full h-full bg-black rounded-0"
          : "bottom-8 right-4 w-[50vw] h-[55vh] glass-panel rounded-[3.5rem] bg-black/95"
    )}>
      <div className={cn("absolute inset-0 transition-opacity duration-700", isMinimized ? "opacity-0" : "opacity-100")}>
        {activeVideo ? (
          <div id="youtube-player-element" className="w-full h-full"></div>
        ) : activeIptv?.type === 'web' ? (
          <iframe 
            src={`${activeIptv.url}${activeIptv.url!.includes('?') ? '&' : '?'}autoplay=1&mute=0`}
            className="w-full h-full border-none"
            allow="autoplay; fullscreen"
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
        ) : (
          <video ref={videoTagRef} autoPlay controls className="w-full h-full object-contain" />
        )}
      </div>

      {isMinimized && (
        <div className="h-full flex items-center justify-between px-8 relative z-10" onClick={() => setIsFullScreen(true)}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
              <Image src={activeVideo?.thumbnail || activeIptv?.stream_icon || ""} alt="" fill className="object-cover" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black text-white truncate max-w-[200px]">{activeVideo?.title || activeIptv?.name}</h4>
              <span className="text-[9px] text-accent font-black uppercase">Capsule Feed (144p)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}</button>
            <button onClick={(e) => { e.stopPropagation(); setActiveVideo(null); setActiveIptv(null); }} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {!isMinimized && (
        <div className={cn(
          "fixed z-[5200] flex items-center gap-4 transition-all duration-500",
          isFullScreen ? "left-10 bottom-10 scale-150 origin-bottom-left" : "right-12 bottom-12 scale-90"
        )}>
          <div className="flex items-center gap-2 liquid-glass p-3 rounded-full border border-white/20 shadow-2xl">
            {(playlist.length > 0 || iptvPlaylist.length > 0) && (
              <>
                <button onClick={() => activeVideo ? prevTrack() : prevIptvChannel()} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center focusable"><SkipBack className="w-5 h-5" /></button>
                <button onClick={() => activeVideo ? nextTrack() : nextIptvChannel()} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center focusable"><SkipForward className="w-5 h-5" /></button>
              </>
            )}
            <button onClick={() => setIsMinimized(true)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center focusable"><ChevronDown className="w-5 h-5" /></button>
            <button onClick={() => setIsFullScreen(!isFullScreen)} className={cn("w-12 h-12 rounded-full flex items-center justify-center focusable", isFullScreen && "bg-primary border-primary")}><Monitor className="w-5 h-5" /></button>
            {activeVideo && (
              <>
                <button onClick={handleAddToIptv} title="Add to IPTV" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center focusable"><Tv className="w-5 h-5 text-emerald-400" /></button>
                <button onClick={() => toggleSaveVideo(activeVideo)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center focusable"><Bookmark className={cn("w-5 h-5", savedVideos.some(v => v.id === activeVideo.id) && "fill-current text-primary")} /></button>
              </>
            )}
            <button onClick={() => router.push('/iptv')} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center focusable"><List className="w-5 h-5" /></button>
            <div className="w-px h-8 bg-white/20 mx-1" />
            <button onClick={() => { setActiveVideo(null); setActiveIptv(null); }} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center focusable"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
