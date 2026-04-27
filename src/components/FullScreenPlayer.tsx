import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import Slider from '@react-native-community/slider';
import CoverArt from './CoverArt';
import {getCoverArtUrl} from '../api/client';
import HeartIcon from './icons/HeartIcon';
import TrackPlayer, {useActiveTrack, usePlaybackState, useProgress, State} from 'react-native-track-player';
import FastImage from '@d11/react-native-fast-image';
import {usePlayerStore, type RepeatModeUI as RepeatMode} from '../store/playerStore';
import {darkTheme} from '../theme';
import {formatTime} from '../utils/colorUtils';
import {seekTo, skipNext, skipPrev, skipPrevForce} from '../services/playerActions';
import {useNavigation} from '@react-navigation/native';
import TextTicker from 'react-native-text-ticker';
import {useSettingsStore} from '../store/settingsStore';
import WaveformScrubber from './WaveformScrubber';
import QueueSheet from './QueueSheet';
import AddToPlaylistSheet from './AddToPlaylistSheet';
import Toast from './Toast';
import {t} from '../i18n/fr';

const {width: SW, height: SH} = Dimensions.get('window');
const COVER_SIZE = Math.min(SW - 48, SH * 0.4);
const SLOT_W = SW - 48;
const HIT = {top: 12, bottom: 12, left: 12, right: 12};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M6 9 L12 15 L18 9"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function DotsMenuIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.5} fill="#fff" />
      <Circle cx={12} cy={12} r={1.5} fill="#fff" />
      <Circle cx={19} cy={12} r={1.5} fill="#fff" />
    </Svg>
  );
}

function ShuffleIcon({active}: {active: boolean}) {
  const col = active ? darkTheme.accent : 'rgba(255,255,255,0.7)';
  return (
    <View style={{alignItems: 'center'}}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path 
          d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" 
          stroke={col} 
          strokeWidth={2} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
        />
      </Svg>
      {active && <View style={styles.activeDot} />}
    </View>
  );
}

function PrevIcon({size = 32}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="#fff">
      <Path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z" />
    </Svg>
  );
}

function NextIcon({size = 32}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="#fff">
      <Path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.106A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z" />
    </Svg>
  );
}

function BigPlayIcon({size = 64}: {size?: number}) {
  return (
    <View style={{width: size, height: size, borderRadius: size/2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="#000">
        <Path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" />
      </Svg>
    </View>
  );
}

function BigPauseIcon({size = 64}: {size?: number}) {
  return (
    <View style={{width: size, height: size, borderRadius: size/2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="#000">
        <Path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z" />
      </Svg>
    </View>
  );
}

function RepeatIcon({mode}: {mode: RepeatMode}) {
  const active = mode !== 'none';
  const col = active ? darkTheme.accent : 'rgba(255,255,255,0.7)';
  return (
    <View style={{alignItems: 'center'}}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
          stroke={col}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {mode === 'one' && (
          <Path 
            d="M11 10h1v4" 
            stroke={col} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
        )}
      </Svg>
      {active && <View style={styles.activeDot} />}
    </View>
  );
}

function DevicesIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="#fff" strokeWidth={2} fill="none" />
      <Path d="M8 21h8M12 17v4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M4 12 V20 A2 2 0 0 0 6 22 H18 A2 2 0 0 0 20 20 V12"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M16 6 L12 2 L8 6"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M12 2 L12 15" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function QueueIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M3 6 H21" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 12 H21" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 18 H15" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Ambient Background ───────────────────────────────────────────────────────

function AmbientBackground({coverArtId}: {coverArtId?: string}) {
  if (!coverArtId) {
    return <View style={[StyleSheet.absoluteFill, {backgroundColor: '#121212'}]} />;
  }
  const imageUrl = getCoverArtUrl(coverArtId, 600);
  return (
    <View style={[StyleSheet.absoluteFill, {backgroundColor: '#121212', overflow: 'hidden'}]}>
      <Image
        source={{uri: imageUrl}}
        style={[StyleSheet.absoluteFill, {transform: [{scale: 1.5}]}]}
        blurRadius={90}
      />
      <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.55)'}]} />
      <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(18,18,18,0.3)'}]} />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FullScreenPlayer() {
  const navigation = useNavigation<any>();
  // RNTP native hooks — react directly to native engine
  const currentTrack = useActiveTrack();
  const {state} = usePlaybackState();
  const isPlaying = state === State.Playing;
  const {position} = useProgress();
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const isFullScreenOpen = usePlayerStore(s => s.isFullScreenOpen);
  const likedSongIds = usePlayerStore(s => s.likedSongIds);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const playlistSongIds = usePlayerStore(s => s.playlistSongIds);
  const currentPlaylistName = usePlayerStore(s => s.currentPlaylistName);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const cycleRepeat = usePlayerStore(s => s.cycleRepeat);
  const closeFullScreen = usePlayerStore(s => s.closeFullScreen);
  const toggleLike = usePlayerStore(s => s.toggleLike);

  const fspTrackId = currentTrack?.id ? String(currentTrack.id) : '';
  const isLiked = fspTrackId ? (localLikeOverrides[fspTrackId] ?? likedSongIds.has(fspTrackId)) : false;
  const useWaveformScrubber = useSettingsStore(s => s.useWaveformScrubber);

  const activeIndexRef = useRef<number | undefined>(undefined);
  const queueLengthRef = useRef<number>(0);
  const repeatModeRef = useRef(repeatMode);
  const isSwipingRef = useRef(false);
  useEffect(() => {
    Promise.all([
      TrackPlayer.getActiveTrackIndex(),
      TrackPlayer.getQueue(),
    ]).then(([idx, queue]) => {
      activeIndexRef.current = idx;
      queueLengthRef.current = queue.length;
    }).catch(() => {});
  }, [currentTrack?.id]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  const translateY = useRef(new Animated.Value(SH)).current;
  const [visible, setVisible] = useState(false);
  const coverScale = useRef(new Animated.Value(0.88)).current;
  const carouselX = useRef(new Animated.Value(-SLOT_W)).current;
  const [carouselCovers, setCarouselCovers] = useState<{prevId?: string; currId?: string; nextId?: string}>({currId: currentTrack?.coverArt ?? undefined});
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);
  const inPlaylist = fspTrackId ? playlistSongIds.has(fspTrackId) : false;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleToggleLike = useCallback(() => {
    if (!fspTrackId) return;
    const wasLiked = localLikeOverrides[fspTrackId] ?? likedSongIds.has(fspTrackId);
    toggleLike(fspTrackId).then(success => {
      if (success) {
        showToast(wasLiked ? t.likes.removedFromLiked : t.likes.addedToLiked);
      }
      // false = pending retry, LikeRetryManager handles the toast
    });
  }, [fspTrackId, localLikeOverrides, likedSongIds, toggleLike, showToast]);

  // Load carousel covers + prefetch adjacent tracks
  useEffect(() => {
    if (!currentTrack?.id) return;
    TrackPlayer.getQueue().then(queue => {
      const idx = queue.findIndex(t => String(t.id) === String(currentTrack.id));
      if (idx === -1) return;
      const prevT = idx > 0 ? queue[idx - 1] : undefined;
      const nextT = idx < queue.length - 1 ? queue[idx + 1] : undefined;
      setCarouselCovers({
        prevId: prevT?.coverArt ? String(prevT.coverArt) : undefined,
        currId: currentTrack.coverArt ? String(currentTrack.coverArt) : undefined,
        nextId: nextT?.coverArt ? String(nextT.coverArt) : undefined,
      });
      const coverUris: {uri: string; priority: typeof FastImage.priority.normal}[] = [];
      for (const t of [prevT, nextT]) {
        if (!t) continue;
        if (t.coverArt) coverUris.push({uri: getCoverArtUrl(String(t.coverArt), 600), priority: FastImage.priority.high});
        if (typeof t.artwork === 'string' && t.artwork) coverUris.push({uri: t.artwork, priority: FastImage.priority.high});
        if (t.url) fetch(String(t.url), {headers: {Range: 'bytes=0-65535'}}).catch(() => {});
      }
      if (coverUris.length > 0) FastImage.preload(coverUris);
    }).catch(() => {});
  }, [currentTrack?.id, currentTrack?.coverArt]);

  // Queue sheet
  const [queueVisible, setQueueVisible] = useState(false);
  const queueSlideY = useRef(new Animated.Value(SH)).current;

  const coverPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
          carouselX.setValue(-SLOT_W + gs.dx);
        } else if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || (gs.vy > 0.8 && Math.abs(gs.dy) > Math.abs(gs.dx))) {
          handleClose();
        } else if (gs.dx < -40 || (gs.vx < -0.5 && Math.abs(gs.dx) > Math.abs(gs.dy))) {
          const atEnd = activeIndexRef.current !== undefined &&
            queueLengthRef.current > 0 &&
            activeIndexRef.current === queueLengthRef.current - 1;
          const noRepeat = repeatModeRef.current === 'none';
          if (isSwipingRef.current || (atEnd && noRepeat)) {
            Animated.spring(carouselX, {toValue: -SLOT_W, friction: 7, tension: 80, useNativeDriver: true}).start();
            Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
            return;
          }
          Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
          handleSwipeTo('next');
        } else if (gs.dx > 40 || (gs.vx > 0.5 && Math.abs(gs.dx) > Math.abs(gs.dy))) {
          const atStart = activeIndexRef.current === 0;
          const noRepeat = repeatModeRef.current === 'none';
          if (isSwipingRef.current || (atStart && noRepeat)) {
            Animated.spring(carouselX, {toValue: -SLOT_W, friction: 7, tension: 80, useNativeDriver: true}).start();
            Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
            return;
          }
          Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
          handleSwipeTo('prev');
        } else {
          Animated.spring(carouselX, {toValue: -SLOT_W, friction: 7, tension: 80, useNativeDriver: true}).start();
          Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isFullScreenOpen) {
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isFullScreenOpen, translateY]);

  useEffect(() => {
    Animated.spring(coverScale, {
      toValue: isPlaying ? 1 : 0.88,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, coverScale]);

  const handleClose = useCallback(() => {
    // Close queue if open
    setQueueVisible(false);
    queueSlideY.setValue(SH);
    Animated.timing(translateY, {
      toValue: SH,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      closeFullScreen();
    });
  }, [translateY, queueSlideY, closeFullScreen]);

  const handleSwipeTo = useCallback((direction: 'next' | 'prev') => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    const targetX = direction === 'next' ? -2 * SLOT_W : 0;
    Animated.timing(carouselX, {
      toValue: targetX,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      carouselX.setValue(-SLOT_W);
      if (direction === 'next') skipNext();
      else skipPrevForce();
      isSwipingRef.current = false;
    });
  }, [carouselX]);

  const onArtistPress = useCallback((name: string, id?: string) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate('Main', {
        screen: 'Library',
        params: {
          screen: 'ArtistDetail',
          params: id ? {artistId: id} : {artistName: name},
        },
      } as any);
    }, 300);
  }, [handleClose, navigation]);

  const openQueue = useCallback(() => {
    setQueueVisible(true);
    queueSlideY.setValue(SH);
    Animated.timing(queueSlideY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [queueSlideY]);

  const closeQueue = useCallback(() => {
    Animated.timing(queueSlideY, {
      toValue: SH,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setQueueVisible(false));
  }, [queueSlideY]);

  if (!currentTrack) return null;

  const dur = currentTrack.duration ?? 1;
  const displayProgress = isSeeking ? seekValue : position;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, {transform: [{translateY}]}]}>

        {/* ── Ambient Halo Background ── */}
        <AmbientBackground key={currentTrack.coverArt ?? ''} coverArtId={currentTrack.coverArt} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={HIT}>
              <ChevronDownIcon />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerSub}>{t.playlistDetail.contextLabel}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {currentPlaylistName || currentTrack.album || t.library.title}
              </Text>
            </View>
            <TouchableOpacity hitSlop={HIT}>
              <DotsMenuIcon />
            </TouchableOpacity>
          </View>

          {/* ── Cover Art Carousel ── */}
          <View style={styles.coverSection}>
            <Animated.View style={[styles.carouselTrack, {transform: [{translateX: carouselX}]}]}>
              <View style={styles.coverSlot}>
                <View style={styles.coverWrapper}>
                  <CoverArt id={carouselCovers.prevId} size={COVER_SIZE} borderRadius={8} />
                </View>
              </View>
              <View style={styles.coverSlot}>
                <Animated.View style={[styles.coverWrapper, {transform: [{scale: coverScale}]}]}>
                  <CoverArt id={carouselCovers.currId} size={COVER_SIZE} borderRadius={8} />
                </Animated.View>
              </View>
              <View style={styles.coverSlot}>
                <View style={styles.coverWrapper}>
                  <CoverArt id={carouselCovers.nextId} size={COVER_SIZE} borderRadius={8} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Invisible full-width overlay to capture swipe gestures on cover area */}
          <View
            {...coverPan.panHandlers}
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              height: COVER_SIZE + 60,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.01)',
            }}
          />

          {/* ── Track Info + Like ── */}
          <View style={styles.infoRow}>
            <View style={styles.infoText}>
            <TextTicker
              style={styles.trackTitle}
              duration={8000}
              loop
              bounce={false}
              repeatSpacer={50}
              marqueeDelay={2000}>
              {currentTrack.title}
            </TextTicker>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {(currentTrack.artist ?? '')
                .split(/,\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)
                .map((name, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && ', '}
                    <Text
                      onPress={() => onArtistPress(name.trim(), i === 0 ? currentTrack.artistId : undefined)}
                      suppressHighlighting>
                      {name.trim()}
                    </Text>
                  </React.Fragment>
                ))}
            </Text>
          </View>
          <View style={styles.infoActions}>
            <TouchableOpacity
              onPress={() => setPlaylistSheetOpen(true)}
              hitSlop={HIT}>
              <Svg width={26} height={26} viewBox="0 0 26 26">
                {inPlaylist ? (
                  <>
                    <Circle cx={13} cy={13} r={12} fill="#1ED760" />
                    <Path d="M7.5 13.5 L11 17 L18.5 9.5" stroke="#000" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </>
                ) : (
                  <>
                    <Circle cx={13} cy={13} r={11.5} stroke="#B3B3B3" strokeWidth={1.5} fill="none" />
                    <Path d="M13 8 L13 18 M8 13 L18 13" stroke="#B3B3B3" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                  </>
                )}
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleLike} hitSlop={HIT}>
              <HeartIcon
                size={26}
                color={isLiked ? '#E8553E' : 'rgba(255,255,255,0.6)'}
                filled={isLiked}
              />
            </TouchableOpacity>
          </View>
          </View>

          {/* ── Progress ── */}
          {useWaveformScrubber ? (
            <WaveformScrubber
              trackId={currentTrack.id}
              duration={dur}
              currentTime={displayProgress}
              onSeek={seekTo}
            />
          ) : (
            <View style={styles.sliderSection}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={dur}
                value={displayProgress}
                onValueChange={v => {
                  setIsSeeking(true);
                  setSeekValue(v);
                }}
                onSlidingComplete={v => {
                  setIsSeeking(false);
                  seekTo(v);
                }}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FFFFFF"
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(displayProgress)}</Text>
                <Text style={styles.timeText}>{formatTime(dur)}</Text>
              </View>
            </View>
          )}

          {/* ── Main Controls ── */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleShuffle} hitSlop={HIT}>
              <ShuffleIcon active={isShuffled} />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipPrev} hitSlop={HIT}>
              <PrevIcon />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlay} style={styles.bigPlayBtn}>
              {isPlaying ? <BigPauseIcon /> : <BigPlayIcon />}
            </TouchableOpacity>

            <TouchableOpacity onPress={skipNext} hitSlop={HIT}>
              <NextIcon />
            </TouchableOpacity>

            <TouchableOpacity onPress={cycleRepeat} hitSlop={HIT}>
              <RepeatIcon mode={repeatMode} />
            </TouchableOpacity>
          </View>

          {/* ── Secondary Bar ── */}
          <View style={styles.secondaryBar}>
            <TouchableOpacity hitSlop={HIT}>
              <DevicesIcon />
            </TouchableOpacity>
            <View style={styles.secondaryRight}>
              <TouchableOpacity hitSlop={HIT}>
                <ShareIcon />
              </TouchableOpacity>
              <TouchableOpacity hitSlop={HIT} style={{marginLeft: 24}} onPress={openQueue}>
                <QueueIcon />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Lyrics Peek ── */}
          <View style={styles.lyricsCard}>
            <Text style={styles.lyricsTitle}>{t.fullScreenPlayer.lyricsTitle}</Text>
            <Text style={styles.lyricsText} numberOfLines={2}>
              {'I, I did it all\nI, I did it all\nI owned every second that this world could give'}
            </Text>
          </View>

        </SafeAreaView>

        {/* ── Queue Sheet ── */}
        <QueueSheet
          visible={queueVisible}
          onClose={closeQueue}
          slideY={queueSlideY}
        />

        <AddToPlaylistSheet
          visible={playlistSheetOpen}
          onClose={() => setPlaylistSheetOpen(false)}
          trackId={currentTrack?.id != null ? String(currentTrack.id) : undefined}
          trackTitle={currentTrack?.title}
          onToast={showToast}
        />

        <Toast visible={toastVisible} message={toastMessage} />

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    height: 48,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },

  // Cover
  coverSection: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  carouselTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverSlot: {
    width: SLOT_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrapper: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
    borderRadius: 8,
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginRight: 12,
  },
  infoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },

  // Slider
  sliderSection: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginHorizontal: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 12,
  },
  bigPlayBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Secondary
  secondaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  secondaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Repeat / Shuffle dots
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkTheme.accent,
    marginTop: 4,
    alignSelf: 'center',
  },
  repeatOneLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '900',
    top: 7,
    left: 7,
  },

  // Lyrics
  lyricsCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
  },
  lyricsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  lyricsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
    lineHeight: 22,
  },

});
