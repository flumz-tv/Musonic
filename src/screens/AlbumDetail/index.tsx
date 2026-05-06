/**
 * @file index.tsx
 * @description Album detail screen. Shows cover art, track listing, artist info,
 *   and playback controls for a specific album. Supports shuffle, star/unstar,
 *   and animated parallax header.
 * @author DoodzProg
 * @version 1.0.0
 * @license MIT
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Svg, {Circle, Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {darkTheme} from '../../theme';
import CoverArt from '../../components/CoverArt';
import {showToast} from '../../components/Toast';
import HeartIcon from '../../components/icons/HeartIcon';
import ShuffleIcon from '../../components/icons/ShuffleIcon';
import SongOptionsSheet from '../../components/SongOptionsSheet';
import AlbumOptionsSheet from '../../components/AlbumOptionsSheet';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';
import {useActiveTrack} from 'react-native-track-player';
import TrackPlayer from 'react-native-track-player';
import {loadAndPlayAlbum, loadAndPlayTracks, syncUpcomingFromRNTP} from '../../services/playerActions';
import {usePlayerStore} from '../../store/playerStore';
import {usePlaylistCacheStore} from '../../store/playlistCacheStore';
import {colorFromId} from '../../utils/colorUtils';
import type {SubsonicSong} from '../../api/types';
import type {LibraryStackParams} from '../../navigation/types';
import type {Track} from '../../store/playerStore';
import {subsonicGet, getCoverArtUrl, getStreamUrl} from '../../api/client';
import {getArtistImage} from '../../api/deezer';
import {useT, getT} from '../../i18n';
import BackArrowIcon from '../../components/icons/BackArrowIcon';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const COVER_SIZE = Math.min(SCREEN_W - 80, 260);
const TOP_BAR_H = 52;

// ─── Color Extraction ────────────────────────────────────────────────────────
function dominantColorFromBuffer(bytes: Uint8Array): string {
  const len = bytes.length;
  if (len < 100) return '#3D1F0F';
  const samples: [number, number, number][] = [];
  const step = Math.max(3, Math.floor(len / 80));
  for (let i = 128; i < len - 2; i += step) {
    const r = bytes[i]; const g = bytes[i + 1]; const b = bytes[i + 2];
    if (r > 240 && g > 240 && b > 240) continue;
    if (r < 10 && g < 10 && b < 10) continue;
    if (r === 255 && g === 0 && b === 0) continue;
    samples.push([r, g, b]);
  }
  if (samples.length === 0) return '#3D1F0F';
  samples.sort((a, b) => Math.max(...b) - Math.min(...b) - (Math.max(...a) - Math.min(...a)));
  const top = samples.slice(0, Math.max(1, Math.floor(samples.length * 0.25)));
  const avg = top.reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0]).map(v => Math.round(v / top.length));
  const darken = (v: number) => Math.round(v * 0.55);
  const toHex = (v: number) => darken(v).toString(16).padStart(2, '0');
  return `#${toHex(avg[0])}${toHex(avg[1])}${toHex(avg[2])}`;
}

function useAlbumColor(coverArtId?: string): string {
  const [color, setColor] = useState(() => coverArtId ? colorFromId(coverArtId) : '#3D1F0F');
  useEffect(() => {
    if (!coverArtId) return;
    let cancelled = false;
    try {
      const url = getCoverArtUrl(coverArtId, 200);
      fetch(url).then(r => r.arrayBuffer()).then(buf => {
        if (!cancelled) setColor(dominantColorFromBuffer(new Uint8Array(buf)));
      }).catch(() => {});
    } catch {}
    return () => { cancelled = true; };
  }, [coverArtId]);
  return color;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function DownloadIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" /><Path d="M12 7 V14 M9 12 L12 15 L15 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
}
function MoreDotsIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={5} cy={12} r={1.8} fill={color} /><Circle cx={12} cy={12} r={1.8} fill={color} /><Circle cx={19} cy={12} r={1.8} fill={color} /></Svg>);
}
function PlayIcon({size = 22, color = '#000'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M7 4 L21 12 L7 20 Z" fill={color} /></Svg>);
}
function PlusCircleIcon({size = 24, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.6} fill="none" /><Path d="M12 8 V16 M8 12 H16" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>);
}
function CheckCircleGreen({size = 24}: {size?: number}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9.5} stroke="#1ED760" strokeWidth={1.6} fill="rgba(30,215,96,0.12)" /><Path d="M7.5 12 L10.5 15 L16.5 9" stroke="#1ED760" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
}
function ThreeDotsVertIcon({size = 18, color = '#888'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={5} r={1.8} fill={color} /><Circle cx={12} cy={12} r={1.8} fill={color} /><Circle cx={12} cy={19} r={1.8} fill={color} /></Svg>);
}

// ─── Song Row ─────────────────────────────────────────────────────────────────
type SongRowProps = {
  song: SubsonicSong;
  isActive: boolean;
  index: number;
  onPress: () => void;
  onMore: () => void;
  onAddToPlaylist: () => void;
};

function SongRow({song, isActive, index, onPress, onMore, onAddToPlaylist}: SongRowProps) {
  const likedSongIds = usePlayerStore(s => s.likedSongIds);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const toggleLike = usePlayerStore(s => s.toggleLike);
  const savedSet = usePlaylistCacheStore(s => s.savedSet);
  const id = String(song.id);
  const isLiked = localLikeOverrides[id] !== undefined ? localLikeOverrides[id] : likedSongIds.has(id);
  const isInPlaylist = savedSet.has(id);

  return (
    <TouchableOpacity style={styles.songRow} activeOpacity={0.7} onPress={onPress} onLongPress={onMore} delayLongPress={400}>
      <View style={styles.songIndexWrap}>
        <Text style={[styles.songIndex, isActive && {color: darkTheme.accent}]}>{index}</Text>
      </View>
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, isActive && {color: darkTheme.accent}]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <View style={styles.songActions}>
        <TouchableOpacity
          hitSlop={{top: 10, bottom: 10, left: 10, right: 6}}
          onPress={() => toggleLike(id)}>
          <HeartIcon size={20} color={isLiked ? darkTheme.accent : '#444'} filled={isLiked} />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
          onPress={onAddToPlaylist}>
          {isInPlaylist
            ? <CheckCircleGreen size={20} />
            : <PlusCircleIcon size={20} color="#444" />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.songDots}
          hitSlop={{top: 8, bottom: 8, left: 6, right: 8}}
          onPress={onMore}>
          <ThreeDotsVertIcon />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── List Header ──────────────────────────────────────────────────────────────
function AlbumHeader({
  topBarH, coverArtId, albumName, artistName, artistImageUrl, year,
  isShuffled, isStarred, loadingAlbum, coverScale, coverTranslateY,
  onPlay, onShuffle, onToggleStar, onArtistPress, onMorePress,
}: any) {
  const t = useT();
  const [imageError, setImageError] = useState(false);
  return (
    <View>
      <View style={{height: topBarH + 16}} />
      <View style={styles.coverWrap}>
        <Animated.View style={[styles.coverShadow, {transform: [{scale: coverScale}, {translateY: coverTranslateY}]}]}>
          {coverArtId ? (
            <CoverArt id={coverArtId} size={COVER_SIZE} borderRadius={8} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
        </Animated.View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.albumName} numberOfLines={2}>{albumName || '…'}</Text>
        <TouchableOpacity style={styles.metaRow} onPress={onArtistPress} activeOpacity={0.7}>
          <View style={styles.artistAvatar}>
            {artistImageUrl && !imageError ? (
              <Image source={{uri: artistImageUrl}} style={styles.artistAvatarImg} onError={() => setImageError(true)} />
            ) : (
              <Text style={styles.artistAvatarText}>
                {artistName ? artistName.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <Text style={styles.metaArtist} numberOfLines={1}>{artistName || t.artistDetail.unknownArtist}</Text>
        </TouchableOpacity>
        <Text style={styles.metaSub}>Album • {year || t.albumDetail.unknownYear}</Text>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleStar} activeOpacity={0.7}>
            {isStarred ? <CheckCircleGreen size={26} /> : <PlusCircleIcon size={26} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <DownloadIcon size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onMorePress} activeOpacity={0.7}>
            <MoreDotsIcon size={22} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.actionBtn} onPress={onShuffle} activeOpacity={0.7}>
            <ShuffleIcon size={24} active={isShuffled} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={onPlay} activeOpacity={0.85}>
            {loadingAlbum
              ? <ActivityIndicator color="#000" size="small" />
              : <PlayIcon size={28} color="#000" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type RouteT = RouteProp<LibraryStackParams, 'AlbumDetail'>;

export default function AlbumDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParams, 'AlbumDetail'>>();
  const route = useRoute<RouteT>();
  const {albumId} = route.params;

  const [albumName, setAlbumName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistId, setArtistId] = useState<string | undefined>();
  const [artistImageUrl, setArtistImageUrl] = useState<string | undefined>();
  const [year, setYear] = useState<string | number>('');
  const [songs, setSongs] = useState<SubsonicSong[]>([]);
  const [coverArtId, setCoverArtId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const [selectedSong, setSelectedSong] = useState<SubsonicSong | null>(null);
  const [songOptsVisible, setSongOptsVisible] = useState(false);
  const [albumOptsVisible, setAlbumOptsVisible] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<SubsonicSong | null>(null);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);

  const activeTrack = useActiveTrack();
  const currentTrackId = activeTrack?.id ? String(activeTrack.id) : null;
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);

  const dominantColor = useAlbumColor(coverArtId);
  const topBarH = insets.top + TOP_BAR_H;

  const scrollY = useRef(new Animated.Value(0)).current;
  const coverScale = scrollY.interpolate({ inputRange: [0, COVER_SIZE], outputRange: [1, 0.55], extrapolate: 'clamp' });
  const coverTranslateY = scrollY.interpolate({ inputRange: [0, COVER_SIZE], outputRange: [0, COVER_SIZE * 0.2], extrapolate: 'clamp' });

  useEffect(() => {
    subsonicGet<any>('getAlbum.view', { id: albumId })
      .then(res => {
        const album = res.album || {};
        setAlbumName(album.name);
        setArtistName(album.artist);
        setArtistId(album.artistId ? String(album.artistId) : undefined);
        setYear(album.year);
        setCoverArtId(album.coverArt);
        setSongs(album.song || []);
        setIsStarred(!!album.starred);
        if (album.artist) {
          getArtistImage(album.artist)
            .then(url => { if (url) setArtistImageUrl(url); })
            .catch(() => {});
        }
      })
      .catch(e => console.warn('getAlbum error', e))
      .finally(() => setLoading(false));
  }, [albumId]);

  const handleToggleStar = useCallback(async () => {
    const next = !isStarred;
    setIsStarred(next);
    try {
      if (next) {
        await subsonicGet('star.view', {albumId});
        showToast(getT().albumDetail.addedToLibrary);
      } else {
        await subsonicGet('unstar.view', {albumId});
        showToast(getT().albumDetail.removedFromLibrary);
      }
    } catch {
      setIsStarred(!next);
    }
  }, [isStarred, albumId]);

  const handlePlay = useCallback(async () => {
    setLoadingAlbum(true);
    try {
      await loadAndPlayAlbum(albumId, isShuffled);
    } catch (e) {
      console.warn('play error', e);
    } finally {
      setLoadingAlbum(false);
    }
  }, [albumId, isShuffled]);

  const handlePlayTrack = useCallback(async (startIndex: number) => {
    if (!songs.length) return;
    const tracks: Track[] = songs.map((s: any) => ({
      id: s.id,
      title: s.title || getT().home.unknownTitle,
      artist: s.artist || getT().artistDetail.unknownArtist,
      artistId: s.artistId,
      album: s.album || albumName || getT().albumDetail.unknownAlbum,
      duration: s.duration || 0,
      coverArt: s.coverArt || coverArtId || s.id,
      streamUrl: getStreamUrl(s.id),
      url: getStreamUrl(s.id),
      artwork: getCoverArtUrl(s.coverArt || coverArtId || s.id, 300),
    }));
    await loadAndPlayTracks(tracks, startIndex);
  }, [songs, albumName, coverArtId]);

  const handleSongMore = useCallback((song: SubsonicSong) => {
    setSelectedSong(song);
    setSongOptsVisible(true);
  }, []);

  const handleArtistPress = useCallback(() => {
    if (artistId || artistName) {
      navigation.navigate('ArtistDetail', {artistId, artistName});
    }
  }, [navigation, artistId, artistName]);

  const handleAlbumAddToQueue = useCallback(async () => {
    if (!songs.length) return;
    try {
      const idx = await TrackPlayer.getActiveTrackIndex();
      const insertAt = idx != null ? idx + 1 : undefined;
      const rnTracks = songs.map(s => ({
        id: String(s.id),
        url: getStreamUrl(String(s.id)),
        title: s.title,
        artist: s.artist,
        artwork: getCoverArtUrl(s.coverArt || String(s.id), 300),
        coverArt: s.coverArt,
        album: s.album || albumName,
        duration: s.duration,
      }));
      await TrackPlayer.add(rnTracks, insertAt);
      await syncUpcomingFromRNTP();
      showToast(getT().playlistOptions.queuedToast(songs.length));
    } catch {
      showToast(getT().playlistOptions.queueError);
    }
  }, [songs, albumName]);

  const renderItem = useCallback(({item, index}: {item: SubsonicSong, index: number}) => (
    <SongRow
      song={item}
      isActive={currentTrackId === item.id}
      index={index + 1}
      onPress={() => handlePlayTrack(index)}
      onMore={() => handleSongMore(item)}
      onAddToPlaylist={() => { setAddToPlaylistSong(item); setAddToPlaylistVisible(true); }}
    />
  ), [currentTrackId, handlePlayTrack, handleSongMore]);

  const trackIds = useMemo(() => songs.map(s => String(s.id)), [songs]);

  const listHeader = useMemo(() => (
    <AlbumHeader
      topBarH={topBarH} coverArtId={coverArtId} albumName={albumName} artistName={artistName}
      artistImageUrl={artistImageUrl} year={year}
      isShuffled={isShuffled} isStarred={isStarred} loadingAlbum={loadingAlbum}
      coverScale={coverScale} coverTranslateY={coverTranslateY}
      onPlay={handlePlay} onShuffle={toggleShuffle} onToggleStar={handleToggleStar}
      onArtistPress={handleArtistPress} onMorePress={() => setAlbumOptsVisible(true)}
    />
  ), [topBarH, coverArtId, albumName, artistName, artistImageUrl, year, isShuffled, isStarred, loadingAlbum, coverScale, coverTranslateY, handlePlay, toggleShuffle, handleToggleStar, handleArtistPress]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[dominantColor, darkTheme.background]} locations={[0, 0.62]} style={styles.bgGradient} />

      {loading ? (
        <View style={[styles.center, {paddingTop: topBarH}]}><ActivityIndicator size="large" color={darkTheme.accent} /></View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: false})}
          scrollEventThrottle={16}
        />
      )}

      <View style={[styles.topBar, {paddingTop: insets.top}]} pointerEvents="box-none">
        <View style={styles.topBarInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <BackArrowIcon size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <SongOptionsSheet
        visible={songOptsVisible}
        onClose={() => setSongOptsVisible(false)}
        track={selectedSong}
        onToast={showToast}
        onNavigateAlbum={(id) => navigation.navigate('AlbumDetail', {albumId: id})}
        onNavigateArtist={(id, name) => {
          navigation.navigate('ArtistDetail', {artistId: id, artistName: name});
        }}
      />

      <AlbumOptionsSheet
        visible={albumOptsVisible}
        onClose={() => setAlbumOptsVisible(false)}
        albumName={albumName}
        coverArtId={coverArtId}
        isStarred={isStarred}
        onToggleStar={handleToggleStar}
        onGoToArtist={artistId ? handleArtistPress : undefined}
        onAddToQueue={handleAlbumAddToQueue}
        trackIds={trackIds}
        onToast={showToast}
      />

      <AddToPlaylistSheet
        visible={addToPlaylistVisible}
        onClose={() => setAddToPlaylistVisible(false)}
        trackId={addToPlaylistSong ? String(addToPlaylistSong.id) : undefined}
        trackTitle={addToPlaylistSong?.title}
        onToast={showToast}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  coverPlaceholder: {width: COVER_SIZE, height: COVER_SIZE, backgroundColor: '#333', borderRadius: 8},
  artistAvatarText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  artistAvatarImg: {width: 24, height: 24, borderRadius: 12},
  root: { flex: 1, backgroundColor: darkTheme.background },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H * 0.62 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  topBarInner: { flexDirection: 'row', alignItems: 'center', height: TOP_BAR_H, paddingHorizontal: 12 },
  backBtn: { padding: 6 },
  listContent: { paddingBottom: 150 },
  coverWrap: { alignItems: 'center', paddingHorizontal: 40, marginBottom: 22 },
  coverShadow: { shadowColor: '#000', shadowOffset: {width: 0, height: 14}, shadowOpacity: 0.75, shadowRadius: 22, elevation: 18 },
  meta: { paddingHorizontal: 16, marginBottom: 6 },
  albumName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  artistAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#555', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metaArtist: { fontSize: 16, fontWeight: '700', color: '#fff' },
  metaSub: { fontSize: 13, color: '#aaa' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 14 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionsRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { padding: 10 },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: darkTheme.accent, alignItems: 'center', justifyContent: 'center' },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 12, paddingVertical: 12, gap: 8 },
  songIndexWrap: { width: 16, alignItems: 'center' },
  songIndex: { color: '#888', fontSize: 14, fontWeight: '600' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
  songArtist: { fontSize: 13, color: '#aaa', marginTop: 3 },
  songActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  songDots: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
