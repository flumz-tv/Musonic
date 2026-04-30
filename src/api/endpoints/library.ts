/**
 * @file library.ts
 * @description Subsonic library API endpoints: recently/frequently played albums,
 *   starred items, similar songs/artists, and star/unstar actions.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {subsonicGet} from '../client';
import type {SubsonicArtist, SubsonicAlbum, SubsonicSong, SubsonicSimilarArtist} from '../types';

export async function getArtists(): Promise<SubsonicArtist[]> {
  const res = await subsonicGet<any>('getArtists.view');
  const indexes = res.artists?.index ?? [];
  return indexes.flatMap((i: any) => i.artist ?? []);
}

export async function getAlbumsByArtist(artistId: string): Promise<SubsonicAlbum[]> {
  const res = await subsonicGet<any>('getArtist.view', {id: artistId});
  return res.artist?.album ?? [];
}

export async function getAlbum(albumId: string): Promise<{album: SubsonicAlbum; songs: SubsonicSong[]}> {
  const res = await subsonicGet<any>('getAlbum.view', {id: albumId});
  return {album: res.album, songs: res.album?.song ?? []};
}

export async function getRecentAlbums(size = 20): Promise<SubsonicAlbum[]> {
  const res = await subsonicGet<any>('getAlbumList2.view', {type: 'recent', size});
  return res.albumList2?.album ?? [];
}

export async function getNewestAlbums(size = 20): Promise<SubsonicAlbum[]> {
  const res = await subsonicGet<any>('getAlbumList2.view', {type: 'newest', size});
  return res.albumList2?.album ?? [];
}

export async function getFrequentAlbums(size = 20): Promise<SubsonicAlbum[]> {
  const res = await subsonicGet<any>('getAlbumList2.view', {type: 'frequent', size});
  return res.albumList2?.album ?? [];
}

export async function getStarred(): Promise<{songs: SubsonicSong[]; albums: SubsonicAlbum[]; artists: SubsonicArtist[]}> {
  const res = await subsonicGet<any>('getStarred2.view');
  return {
    songs: res.starred2?.song ?? [],
    albums: res.starred2?.album ?? [],
    artists: res.starred2?.artist ?? [],
  };
}

export async function star(id: string) {
  await subsonicGet('star.view', {id});
}

export async function unstar(id: string) {
  await subsonicGet('unstar.view', {id});
}

export async function getSimilarSongs(id: string, count = 20): Promise<SubsonicSong[]> {
  const res = await subsonicGet<any>('getSimilarSongs2.view', {id, count});
  return res.similarSongs2?.song ?? [];
}

export async function getSimilarArtists(artistId: string, count = 20): Promise<SubsonicSimilarArtist[]> {
  const res = await subsonicGet<any>('getArtistInfo2.view', {id: artistId, count});
  return res.artistInfo2?.similarArtist ?? [];
}
