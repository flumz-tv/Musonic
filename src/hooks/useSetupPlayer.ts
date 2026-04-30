/**
 * @file useSetupPlayer.ts
 * @description Hook that initialises react-native-track-player once on app mount:
 *   calls setupPlayer, configures capabilities (play, pause, skip, seek, like),
 *   and registers notification/lock-screen options.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {useEffect, useRef} from 'react';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';

export function useSetupPlayer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    TrackPlayer.setupPlayer({waitForBuffer: false})
      .then(() => {
        return TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          progressUpdateEventInterval: 0.5,
        });
      })
      .catch(e => console.log('[TrackPlayer] setup:', e));
  }, []);
}
