import TrackPlayer, {Event, useTrackPlayerEvents} from 'react-native-track-player';
import {usePlayerStore} from '../store/playerStore';
import type {Track} from '../store/playerStore';

const SYNC_EVENTS = [Event.PlaybackActiveTrackChanged];

function mapToTrack(t: any): Track {
  return {
    id: String(t.id ?? ''),
    title: t.title ?? '',
    artist: t.artist ?? '',
    album: t.album ?? '',
    duration: t.duration ?? 0,
    coverArt: t.coverArt,
    streamUrl: String(t.url ?? ''),
    artistId: t.artistId,
    url: String(t.url ?? ''),
    artwork: typeof t.artwork === 'string' ? t.artwork : undefined,
  };
}

export default function AudioPlayer() {
  useTrackPlayerEvents(SYNC_EVENTS, async event => {
    if (event.type !== Event.PlaybackActiveTrackChanged || !event.track) return;

    const store = usePlayerStore.getState();
    store.onTrackChanged();

    try {
      const queue = await TrackPlayer.getQueue();
      const idx = event.index ?? 0;
      const history = queue.slice(0, idx).map(mapToTrack);
      const upcoming = queue.slice(idx + 1).map(mapToTrack);
      store.setHistory(history);
      store.setUpcoming(
        store.repeatMode === 'all' ? [...upcoming, ...history] : upcoming,
      );
    } catch {}
  });

  return null;
}
