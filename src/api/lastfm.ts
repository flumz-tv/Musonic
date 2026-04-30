/**
 * @file lastfm.ts
 * @description Last.fm API helper. Fetches artist cover images via the Last.fm
 *   artist.getInfo endpoint. Used as a fallback when Subsonic provides no artist
 *   image. Will be replaced by Deezer in v0.9.4 (cleanup milestone).
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {LASTFM_API_KEY} from './apiKeys';

const BASE = 'https://ws.audioscrobbler.com/2.0/';

export async function getArtistImage(artistName: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      method: 'artist.getinfo',
      artist: artistName,
      api_key: LASTFM_API_KEY,
      format: 'json',
    });
    const res = await fetch(`${BASE}?${params}`);
    const data = await res.json();
    const images: {size: string; '#text': string}[] = data.artist?.image ?? [];
    const LASTFM_DEFAULT = '2a96cbd8b46e442fc';
    const valid = (url: string | undefined) =>
      url && url.length > 0 && !url.includes(LASTFM_DEFAULT);
    const pick =
      images.find(i => i.size === 'extralarge')?.[`#text`] ||
      images.find(i => i.size === 'large')?.[`#text`] ||
      null;
    return valid(pick ?? undefined) ? pick : null;
  } catch {
    return null;
  }
}
