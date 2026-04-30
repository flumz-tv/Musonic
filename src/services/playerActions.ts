/**
 * @file playerActions.ts
 * @description Imperative playback action helpers used across screens. All
 *   queue-loading functions resolve `currentPlaylistId` so the orange active-track
 *   indicator in PlaylistDetail stays accurate regardless of play context.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import TrackPlayer from 'react-native-track-player';
import {getPlaylist} from '../api/endpoints/playlists';
import {getStreamUrl, getCoverArtUrl, subsonicGet} from '../api/client';
import {usePlayerStore} from '../store/playerStore';
import type {Track} from '../store/playerStore';

function fisherYates(arr: Track[]): Track[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function toRNTPTrack(t: Track) {
  return {
    id: String(t.id),
    url: t.streamUrl ?? t.url ?? '',
    title: t.title,
    artist: t.artist,
    album: t.album,
    artwork: t.artwork ?? '',
    duration: t.duration,
    coverArt: t.coverArt,
    artistId: t.artistId,
  };
}

export async function loadAndPlayPlaylist(
  playlistId: string,
  startRandom = false,
): Promise<void> {
  const data = await getPlaylist(playlistId);
  const songs = data.songs || [];
  const playlistName = data.playlist?.name || 'Playlist';

  if (songs.length === 0) return;

  const tracks: Track[] = songs.map(s => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    artistId: s.artistId,
    album: s.album,
    duration: s.duration,
    coverArt: s.coverArt,
    streamUrl: getStreamUrl(s.id),
    url: getStreamUrl(s.id),
    artwork: getCoverArtUrl(s.coverArt || s.albumId || s.id, 600),
  }));

  const ordered = startRandom ? fisherYates(tracks) : tracks;

  const store = usePlayerStore.getState();
  store.setCurrentPlaylist(playlistId, playlistName);
  store.setQueue(ordered);
  store.setHistory([]);
  store.setUpcoming(ordered.slice(1));

  await TrackPlayer.reset();
  await TrackPlayer.add(ordered.map(toRNTPTrack));
  await TrackPlayer.play();
}

export async function loadAndPlayAlbum(
  albumId: string,
  startRandom = false,
): Promise<void> {
  try {
    const res = await subsonicGet<any>('getAlbum.view', {id: albumId});
    const album = res.album || {};
    const songs = album.song || [];

    if (songs.length === 0) return;

    const tracks: Track[] = songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      artistId: s.artistId || album.artistId,
      album: s.album,
      duration: s.duration,
      coverArt: s.coverArt,
      streamUrl: getStreamUrl(s.id),
      url: getStreamUrl(s.id),
      artwork: getCoverArtUrl(s.coverArt || album.id || s.id, 600),
    }));

    const ordered = startRandom ? fisherYates(tracks) : tracks;

    const store = usePlayerStore.getState();
    store.setCurrentPlaylist(null, null);
    store.setQueue(ordered);
    store.setHistory([]);
    store.setUpcoming(ordered.slice(1));

    await TrackPlayer.reset();
    await TrackPlayer.add(ordered.map(toRNTPTrack));
    await TrackPlayer.play();
  } catch (error) {
    console.warn('Album playback error:', error);
  }
}

export function playTrack(track: Track): void {
  const store = usePlayerStore.getState();
  store.setCurrentPlaylist(null, null);
  store.setQueue([track]);
  store.setHistory([]);
  store.setUpcoming([]);

  TrackPlayer.reset()
    .then(() => TrackPlayer.add([toRNTPTrack(track)]))
    .then(() => TrackPlayer.play())
    .catch(e => console.log('[TrackPlayer] playTrack:', e));
}

export async function loadAndPlayTracks(
  tracks: Track[],
  startIndex: number = 0,
  playlistContext?: {id: string; name: string},
): Promise<void> {
  if (tracks.length === 0) return;
  const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
  const store = usePlayerStore.getState();
  // Always resolve playlist context: set provided one, or clear it.
  // This prevents orange-highlight bleed when playing from a non-playlist context
  // (album, liked songs, search) while a playlist screen is still visible.
  store.setCurrentPlaylist(playlistContext?.id ?? null, playlistContext?.name ?? null);
  store.setQueue(tracks);
  store.setHistory(tracks.slice(0, idx));
  store.setUpcoming(tracks.slice(idx + 1));
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks.map(toRNTPTrack));
  if (idx > 0) await TrackPlayer.skip(idx);
  await TrackPlayer.play();
}

export function skipNext(): void {
  TrackPlayer.skipToNext().catch(() => {});
}

export async function skipPrev(): Promise<void> {
  const position = await TrackPlayer.getPosition();
  if (position > 3) {
    TrackPlayer.seekTo(0);
  } else {
    TrackPlayer.skipToPrevious().catch(() => {});
  }
}

export function skipPrevForce(): void {
  TrackPlayer.skipToPrevious().catch(() => {});
}

export function seekTo(seconds: number): void {
  TrackPlayer.seekTo(seconds);
}

export async function syncUpcomingFromRNTP(): Promise<void> {
  try {
    const [queue, activeIdx] = await Promise.all([
      TrackPlayer.getQueue(),
      TrackPlayer.getActiveTrackIndex(),
    ]);
    if (activeIdx == null) return;
    const upcoming = queue.slice(activeIdx + 1).map(t => ({
      id: String(t.id),
      title: String(t.title ?? ''),
      artist: String(t.artist ?? ''),
      album: String(t.album ?? ''),
      duration: Number(t.duration ?? 0),
      coverArt: t.coverArt ? String(t.coverArt) : undefined,
      url: String(t.url ?? ''),
      artwork: t.artwork ? String(t.artwork) : undefined,
    }));
    usePlayerStore.getState().setUpcoming(upcoming);
  } catch {}
}
