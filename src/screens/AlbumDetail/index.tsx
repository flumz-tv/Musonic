import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
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
import Toast from '../../components/Toast';
import {loadAndPlayAlbum, loadAndPlayTracks} from '../../services/playerActions';
import {usePlayerStore} from '../../store/playerStore';
import {colorFromId} from '../../utils/colorUtils';
import type {SubsonicSong} from '../../api/types';
import type {LibraryStackParams} from '../../navigation/types';
import type {Track} from '../../store/playerStore';
import {subsonicGet, getCoverArtUrl, getStreamUrl} from '../../api/client';
import {t} from '../../i18n/fr';

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
function BackIcon({size = 24, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M15 4 L7 12 L15 20" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
}
function DownloadIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" /><Path d="M12 7 V14 M9 12 L12 15 L15 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
}
function MoreDotsIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={5} cy={12} r={1.8} fill={color} /><Circle cx={12} cy={12} r={1.8} fill={color} /><Circle cx={19} cy={12} r={1.8} fill={color} /></Svg>);
}
function ShuffleIcon({size = 24, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M2 4 C6 4 9 10 12 10 C15 10 18 4 22 4 M19 2 L22 4 L19 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /><Path d="M2 20 C6 20 9 14 12 14 C15 14 18 20 22 20 M19 18 L22 20 L19 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
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
// ─── Song row ─────────────────────────────────────────────────────────────────
type SongRowProps = {song: SubsonicSong; isActive: boolean; index: number; onPress: () => void};
function SongRow({song, isActive, index, onPress}: SongRowProps) {
  return (
    <TouchableOpacity style={styles.songRow} activeOpacity={0.7} onPress={onPress}>
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
      <TouchableOpacity style={styles.songDots} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <ThreeDotsVertIcon />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── List Header ──────────────────────────────────────────────────────────────
function AlbumHeader({
  topBarH, coverArtId, albumName, artistName, year,
  isShuffled, isStarred, loadingAlbum, coverScale, coverTranslateY,
  onPlay, onShuffle, onToggleStar,
}: any) {
  return (
    <View>
      <View style={{height: topBarH + 16}} />
      <View style={styles.coverWrap}>
        <Animated.View style={[styles.coverShadow, {transform: [{scale: coverScale}, {translateY: coverTranslateY}]}]}>
          {coverArtId ? (
            <CoverArt id={coverArtId} size={COVER_SIZE} borderRadius={8} />
          ) : (
            <View style={{width: COVER_SIZE, height: COVER_SIZE, backgroundColor: '#333', borderRadius: 8}} />
          )}
        </Animated.View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.albumName} numberOfLines={2}>{albumName || '…'}</Text>
        <View style={styles.metaRow}>
          <View style={styles.artistAvatar}>
            <Text style={{color: '#fff', fontSize: 10, fontWeight: '700'}}>
              {artistName ? artistName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.metaArtist} numberOfLines={1}>{artistName || t.artistDetail.unknownArtist}</Text>
        </View>
        <Text style={styles.metaSub}>Album • {year || t.albumDetail.unknownYear}</Text>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleStar} activeOpacity={0.7}>
              {isStarred ? <CheckCircleGreen size={26} /> : <PlusCircleIcon size={26} />}
            </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}><DownloadIcon size={22} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}><MoreDotsIcon size={22} /></TouchableOpacity>
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.actionBtn} onPress={onShuffle} activeOpacity={0.7}>
            <ShuffleIcon size={24} color={isShuffled ? darkTheme.accent : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={onPlay} activeOpacity={0.85}>
            {loadingAlbum ? <ActivityIndicator color="#000" size="small" /> : <PlayIcon size={24} color="#000" />}
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
  const [year, setYear] = useState<string | number>('');
  const [songs, setSongs] = useState<SubsonicSong[]>([]);
  const [coverArtId, setCoverArtId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentTrackId = usePlayerStore(s => s.currentTrack?.id);
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
        setYear(album.year);
        setCoverArtId(album.coverArt);
        setSongs(album.song || []);
        setIsStarred(!!album.starred);
      })
      .catch(e => console.warn('getAlbum error', e))
      .finally(() => setLoading(false));
  }, [albumId]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleToggleStar = useCallback(async () => {
    const next = !isStarred;
    setIsStarred(next);
    try {
      if (next) {
        await subsonicGet('star.view', {albumId});
        showToast(t.albumDetail.addedToLibrary);
      } else {
        await subsonicGet('unstar.view', {albumId});
        showToast(t.albumDetail.removedFromLibrary);
      }
    } catch {
      setIsStarred(!next);
    }
  }, [isStarred, albumId, showToast]);

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
      title: s.title || t.home.unknownTitle,
      artist: s.artist || t.artistDetail.unknownArtist,
      artistId: s.artistId,
      album: s.album || albumName || t.albumDetail.unknownAlbum,
      duration: s.duration || 0,
      coverArt: s.coverArt || coverArtId || s.id,
      streamUrl: getStreamUrl(s.id),
      url: getStreamUrl(s.id),
      artwork: getCoverArtUrl(s.coverArt || coverArtId || s.id, 300),
    }));
    await loadAndPlayTracks(tracks, startIndex);
  }, [songs, albumName, coverArtId]);

  const renderItem = useCallback(({item, index}: {item: SubsonicSong, index: number}) => (
    <SongRow 
      song={item} 
      isActive={currentTrackId === item.id} 
      index={index + 1} 
      onPress={() => handlePlayTrack(index)} 
    />
  ), [currentTrackId, handlePlayTrack]);

  const listHeader = useMemo(() => (
    <AlbumHeader
      topBarH={topBarH} coverArtId={coverArtId} albumName={albumName} artistName={artistName} year={year}
      isShuffled={isShuffled} isStarred={isStarred} loadingAlbum={loadingAlbum}
      coverScale={coverScale} coverTranslateY={coverTranslateY}
      onPlay={handlePlay} onShuffle={toggleShuffle} onToggleStar={handleToggleStar}
    />
  ), [topBarH, coverArtId, albumName, artistName, year, isShuffled, isStarred, loadingAlbum, coverScale, coverTranslateY, handlePlay, toggleShuffle, handleToggleStar]);

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
            <BackIcon size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <Toast visible={toastVisible} message={toastMessage} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  artistAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#555', alignItems: 'center', justifyContent: 'center' },
  metaArtist: { fontSize: 16, fontWeight: '700', color: '#fff' },
  metaSub: { fontSize: 13, color: '#aaa' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 14 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionsRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { padding: 10 },
  playBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: darkTheme.accent, alignItems: 'center', justifyContent: 'center', shadowColor: darkTheme.accent, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  songIndexWrap: { width: 28, alignItems: 'center' },
  songIndex: { color: '#888', fontSize: 14, fontWeight: '600' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
  songArtist: { fontSize: 13, color: '#aaa', marginTop: 3 },
  songDots: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});