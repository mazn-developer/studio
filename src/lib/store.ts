
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { YouTubeChannel, YouTubeVideo } from "./youtube";
import { 
  JSONBIN_MASTER_KEY, 
  JSONBIN_CHANNELS_BIN_ID, 
  JSONBIN_CLUBS_BIN_ID, 
  JSONBIN_SAVED_VIDEOS_BIN_ID,
  JSONBIN_PRAYER_TIMES_BIN_ID,
  JSONBIN_IPTV_FAVS_BIN_ID,
  prayerTimesData
} from "./constants";

export interface Reminder {
  id: string;
  label: string;
  iconType: 'play' | 'bell' | 'circle';
  completed: boolean;
  color: string;
  startHour: number;
  endHour: number;
}

export interface MapSettings {
  zoom: number;
  tilt: number;
  carScale: number;
  backgroundIndex: number;
}

export interface IptvChannel {
  name: string;
  stream_id: string;
  stream_icon: string;
  category_id: string;
  starred?: boolean;
  url?: string;
  type?: 'iptv' | 'web' | 'live';
}

export interface FavoriteTeam {
  id: number;
  name: string;
  logo: string;
}

interface MediaState {
  favoriteChannels: YouTubeChannel[];
  savedVideos: YouTubeVideo[];
  starredChannelIds: string[];
  videoProgress: Record<string, number>;
  favoriteTeams: FavoriteTeam[];
  favoriteLeagueIds: number[];
  belledMatchIds: string[];
  favoriteIptvChannels: IptvChannel[];
  iptvFormat: 'ts' | 'm3u8';
  iptvPlaylist: IptvChannel[];
  iptvPlaylistIndex: number;
  prayerTimes: any[];
  reminders: Reminder[];
  mapSettings: MapSettings;
  aiSuggestions: any[];
  activeVideo: YouTubeVideo | null;
  activeIptv: IptvChannel | null;
  playlist: YouTubeVideo[];
  playlistIndex: number;
  isPlaying: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  dockSide: 'left' | 'right';
  addChannel: (channel: YouTubeChannel) => void;
  removeChannel: (channelid: string) => void;
  incrementChannelClick: (channelid: string) => void;
  toggleSaveVideo: (video: YouTubeVideo) => void;
  removeVideo: (id: string) => void;
  toggleStarChannel: (channelid: string) => void;
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  toggleFavoriteTeam: (team: FavoriteTeam) => void;
  toggleFavoriteLeagueId: (leagueId: number) => void;
  toggleBelledMatch: (matchId: string) => void;
  toggleFavoriteIptvChannel: (channel: IptvChannel) => void;
  setIptvFormat: (format: 'ts' | 'm3u8') => void;
  setIptvPlaylist: (channels: IptvChannel[], index: number) => void;
  nextIptvChannel: () => void;
  prevIptvChannel: () => void;
  updateMapSettings: (settings: Partial<MapSettings>) => void;
  setAiSuggestions: (suggestions: any[]) => void;
  setActiveVideo: (video: YouTubeVideo | null) => void;
  setActiveIptv: (channel: IptvChannel | null) => void;
  setPlaylist: (videos: YouTubeVideo[]) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  updateVideoProgress: (videoId: string, progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsFullScreen: (fullScreen: boolean) => void;
  setDockSide: (side: 'left' | 'right') => void;
  toggleDockSide: () => void;
}

const updateBin = async (binId: string, data: any) => {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY
      },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error(`JSONBin Sync Error [${binId}]:`, e);
  }
};

export const useMediaStore = create<MediaState>()(
  persist(
    (set, get) => ({
      favoriteChannels: [],
      savedVideos: [],
      starredChannelIds: [],
      videoProgress: {},
      favoriteTeams: [],
      favoriteLeagueIds: [307, 39, 2, 140, 135],
      belledMatchIds: [],
      favoriteIptvChannels: [],
      iptvFormat: 'ts',
      iptvPlaylist: [],
      iptvPlaylistIndex: 0,
      prayerTimes: prayerTimesData,
      reminders: [],
      mapSettings: { zoom: 20.0, tilt: 65, carScale: 1.02, backgroundIndex: 0 },
      aiSuggestions: [],
      activeVideo: null,
      activeIptv: null,
      playlist: [],
      playlistIndex: 0,
      isPlaying: false,
      isMinimized: false,
      isFullScreen: false,
      dockSide: 'left',

      addChannel: (channel) => {
        set((state) => {
          const newList = [...state.favoriteChannels.filter(c => c.channelid !== channel.channelid), { ...channel, clickschannel: 0, starred: false }];
          updateBin(JSONBIN_CHANNELS_BIN_ID, newList);
          return { favoriteChannels: newList };
        });
      },

      removeChannel: (channelid) => {
        set((state) => {
          const newList = state.favoriteChannels.filter(c => c.channelid !== channelid);
          updateBin(JSONBIN_CHANNELS_BIN_ID, newList);
          return { favoriteChannels: newList };
        });
      },

      incrementChannelClick: (channelid) => {
        set((state) => {
          const newList = state.favoriteChannels.map(c => c.channelid === channelid ? { ...c, clickschannel: (c.clickschannel || 0) + 1 } : c);
          updateBin(JSONBIN_CHANNELS_BIN_ID, newList);
          return { favoriteChannels: newList };
        });
      },

      toggleSaveVideo: (video) => {
        set((state) => {
          const exists = state.savedVideos.some(v => v.id === video.id);
          const newList = exists ? state.savedVideos.filter(v => v.id !== video.id) : [{ ...video, progress: 0 }, ...state.savedVideos];
          updateBin(JSONBIN_SAVED_VIDEOS_BIN_ID, newList);
          return { savedVideos: newList };
        });
      },

      removeVideo: (id) => {
        set((state) => {
          const newList = state.savedVideos.filter(v => v.id !== id);
          updateBin(JSONBIN_SAVED_VIDEOS_BIN_ID, newList);
          return { savedVideos: newList };
        });
      },

      updateVideoProgress: (videoId, progress) => {
        set((state) => {
          const isSaved = state.savedVideos.some(v => v.id === videoId);
          let updatedSaved = state.savedVideos;
          if (isSaved) {
            updatedSaved = state.savedVideos.map(v => v.id === videoId ? { ...v, progress } : v);
            updateBin(JSONBIN_SAVED_VIDEOS_BIN_ID, updatedSaved);
          }
          return { savedVideos: updatedSaved, videoProgress: { ...state.videoProgress, [videoId]: progress } };
        });
      },

      toggleStarChannel: (channelid) => {
        set((state) => {
          const newList = state.favoriteChannels.map(c => c.channelid === channelid ? { ...c, starred: !c.starred } : c);
          updateBin(JSONBIN_CHANNELS_BIN_ID, newList);
          return { favoriteChannels: newList };
        });
      },

      toggleFavoriteTeam: (team) => {
        set((state) => {
          const exists = state.favoriteTeams.some(t => t.id === team.id);
          const newTeams = exists ? state.favoriteTeams.filter(t => t.id !== team.id) : [...state.favoriteTeams, team];
          updateBin(JSONBIN_CLUBS_BIN_ID, { teams: newTeams, matches: state.belledMatchIds });
          return { favoriteTeams: newTeams };
        });
      },

      toggleFavoriteLeagueId: (leagueId) => {
        set((state) => ({ favoriteLeagueIds: state.favoriteLeagueIds.includes(leagueId) ? state.favoriteLeagueIds.filter(id => id !== leagueId) : [...state.favoriteLeagueIds, leagueId] }));
      },

      toggleBelledMatch: (matchId) => {
        set((state) => {
          const newMatches = state.belledMatchIds.includes(matchId) ? state.belledMatchIds.filter(id => id !== matchId) : [...state.belledMatchIds, matchId];
          updateBin(JSONBIN_CLUBS_BIN_ID, { teams: state.favoriteTeams, matches: newMatches });
          return { belledMatchIds: newMatches };
        });
      },

      toggleFavoriteIptvChannel: (channel) => {
        set((state) => {
          const exists = state.favoriteIptvChannels.some(c => c.stream_id === channel.stream_id);
          const newList = exists ? state.favoriteIptvChannels.filter(c => c.stream_id !== channel.stream_id) : [...state.favoriteIptvChannels, { ...channel, starred: true }];
          updateBin("69a87b8bd0ea881f40eeec0c", newList);
          return { favoriteIptvChannels: newList };
        });
      },

      setIptvFormat: (format) => set({ iptvFormat: format }),
      setIptvPlaylist: (channels, index) => set({ iptvPlaylist: channels, iptvPlaylistIndex: index }),
      nextIptvChannel: () => {
        const state = get();
        if (state.iptvPlaylist.length === 0) return;
        const nextIdx = (state.iptvPlaylistIndex + 1) % state.iptvPlaylist.length;
        set({ iptvPlaylistIndex: nextIdx, activeIptv: state.iptvPlaylist[nextIdx] });
      },
      prevIptvChannel: () => {
        const state = get();
        if (state.iptvPlaylist.length === 0) return;
        const prevIdx = (state.iptvPlaylistIndex - 1 + state.iptvPlaylist.length) % state.iptvPlaylist.length;
        set({ iptvPlaylistIndex: prevIdx, activeIptv: state.iptvPlaylist[prevIdx] });
      },

      updateMapSettings: (settings) => set((state) => ({ mapSettings: { ...state.mapSettings, ...settings } })),
      addReminder: (reminder) => set((state) => ({ reminders: [...state.reminders, reminder] })),
      removeReminder: (id) => set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) })),
      toggleReminder: (id) => set((state) => ({ reminders: state.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r) })),
      setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),
      setActiveVideo: (video) => set({ activeVideo: video, activeIptv: null, isPlaying: !!video, isMinimized: false, isFullScreen: !!video }),
      setActiveIptv: (channel) => set({ activeIptv: channel, activeVideo: null, isPlaying: !!channel, isMinimized: false, isFullScreen: !!channel }),
      setPlaylist: (videos) => {
        const shuffled = [...videos].sort(() => Math.random() - 0.5);
        set({ playlist: shuffled, playlistIndex: 0, activeVideo: shuffled[0], activeIptv: null, isPlaying: true, isMinimized: false, isFullScreen: true });
      },
      nextTrack: () => {
        const state = get();
        if (state.playlist.length === 0) return;
        const nextIdx = (state.playlistIndex + 1) % state.playlist.length;
        set({ playlistIndex: nextIdx, activeVideo: state.playlist[nextIdx] });
      },
      prevTrack: () => {
        const state = get();
        if (state.playlist.length === 0) return;
        const prevIdx = (state.playlistIndex - 1 + state.playlist.length) % state.playlist.length;
        set({ playlistIndex: prevIdx, activeVideo: state.playlist[prevIdx] });
      },
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsMinimized: (minimized) => set({ isMinimized: minimized, isFullScreen: false }),
      setIsFullScreen: (fullScreen) => set({ isFullScreen: fullScreen, isMinimized: false }),
      setDockSide: (side) => set({ dockSide: side }),
      toggleDockSide: () => set((state) => ({ dockSide: state.dockSide === 'left' ? 'right' : 'left' })),
    }),
    {
      name: "drivecast-jsonbin-v3",
      partialize: (state) => ({ 
        favoriteChannels: state.favoriteChannels,
        savedVideos: state.savedVideos,
        favoriteTeams: state.favoriteTeams,
        favoriteLeagueIds: state.favoriteLeagueIds,
        belledMatchIds: state.belledMatchIds,
        favoriteIptvChannels: state.favoriteIptvChannels,
        mapSettings: state.mapSettings,
        reminders: state.reminders,
        prayerTimes: state.prayerTimes,
        dockSide: state.dockSide
      }),
    }
  )
);

if (typeof window !== "undefined") {
  const syncWithBins = async () => {
    try {
      const chRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CHANNELS_BIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_MASTER_KEY } });
      if (chRes.ok) { const data = await chRes.json(); useMediaStore.setState({ favoriteChannels: data.record }); }

      const clRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CLUBS_BIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_MASTER_KEY } });
      if (clRes.ok) { 
        const data = await clRes.json();
        if (data.record.teams) useMediaStore.setState({ favoriteTeams: data.record.teams });
        if (data.record.matches) useMediaStore.setState({ belledMatchIds: data.record.matches });
      }

      const iptvRes = await fetch(`https://api.jsonbin.io/v3/b/69a87b8bd0ea881f40eeec0c/latest`, { headers: { 'X-Master-Key': JSONBIN_MASTER_KEY } });
      if (iptvRes.ok) { const data = await iptvRes.json(); useMediaStore.setState({ favoriteIptvChannels: data.record }); }
    } catch (e) { console.error("Bin Sync Error:", e); }
  };
  syncWithBins();
}
