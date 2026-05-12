/**
 * @file FullScreenPlayer.tsx
 * @description Full-screen music player. Ambient halo background (blurred cover),
 *   animated cover art, waveform scrubber, playback controls, lyrics preview,
 *   and queue access.
 * @author DoodzProg
 * @version 1.0.0
 * @license CC-BY-NC-4.0
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import Slider from '@react-native-community/slider';
import CoverArt from './CoverArt';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PrevIcon from './icons/PrevIcon';
import NextIcon from './icons/NextIcon';
import RepeatIcon from './icons/RepeatIcon';
import ShuffleIcon from './icons/ShuffleIcon';
import {getCoverArtUrl} from '../api/client';
import HeartIcon from './icons/HeartIcon';
import TrackMagicIcon from './icons/TrackMagicIcon';
import TrackPlayer, {useActiveTrack, usePlaybackState, useProgress, State} from 'react-native-track-player';
import FastImage from '@d11/react-native-fast-image';
import {usePlayerStore} from '../store/playerStore';
import {usePlaylistCacheStore} from '../store/playlistCacheStore';
import {formatTime} from '../utils/colorUtils';
import {seekTo, skipNext, skipPrev} from '../services/playerActions';
import {useDownloadStore} from '../store/downloadStore';
import {useNavigation} from '@react-navigation/native';
import TextTicker from 'react-native-text-ticker';
import {useSettingsStore} from '../store/settingsStore';
import WaveformScrubber from './WaveformScrubber';
import QueueSheet from './QueueSheet';
import AddToPlaylistSheet from './AddToPlaylistSheet';
import SongOptionsSheet from './SongOptionsSheet';
import LyricsScreen from './LyricsScreen';
import Toast from './Toast';
import {useT, getT} from '../i18n';
import type {SubsonicSong} from '../api/types';
import {getLyricsBySongId, type LyricsData} from '../api/endpoints/library';

const {width: SW, height: SH} = Dimensions.get('window');
const COVER_SIZE = Math.min(SW - 64, SH * 0.36);
const HIT = {top: 12, bottom: 12, left: 12, right: 12};

// ─── Icons ────────────────────────────────────────────────────────────────────

function BigPlayIcon({size = 64}: {size?: number}) {
  const circleStyle = {width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff' as const, alignItems: 'center' as const, justifyContent: 'center' as const};
  return (
    <View style={circleStyle}>
      <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="#000">
        <Path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" />
      </Svg>
    </View>
  );
}

function BigPauseIcon({size = 64}: {size?: number}) {
  const circleStyle = {width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff' as const, alignItems: 'center' as const, justifyContent: 'center' as const};
  return (
    <View style={circleStyle}>
      <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="#000">
        <Path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z" />
      </Svg>
    </View>
  );
}

function QueueIcon({color = '#fff', size = 24}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="5" rx="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="M4 14.5 H20 M4 19.5 H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CoverDownloadIcon({trackId, size = 28}: {trackId: string; size?: number}) {
  const isDownloaded = useDownloadStore(s => trackId in s.downloads);
  const isDownloading = useDownloadStore(s => {
    const a = s.activeDownloads[trackId];
    return a != null && (a.status === 'queued' || a.status === 'downloading');
  });
  const color = isDownloaded ? '#1ED760' : '#B3B3B3';

  if (isDownloading) {
    return (
      <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="small" color="#1ED760" />
      </View>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
      <Path
        d="M12 7 V14 M9 12 L12 15 L15 12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Ambient Background ───────────────────────────────────────────────────────

function AmbientBackground({coverArtId}: {coverArtId?: string}) {
  if (!coverArtId) {
    return <View style={[StyleSheet.absoluteFill, styles.ambientBg]} />;
  }
  const imageUrl = getCoverArtUrl(coverArtId, 600);
  return (
    <View style={[StyleSheet.absoluteFill, styles.ambientBgClip]}>
      <Image
        source={{uri: imageUrl}}
        style={[StyleSheet.absoluteFill, styles.ambientImg]}
        blurRadius={90}
      />
      <View style={[StyleSheet.absoluteFill, styles.ambientOverlay1]} />
      <View style={[StyleSheet.absoluteFill, styles.ambientOverlay2]} />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FullScreenPlayer() {
  const t = useT();
  const navigation = useNavigation<any>();
  // RNTP native hooks — react directly to native engine
  const currentTrack = useActiveTrack();
  const {state} = usePlaybackState();
  const isPlaying = state === State.Playing;
  const {position} = useProgress();
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const shuffleMode = usePlayerStore(s => s.shuffleMode);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const isFullScreenOpen = usePlayerStore(s => s.isFullScreenOpen);
  const likedSongIds = usePlayerStore(s => s.likedSongIds);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const savedSet = usePlaylistCacheStore(s => s.savedSet);
  const currentPlaylistName = usePlayerStore(s => s.currentPlaylistName);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const isFetchingMagic = usePlayerStore(s => s.isFetchingMagic);
  const cycleRepeat = usePlayerStore(s => s.cycleRepeat);
  const closeFullScreen = usePlayerStore(s => s.closeFullScreen);
  const toggleLike = usePlayerStore(s => s.toggleLike);

  const fspTrackId = currentTrack?.id ? String(currentTrack.id) : '';
  const currentTrackAsSong: SubsonicSong | null = currentTrack ? {
    id: String(currentTrack.id),
    title: currentTrack.title ?? '',
    artist: currentTrack.artist ?? '',
    artistId: (currentTrack as any).artistId ? String((currentTrack as any).artistId) : undefined,
    album: currentTrack.album ?? '',
    albumId: (currentTrack as any).albumId ? String((currentTrack as any).albumId) : undefined,
    coverArt: currentTrack.coverArt ? String(currentTrack.coverArt) : undefined,
    duration: currentTrack.duration ?? 0,
  } : null;
  const isLiked = fspTrackId ? (localLikeOverrides[fspTrackId] ?? likedSongIds.has(fspTrackId)) : false;
  const useWaveformScrubber = useSettingsStore(s => s.useWaveformScrubber);
  const isOfflineMode = useSettingsStore(s => s.isOfflineMode);
  const setShuffleMode = usePlayerStore(s => s.setShuffleMode);


  // Background lyrics pre-fetch — undefined=loading (hides card), null=no lyrics, data=ready.
  useEffect(() => {
    if (!currentTrack?.id) { setLyricsData(null); return; }
    setLyricsData(undefined);
    let cancelled = false;
    getLyricsBySongId(
      String(currentTrack.id),
      currentTrack.artist,
      currentTrack.title,
      currentTrack.duration,
    ).then(data => { if (!cancelled) setLyricsData(data); })
     .catch(() => { if (!cancelled) setLyricsData(null); });
    return () => { cancelled = true; };
  }, [currentTrack?.id, currentTrack?.artist, currentTrack?.title, currentTrack?.duration]);

  const translateY = useRef(new Animated.Value(SH)).current;
  const [visible, setVisible] = useState(false);
  const coverScale = useRef(new Animated.Value(0.88)).current;
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);
  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | undefined>(undefined);
  const [lyricsVisible, setLyricsVisible] = useState(false);
  const inPlaylist = fspTrackId ? savedSet.has(fspTrackId) : false;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        showToast(wasLiked ? getT().likes.removedFromLiked : getT().likes.addedToLiked);
      }
      // false = pending retry, LikeRetryManager handles the toast
    });
  }, [fspTrackId, localLikeOverrides, likedSongIds, toggleLike, showToast]);

  const handleDownloadPress = useCallback(() => {
    if (!fspTrackId || !currentTrackAsSong) return;
    if (useDownloadStore.getState().isDownloaded(fspTrackId)) {
      const d = getT();
      Alert.alert(
        d.downloads.deleteSongTitle,
        d.downloads.deleteSongMessage(currentTrackAsSong.title),
        [
          {text: d.downloads.cancelButton, style: 'cancel'},
          {
            text: d.downloads.deleteConfirm,
            style: 'destructive',
            onPress: () => useDownloadStore.getState().deleteDownload(fspTrackId),
          },
        ],
      );
      return;
    }
    useDownloadStore.getState().enqueueTrack(currentTrackAsSong);
  }, [fspTrackId, currentTrackAsSong]);

  // Prefetch adjacent cover art and audio chunk for seamless transitions
  useEffect(() => {
    if (!currentTrack?.id) return;
    TrackPlayer.getQueue().then(queue => {
      const idx = queue.findIndex(qt => String(qt.id) === String(currentTrack.id));
      if (idx === -1) return;
      const prevT = idx > 0 ? queue[idx - 1] : undefined;
      const nextT = idx < queue.length - 1 ? queue[idx + 1] : undefined;
      const coverUris: Array<{uri: string; priority: 'low' | 'normal' | 'high'}> = [];
      for (const adj of [prevT, nextT]) {
        if (!adj) continue;
        if (adj.coverArt) coverUris.push({uri: getCoverArtUrl(String(adj.coverArt), 600), priority: FastImage.priority.high});
        if (typeof adj.artwork === 'string' && adj.artwork) coverUris.push({uri: adj.artwork, priority: FastImage.priority.high});
        if (adj.url) fetch(String(adj.url), {headers: {Range: 'bytes=0-65535'}}).catch(() => {});
      }
      if (coverUris.length > 0) FastImage.preload(coverUris);
    }).catch(() => {});
  }, [currentTrack?.id, currentTrack?.coverArt]);

  // Queue sheet
  const [queueVisible, setQueueVisible] = useState(false);
  const queueSlideY = useRef(new Animated.Value(SH)).current;


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

  const handleNavigateAlbumFromPlayer = useCallback((albumId: string) => {
    setSongOptionsVisible(false);
    handleClose();
    setTimeout(() => {
      navigation.navigate('Main', {
        screen: 'Library',
        params: {screen: 'AlbumDetail', params: {albumId}},
      } as any);
    }, 350);
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

  // Current active lyrics line shown in the preview card.
  const lyricsPreview = (() => {
    if (!lyricsData?.lines.length) return '';
    const posMs = position * 1000;
    let idx = 0;
    if (lyricsData.synced) {
      for (let i = 0; i < lyricsData.lines.length; i++) {
        if ((lyricsData.lines[i].start ?? 0) <= posMs) { idx = i; }
        else break;
      }
    }
    return lyricsData.lines[idx].value;
  })();
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
            <TouchableOpacity hitSlop={HIT} onPress={() => setSongOptionsVisible(true)}>
              <DotsHorizontalIcon size={24} />
            </TouchableOpacity>
          </View>

          {/* ── Cover Art ── */}
          <View style={styles.coverSection}>
            <View style={styles.coverCenter}>
              <Animated.View style={[styles.coverWrapper, {transform: [{scale: coverScale}]}]}>
                <CoverArt id={currentTrack.coverArt} size={COVER_SIZE} borderRadius={8} />
              </Animated.View>
              {!fspTrackId.startsWith('ext-') && currentTrackAsSong && (
                <TouchableOpacity
                  style={styles.coverDownloadBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  activeOpacity={0.7}
                  onPress={handleDownloadPress}>
                  <CoverDownloadIcon trackId={fspTrackId} size={28} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Track Info + Like ── */}
          <View style={styles.infoRow}>
            <View style={styles.infoText}>
              {(currentTrack as any).isMagic && (
                <View style={styles.magicBadge}>
                  <TrackMagicIcon size={22} />
                </View>
              )}
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
              <TouchableOpacity hitSlop={HIT} onPress={openQueue}>
                <QueueIcon />
              </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => {
                if (isOfflineMode && shuffleMode === 'on') { setShuffleMode('off'); return; }
                toggleShuffle();
              }}
              hitSlop={HIT}
              disabled={isFetchingMagic}
              style={isFetchingMagic ? {opacity: 0.5} : undefined}>
              {isFetchingMagic
                ? <ActivityIndicator size="small" color="#fff" />
                : <ShuffleIcon mode={shuffleMode} />}
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

          {/* ── Lyrics Peek — always visible; clickable only when lyrics are loaded ── */}
          <TouchableOpacity
            style={styles.lyricsCard}
            onPress={() => setLyricsVisible(true)}
            activeOpacity={lyricsData && lyricsData.lines.length > 0 ? 0.75 : 1}
            disabled={!lyricsData || lyricsData.lines.length === 0}>
            <Text style={styles.lyricsTitle}>{t.fullScreenPlayer.lyricsTitle}</Text>
            {lyricsData === undefined ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={styles.lyricsLoader} />
            ) : lyricsData === null ? (
              <Text style={styles.lyricsTextDim}>{t.lyricsScreen.noLyrics}</Text>
            ) : (
              <Text style={styles.lyricsText} numberOfLines={1}>{lyricsPreview}</Text>
            )}
          </TouchableOpacity>

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

        <SongOptionsSheet
          visible={songOptionsVisible}
          onClose={() => setSongOptionsVisible(false)}
          track={currentTrackAsSong}
          onToast={showToast}
          onNavigateAlbum={handleNavigateAlbumFromPlayer}
          onNavigateArtist={(id, name) => { setSongOptionsVisible(false); onArtistPress(name, id); }}
        />

        <LyricsScreen
          visible={lyricsVisible}
          onClose={() => setLyricsVisible(false)}
          lyrics={lyricsData ?? null}
          coverArtId={currentTrack?.coverArt ? String(currentTrack.coverArt) : undefined}
        />

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
  ambientBg: {backgroundColor: '#121212'},
  ambientBgClip: {backgroundColor: '#121212', overflow: 'hidden'},
  ambientImg: {transform: [{scale: 1.5}]},
  ambientOverlay1: {backgroundColor: 'rgba(0,0,0,0.55)'},
  ambientOverlay2: {backgroundColor: 'rgba(18,18,18,0.3)'},
  coverCenter: {
    position: 'relative',
    width: COVER_SIZE,
    height: COVER_SIZE,
  },
  coverDownloadBtn: {
    position: 'absolute',
    bottom: -12,
    right: -12,
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
    height: COVER_SIZE + 24,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 6,
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
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginRight: 16,
  },
  infoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 16,
  },
  magicBadge: {
    position: 'absolute',
    top: -8,
    left: 0,
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
    marginTop: 4,
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
    marginTop: 8,
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
  lyricsLoader: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  lyricsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
    lineHeight: 22,
  },
  lyricsTextDim: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 6,
    fontStyle: 'italic',
  },

});
