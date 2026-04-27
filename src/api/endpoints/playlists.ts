import {subsonicGet} from '../client';
import type {SubsonicPlaylist, SubsonicSong} from '../types';

export async function getPlaylists(): Promise<SubsonicPlaylist[]> {
  const res = await subsonicGet<any>('getPlaylists.view');
  return res.playlists?.playlist ?? [];
}

export async function getPlaylist(id: string): Promise<{playlist: SubsonicPlaylist; songs: SubsonicSong[]}> {
  const res = await subsonicGet<any>('getPlaylist.view', {id});
  return {
    playlist: res.playlist,
    songs: res.playlist?.entry ?? [],
  };
}

export async function createPlaylist(name: string, songIds: string[] = []): Promise<SubsonicPlaylist> {
  const res = await subsonicGet<any>('createPlaylist.view', {
    name,
    songId: songIds,
  });
  return res.playlist;
}

export async function updatePlaylist(
  id: string,
  name?: string,
  songIdsToAdd?: string[],
  songIndexesToRemove?: number[],
) {
  const params: Record<string, unknown> = {playlistId: id};
  if (name !== undefined) params.name = name;
  if (songIdsToAdd?.length) params.songIdToAdd = songIdsToAdd;
  if (songIndexesToRemove?.length) params.songIndexToRemove = songIndexesToRemove;
  await subsonicGet('updatePlaylist.view', params);
}

export async function replacePlaylist(id: string, songIds: string[]): Promise<void> {
  await subsonicGet('createPlaylist.view', {
    playlistId: id,
    songId: songIds,
  });
}

export async function deletePlaylist(id: string) {
  await subsonicGet('deletePlaylist.view', {id});
}
