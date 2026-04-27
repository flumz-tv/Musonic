import {subsonicGet, getCoverArtUrl} from '../client';
import type {SubsonicSearchResult} from '../types';

// ─── Deezer image enrichment ───────────────────────────────────────────────
async function getDeezerArtistImage(artistName: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`);
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json.data[0].picture_xl || json.data[0].picture_medium;
    }
  } catch {
    // non-critical enrichment failure
  }
  return undefined;
}

// ─── Main search function ──────────────────────────────────────────────────
export async function search(query: string, artistCount = 10, albumCount = 15, songCount = 20): Promise<SubsonicSearchResult> {
  try {
    const res = await subsonicGet<any>('search3.view', {
      query,
      artistCount,
      albumCount,
      songCount,
    });

    const searchData = res.searchResult3 || res.searchResult2 || res.searchResult || {};

    // Deduplicate by ID before enriching
    const seenArtists = new Set<string>();
    const rawArtists: any[] = (searchData.artist || []).filter((a: any) => {
      const id = String(a.id);
      if (seenArtists.has(id)) return false;
      seenArtists.add(id);
      return true;
    });

    const seenAlbums = new Set<string>();
    const albums = (searchData.album || []).filter((a: any) => {
      const id = String(a.id);
      if (seenAlbums.has(id)) return false;
      seenAlbums.add(id);
      return true;
    });

    const seenSongs = new Set<string>();
    const songs = (searchData.song || []).filter((s: any) => {
      const id = String(s.id);
      if (seenSongs.has(id)) return false;
      seenSongs.add(id);
      return true;
    });

    const artists = await Promise.all(rawArtists.map(async (artist: any) => {
      if (artist.coverArt) {
        artist.artistImageUrl = getCoverArtUrl(artist.coverArt, 300);
      } else {
        const deezerImg = await getDeezerArtistImage(artist.name);
        if (deezerImg) {
          artist.artistImageUrl = deezerImg;
        }
      }
      return artist;
    }));

    return {artists, albums, songs};
  } catch (error) {
    console.log('[search] error:', error);
    return {artists: [], albums: [], songs: []};
  }
}
