import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useActiveTrack, usePlaybackState, State} from 'react-native-track-player';
import {usePlayerStore} from '../store/playerStore';
import {star, unstar} from '../api/endpoints/library';
import Toast from './Toast';
import {t} from '../i18n/fr';

export default function LikeRetryManager() {
  const currentTrack = useActiveTrack();
  const {state} = usePlaybackState();
  const pendingLikeRetries = usePlayerStore(s => s.pendingLikeRetries);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const removePendingLikeRetry = usePlayerStore(s => s.removePendingLikeRetry);
  const revertLikeOverride = usePlayerStore(s => s.revertLikeOverride);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (state !== State.Playing) return;
    const trackId = currentTrack?.id ? String(currentTrack.id) : '';
    if (!trackId || !pendingLikeRetries.has(trackId)) return;

    removePendingLikeRetry(trackId);
    const newLiked = localLikeOverrides[trackId];
    if (newLiked === undefined) return;

    (newLiked ? star : unstar)(trackId)
      .then(() => {
        showToast(newLiked ? t.likes.addedToLiked : t.likes.removedFromLiked);
      })
      .catch(() => {
        revertLikeOverride(trackId);
        showToast(t.likes.indexError);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentTrack?.id, pendingLikeRetries]);

  return <Toast visible={toastVisible} message={toastMessage} />;
}
