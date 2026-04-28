import React, {useCallback, useRef, useState} from 'react';
import {Animated, Easing, PanResponder, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {useActiveTrack, usePlaybackState, useProgress, State} from 'react-native-track-player';
import CoverArt from './CoverArt';
import HeartIcon from './icons/HeartIcon';
import AddToPlaylistSheet from './AddToPlaylistSheet';
import Toast from './Toast';
import TextTicker from 'react-native-text-ticker';
import {usePlayerStore} from '../store/playerStore';
import {skipNext, skipPrevForce} from '../services/playerActions';
import {blendWithBlack} from '../utils/colorUtils';
import {darkTheme} from '../theme';
import {useT} from '../i18n';

const TAB_BAR_HEIGHT = 60;

function PlayIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M6 4 L20 12 L6 20 Z" fill="#fff" />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x={5} y={4} width={4} height={16} rx={1.5} fill="#fff" />
      <Rect x={15} y={4} width={4} height={16} rx={1.5} fill="#fff" />
    </Svg>
  );
}

function CheckCircleGreen() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={12} fill="#1ED760" />
      <Path
        d="M7.5 13.5 L11 17 L18.5 9.5"
        stroke="#000"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PlusCircleOutline() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle
        cx={13}
        cy={13}
        r={11.5}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d="M13 8 L13 18 M8 13 L18 13"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export default function MiniPlayer() {
  const t = useT();
  // RNTP native hooks — react directly to native engine
  const currentTrack = useActiveTrack();
  const {state} = usePlaybackState();
  const {position} = useProgress();
  const isPlaying = state === State.Playing;

  // UI-only store state
  const likedSongIds = usePlayerStore(s => s.likedSongIds);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const playlistSongIds = usePlayerStore(s => s.playlistSongIds);
  const dominantColor = usePlayerStore(s => s.dominantColor);
  const isMiniPlayerVisible = usePlayerStore(s => s.isMiniPlayerVisible);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const toggleLike = usePlayerStore(s => s.toggleLike);
  const openFullScreen = usePlayerStore(s => s.openFullScreen);

  const trackId = currentTrack?.id ? String(currentTrack.id) : '';
  const isLiked = trackId ? (localLikeOverrides[trackId] ?? likedSongIds.has(trackId)) : false;
  const inPlaylist = trackId ? playlistSongIds.has(trackId) : false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverSlide = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleToggleLike = useCallback(() => {
    if (!trackId) return;
    const wasLiked = localLikeOverrides[trackId] ?? likedSongIds.has(trackId);
    toggleLike(trackId).then(success => {
      if (success) {
        showToast(wasLiked ? t.likes.removedFromLiked : t.likes.addedToLiked);
      }
      // false = pending retry, LikeRetryManager handles the toast
    });
  }, [trackId, localLikeOverrides, likedSongIds, toggleLike, showToast, t]);

  const handleMiniSwipe = (direction: 'next' | 'prev') => {
    const exitX = direction === 'next' ? -52 : 52;
    const enterX = direction === 'next' ? 52 : -52;
    Animated.timing(coverSlide, {
      toValue: exitX,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'next') skipNext();
      else skipPrevForce();
      coverSlide.setValue(enterX);
      Animated.spring(coverSlide, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });
  };

  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50 || gs.vx < -0.4) handleMiniSwipe('next');
        else if (gs.dx > 50 || gs.vx > 0.4) handleMiniSwipe('prev');
      },
    }),
  ).current;

  if (!isMiniPlayerVisible || !currentTrack?.id) return null;

  const dur = currentTrack.duration ?? 1;
  const progressFraction = Math.min(position / dur, 1);
  const bgColor = blendWithBlack(dominantColor, 0.45);

  return (
    <>
      <View
        style={[
          styles.container,
          {bottom: TAB_BAR_HEIGHT + 8, backgroundColor: bgColor},
        ]}
        {...swipePan.panHandlers}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {width: `${progressFraction * 100}%`},
            ]}
          />
        </View>

        <View style={styles.inner}>
          <TouchableOpacity onPress={openFullScreen} activeOpacity={0.8}>
            <Animated.View style={{transform: [{translateX: coverSlide}]}}>
              <CoverArt id={currentTrack.coverArt as string | undefined} size={48} borderRadius={4} />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.info}
            onPress={openFullScreen}
            activeOpacity={0.7}>
            <TextTicker
              style={styles.title}
              duration={8000}
              loop
              bounce={false}
              repeatSpacer={50}
              marqueeDelay={2000}>
              {currentTrack.title ?? ''}
            </TextTicker>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist ?? ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleToggleLike}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <HeartIcon
                size={22}
                color={isLiked ? '#E8553E' : '#fff'}
                filled={isLiked}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSheetOpen(true)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              {inPlaylist ? <CheckCircleGreen /> : <PlusCircleOutline />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AddToPlaylistSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        trackId={currentTrack.id}
        trackTitle={currentTrack.title ?? ''}
        onToast={showToast}
      />

      <Toast visible={toastVisible} message={toastMessage} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: 2,
    backgroundColor: darkTheme.accent,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 6,
  },
});
