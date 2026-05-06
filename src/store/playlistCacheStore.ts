/**
 * @file playlistCacheStore.ts
 * @description Zustand + MMKV store caching the set of all track IDs that belong
 *   to at least one user playlist. Persisted across app restarts; rebuilt as a
 *   Set on rehydration for O(1) membership checks in SongOptionsSheet.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';
import {getPlaylists, getPlaylist} from '../api/endpoints/playlists';

type PlaylistCacheState = {
  savedTrackIds: string[];
  savedSet: Set<string>;
  setAll: (ids: string[]) => void;
  addTracks: (ids: string[]) => void;
  removeTrack: (id: string) => void;
};

export const usePlaylistCacheStore = create<PlaylistCacheState>()(
  persist(
    (set) => ({
      savedTrackIds: [],
      savedSet: new Set<string>(),

      setAll: (ids) => {
        const unique = [...new Set(ids)];
        set({savedTrackIds: unique, savedSet: new Set(unique)});
      },

      addTracks: (ids) =>
        set(s => {
          const next = [...new Set([...s.savedTrackIds, ...ids])];
          return {savedTrackIds: next, savedSet: new Set(next)};
        }),

      removeTrack: (id) =>
        set(s => {
          const next = s.savedTrackIds.filter(x => x !== id);
          return {savedTrackIds: next, savedSet: new Set(next)};
        }),
    }),
    {
      name: 'musonic-playlist-cache',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({savedTrackIds: s.savedTrackIds}),
      onRehydrateStorage: () => (state) => {
        if (state) state.savedSet = new Set(state.savedTrackIds);
      },
    },
  ),
);

export async function fetchAndCachePlaylistSongs(): Promise<void> {
  try {
    const playlists = await getPlaylists();
    if (!playlists.length) return;
    const results = await Promise.all(
      playlists.map(p => getPlaylist(p.id).catch(() => ({songs: []}))),
    );
    const allIds = results.flatMap(r => r.songs.map(s => String(s.id)));
    usePlaylistCacheStore.getState().setAll(allIds);
  } catch {
    // silent — stale MMKV data still available
  }
}
