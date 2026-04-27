import {create} from 'zustand';
import TrackPlayer, {RepeatMode, State} from 'react-native-track-player';
import {star, unstar} from '../api/endpoints/library';

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
  streamUrl?: string;
  artistId?: string;
  url?: string;
  artwork?: string;
};

export type RepeatModeUI = 'none' | 'all' | 'one';

const REPEAT_MAP: Record<RepeatModeUI, RepeatMode> = {
  none: RepeatMode.Off,
  all: RepeatMode.Queue,
  one: RepeatMode.Track,
};

type PlayerState = {
  // Queue arrays — synced from RNTP events (used by QueueSheet)
  queue: Track[];
  history: Track[];
  upcoming: Track[];
  // UI-only state not tracked by RNTP
  isMiniPlayerVisible: boolean;
  dominantColor: string;
  isShuffled: boolean;
  repeatMode: RepeatModeUI;
  isFullScreenOpen: boolean;
  likedSongIds: Set<string>;
  localLikeOverrides: Record<string, boolean>;
  playlistSongIds: Set<string>;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  lastPlayedPlaylists: Record<string, number>;
  playlistVersion: number;

  setQueue: (tracks: Track[]) => void;
  setHistory: (history: Track[]) => void;
  setUpcoming: (upcoming: Track[]) => void;
  setMiniPlayerVisible: (visible: boolean) => void;
  onTrackChanged: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  setDominantColor: (color: string) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFullScreen: () => void;
  closeFullScreen: () => void;
  pendingLikeRetries: Set<string>;
  addPendingLikeRetry: (id: string) => void;
  removePendingLikeRetry: (id: string) => void;
  revertLikeOverride: (id: string) => void;
  toggleLike: (trackId: string) => Promise<boolean>;
  setLikedSongs: (ids: string[]) => void;
  setPlaylistSong: (id: string, inPlaylist: boolean) => void;
  setCurrentPlaylist: (id: string | null, name: string | null) => void;
  reorderQueue: (from: number, to: number) => void;
  removeFromQueue: (ids: string[]) => void;
  moveToTop: (ids: string[]) => void;
  bumpPlaylistVersion: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  history: [],
  upcoming: [],
  isMiniPlayerVisible: false,
  dominantColor: '#3D1F0F',
  isShuffled: false,
  repeatMode: 'none',
  isFullScreenOpen: false,
  likedSongIds: new Set<string>(),
  localLikeOverrides: {} as Record<string, boolean>,
  pendingLikeRetries: new Set<string>(),
  playlistSongIds: new Set<string>(),
  currentPlaylistId: null,
  currentPlaylistName: null,
  lastPlayedPlaylists: {},
  playlistVersion: 0,

  setQueue: tracks => set({queue: tracks}),
  setHistory: history => set({history}),
  setUpcoming: upcoming => set({upcoming}),
  setMiniPlayerVisible: visible => set({isMiniPlayerVisible: visible}),

  onTrackChanged: () => set({isMiniPlayerVisible: true}),

  togglePlay: () => {
    TrackPlayer.getPlaybackState()
      .then(({state: s}) => {
        (s as State) === State.Playing ? TrackPlayer.pause() : TrackPlayer.play();
      })
      .catch(() => {});
  },

  playNext: () => {
    TrackPlayer.skipToNext().catch(() => {});
  },

  playPrev: () => {
    TrackPlayer.skipToPrevious().catch(() => {});
  },

  setDominantColor: color => set({dominantColor: color}),

  toggleShuffle: () => set(s => ({isShuffled: !s.isShuffled})),

  cycleRepeat: () => {
    const next: Record<RepeatModeUI, RepeatModeUI> = {
      none: 'all',
      all: 'one',
      one: 'none',
    };
    const newMode = next[get().repeatMode];
    set({repeatMode: newMode});
    TrackPlayer.setRepeatMode(REPEAT_MAP[newMode]).catch(() => {});
  },

  openFullScreen: () => set({isFullScreenOpen: true}),
  closeFullScreen: () => set({isFullScreenOpen: false}),

  addPendingLikeRetry: id =>
    set(s => ({pendingLikeRetries: new Set([...s.pendingLikeRetries, id])})),

  removePendingLikeRetry: id =>
    set(s => {
      const next = new Set(s.pendingLikeRetries);
      next.delete(id);
      return {pendingLikeRetries: next};
    }),

  revertLikeOverride: id =>
    set(s => {
      const next = {...s.localLikeOverrides};
      delete next[id];
      return {localLikeOverrides: next};
    }),

  toggleLike: (trackId: string): Promise<boolean> => {
    const {likedSongIds, localLikeOverrides} = get();
    const currentLiked = localLikeOverrides[trackId] ?? likedSongIds.has(trackId);
    const newLiked = !currentLiked;
    set({localLikeOverrides: {...localLikeOverrides, [trackId]: newLiked}});
    return (newLiked ? star : unstar)(trackId)
      .then(() => true as boolean)
      .catch(() => {
        // Keep optimistic override — retry will fire when track plays
        set(s => ({pendingLikeRetries: new Set([...s.pendingLikeRetries, trackId])}));
        return false as boolean;
      });
  },

  setLikedSongs: (ids: string[]) => set({likedSongIds: new Set(ids)}),

  setPlaylistSong: (id: string, inPlaylist: boolean) =>
    set(s => {
      const next = new Set(s.playlistSongIds);
      if (inPlaylist) next.add(id);
      else next.delete(id);
      return {playlistSongIds: next};
    }),

  setCurrentPlaylist: (id, name) =>
    set(s => ({
      currentPlaylistId: id,
      currentPlaylistName: name,
      lastPlayedPlaylists:
        id != null
          ? {...s.lastPlayedPlaylists, [id]: Date.now()}
          : s.lastPlayedPlaylists,
    })),

  reorderQueue: (from, to) => {
    const arr = [...get().upcoming];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    set({upcoming: arr});
    TrackPlayer.getActiveTrackIndex()
      .then(activeIdx => {
        if (activeIdx == null) return;
        return TrackPlayer.move(activeIdx + 1 + from, activeIdx + 1 + to);
      })
      .catch(() => {});
  },

  removeFromQueue: ids => {
    set(s => ({upcoming: s.upcoming.filter(t => !ids.includes(t.id))}));
    TrackPlayer.getQueue()
      .then(queue => {
        const indices = queue
          .map((t, i) => ({id: String(t.id), i}))
          .filter(({id}) => ids.includes(id))
          .map(({i}) => i);
        if (indices.length > 0) return TrackPlayer.remove(indices);
      })
      .catch(() => {});
  },

  moveToTop: ids => {
    const {upcoming} = get();
    const selected = ids
      .map(id => upcoming.find(t => t.id === id))
      .filter(Boolean) as Track[];
    const rest = upcoming.filter(t => !ids.includes(t.id));
    set({upcoming: [...selected, ...rest]});
    TrackPlayer.getActiveTrackIndex()
      .then(async activeIdx => {
        if (activeIdx == null) return;
        for (let i = 0; i < ids.length; i++) {
          const queue = await TrackPlayer.getQueue();
          const srcIdx = queue.findIndex(t => String(t.id) === ids[i]);
          if (srcIdx !== -1) await TrackPlayer.move(srcIdx, activeIdx + 1 + i);
        }
      })
      .catch(() => {});
  },

  bumpPlaylistVersion: () => set(s => ({playlistVersion: s.playlistVersion + 1})),
}));
