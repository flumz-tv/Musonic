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
    const pick =
      images.find(i => i.size === 'extralarge')?.[`#text`] ||
      images.find(i => i.size === 'large')?.[`#text`] ||
      null;
    return pick && pick.length > 0 ? pick : null;
  } catch {
    return null;
  }
}
