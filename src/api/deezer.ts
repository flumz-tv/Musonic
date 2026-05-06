/**
 * @file deezer.ts
 * @description Deezer public API helper. Fetches artist images via the Deezer
 *   search/artist endpoint. No API key required.
 * @author DoodzProg
 * @version 1.0.0
 * @license CC-BY-NC-4.0
 */

const BASE = 'https://api.deezer.com';

export async function getArtistImage(artistName: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({q: artistName});
    const res = await fetch(`${BASE}/search/artist?${params}`);
    const data = await res.json();
    const artist = data?.data?.[0];
    if (!artist) return null;
    return artist.picture_xl || artist.picture_big || null;
  } catch {
    return null;
  }
}
