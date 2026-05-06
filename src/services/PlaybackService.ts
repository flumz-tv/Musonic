/**
 * @file PlaybackService.ts
 * @description RNTP headless task. Handles remote control events (play, pause,
 *   skip, seek, stop) fired from lock screen / notification buttons while the
 *   app is backgrounded or killed.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import TrackPlayer, {Event} from 'react-native-track-player';
import {useSettingsStore} from '../store/settingsStore';

let fadeInTimer: ReturnType<typeof setInterval> | null = null;
let fadeOutTimer: ReturnType<typeof setInterval> | null = null;
let progressPoller: ReturnType<typeof setInterval> | null = null;
let fadeOutStarted = false;

function clearAll() {
  if (fadeInTimer) { clearInterval(fadeInTimer); fadeInTimer = null; }
  if (fadeOutTimer) { clearInterval(fadeOutTimer); fadeOutTimer = null; }
  if (progressPoller) { clearInterval(progressPoller); progressPoller = null; }
  fadeOutStarted = false;
}

function startFadeIn(durationSeconds: number) {
  const STEPS = 30;
  const intervalMs = (durationSeconds * 1000) / STEPS;
  let step = 0;
  TrackPlayer.setVolume(0).catch(() => {});
  const id = setInterval(() => {
    step++;
    TrackPlayer.setVolume(Math.min(step / STEPS, 1)).catch(() => {});
    if (step >= STEPS) {
      clearInterval(id);
      if (fadeInTimer === id) { fadeInTimer = null; }
    }
  }, intervalMs);
  fadeInTimer = id;
}

function startFadeOut(durationSeconds: number) {
  const STEPS = 30;
  const intervalMs = (durationSeconds * 1000) / STEPS;
  let step = 0;
  const id = setInterval(() => {
    step++;
    TrackPlayer.setVolume(Math.max(1 - step / STEPS, 0)).catch(() => {});
    if (step >= STEPS) {
      clearInterval(id);
      if (fadeOutTimer === id) { fadeOutTimer = null; }
    }
  }, intervalMs);
  fadeOutTimer = id;
}

function startProgressPoller(durationSeconds: number) {
  fadeOutStarted = false;
  const id = setInterval(async () => {
    if (fadeOutStarted) { return; }
    try {
      const {position, duration} = await TrackPlayer.getProgress();
      if (
        duration > 0 &&
        duration > durationSeconds * 2 &&
        position >= duration - durationSeconds
      ) {
        fadeOutStarted = true;
        clearInterval(id);
        if (progressPoller === id) { progressPoller = null; }
        startFadeOut(durationSeconds);
      }
    } catch {
      // getProgress may throw if no track loaded — ignore
    }
  }, 500);
  progressPoller = id;
}

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({position}) =>
    TrackPlayer.seekTo(position),
  );
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({permanent, paused}) => {
    if (permanent) {
      await TrackPlayer.pause();
    } else if (paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, () => {
    const {crossfadeDuration} = useSettingsStore.getState();
    clearAll();
    if (crossfadeDuration > 0) {
      startFadeIn(crossfadeDuration);
      startProgressPoller(crossfadeDuration);
    } else {
      TrackPlayer.setVolume(1).catch(() => {});
    }
  });
}
