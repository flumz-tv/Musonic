/**
 * @file index.tsx
 * @description Playlist detail screen. Displays tracks in a playlist with
 *   drag-and-drop reordering, inline search, edit mode, recommended track
 *   suggestions, and full CRUD support (add, remove, rename).
 * @author DoodzProg
 * @version 0.9.2
 * @license CC-BY-NC-4.0
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Svg, {Circle, Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import ImageColors from 'react-native-image-colors';
import {darkTheme} from '../../theme';
import CoverArt from '../../components/CoverArt';
import {getPlaylist, replacePlaylist} from '../../api/endpoints/playlists';
import {loadAndPlayPlaylist, loadAndPlayTracks} from '../../services/playerActions';
import ShuffleIcon from '../../components/icons/ShuffleIcon';
import {usePlaybackState, State} from 'react-native-track-player';
import {usePlayerStore} from '../../store/playerStore';
import {colorFromId} from '../../utils/colorUtils';
import type {SubsonicSong} from '../../api/types';
import type {LibraryStackParams} from '../../navigation/types';
import {getCoverArtUrl, getStreamUrl} from '../../api/client';
import type {Track} from '../../store/playerStore';
import DraggableFlatList, {ScaleDecorator} from 'react-native-draggable-flatlist';
import type {RenderItemParams} from 'react-native-draggable-flatlist';
import SongOptionsSheet from '../../components/SongOptionsSheet';
import PlaylistOptionsSheet from '../../components/PlaylistOptionsSheet';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';
import PlaylistInfoModal, {getLocalCoverUri} from '../../components/PlaylistInfoModal';
import {showToast} from '../../components/Toast';
import {useT, getT} from '../../i18n';
import {fetchAndCachePlaylistSongs} from '../../store/playlistCacheStore';
import BackArrowIcon from '../../components/icons/BackArrowIcon';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const COVER_SIZE = Math.min(SCREEN_W - 80, 260);
const TOP_BAR_H = 52;

// ─── Vivid color extraction via react-native-image-colors ────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  if (c.length !== 6) return [61, 31, 15];
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return [0, 0, l];
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn)      h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else                 h = (rn - gn) / delta + 4;
  return [((h * 60) + 360) % 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  const round = (v: number) => Math.round((v + m) * 255);
  return [round(r), round(g), round(b)];
}

// Boosts saturation and raises lightness to produce vivid, flashy gradient colors
// while keeping text readable (L capped at 0.42).
function toVividColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const finalS = Math.min(1, Math.max(0.7, s * 1.5));
  const finalL = 0.42;
  const [fr, fg, fb] = hslToRgb(h, finalS, finalL);
  const hex2 = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${hex2(fr)}${hex2(fg)}${hex2(fb)}`;
}

function usePlaylistColor(coverArtId?: string): string {
  const [color, setColor] = useState(() =>
    coverArtId ? colorFromId(coverArtId) : '#3D1F0F',
  );
  useEffect(() => {
    if (!coverArtId) return;
    const fallback = colorFromId(coverArtId);
    let cancelled = false;
    let url: string;
    try { url = getCoverArtUrl(coverArtId, 200); } catch { return; }

    ImageColors.getColors(url, {fallback, cache: true})
      .then(result => {
        if (cancelled) return;
        let raw = fallback;
        if (result.platform === 'android') {
          raw = (result as any).vibrant
             ?? (result as any).dominant
             ?? (result as any).average
             ?? fallback;
        } else if (result.platform === 'ios') {
          raw = (result as any).primary
             ?? (result as any).background
             ?? fallback;
        }
        if (!cancelled) setColor(toVividColor(raw));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [coverArtId]);
  return color;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function SearchSmIcon({size = 18, color = '#888'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M15.5 15.5 L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DownloadIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
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


function MoreDotsIcon({size = 22, color = '#fff'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={19} cy={12} r={1.8} fill={color} />
    </Svg>
  );
}


function PlayIcon({size = 22, color = '#000'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4 L21 12 L7 20 Z" fill={color} />
    </Svg>
  );
}

function PauseIcon({size = 22, color = '#000'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 4 L6 20" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M18 4 L18 20" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

function ThreeDotsVertIcon({size = 18, color = '#888'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={5} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={19} r={1.8} fill={color} />
    </Svg>
  );
}

function FadersIcon({size = 15, color = '#fff'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 6 L10 6 M14 6 L20 6 M11 3 L11 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M4 18 L8 18 M12 18 L20 18 M9 15 L9 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PencilIcon({size = 15, color = '#fff'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M11 5 H5 C4.4 5 4 5.4 4 6 V19 C4 19.6 4.4 20 5 20 H18 C18.6 20 19 19.6 19 19 V13 M17.5 2.5 C18.3 1.7 19.7 1.7 20.5 2.5 C21.3 3.3 21.3 4.7 20.5 5.5 L12 14 L8 15 L9 11 Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PlusCircleIcon({size = 26, color = 'rgba(255,255,255,0.45)'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.6} fill="none" />
      <Path
        d="M12 8 V16 M8 12 H16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MusicNoteIcon({size = 20, color = '#666'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 18 V5 L21 3 V16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={18} cy={16} r={3} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function MinusCircleIcon({size = 24}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill="#555" />
      <Path d="M7 12 H17" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function DragHandleIcon({size = 24, color = '#777'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8 H20 M4 12 H20 M4 16 H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Liked Cover ──────────────────────────────────────────────────────────────

function LikedCover({size, radius = 8}: {size: number; radius?: number}) {
  const coverStyle = {width: size, height: size, borderRadius: radius, alignItems: 'center' as const, justifyContent: 'center' as const};
  return (
    <LinearGradient
      colors={['#6B2FA0', '#1E3A8A']}
      style={coverStyle}>
      <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24">
        <Path
          d="M12 21 C12 21 3 14.5 3 8.5 C3 5.4 5.4 3 8.5 3 C10.1 3 11.5 3.8 12 5 C12.5 3.8 13.9 3 15.5 3 C18.6 3 21 5.4 21 8.5 C21 14.5 12 21 12 21 Z"
          fill="white"
        />
      </Svg>
    </LinearGradient>
  );
}

// ─── Placeholder recommendations ──────────────────────────────────────────────

const MOCK_RECS = [
  {id: 'rec1', title: 'Blinding Lights', artist: 'The Weeknd'},
  {id: 'rec2', title: 'Levitating', artist: 'Dua Lipa'},
  {id: 'rec3', title: 'Stay', artist: 'The Kid LAROI'},
  {id: 'rec4', title: 'Shivers', artist: 'Ed Sheeran'},
];

// ─── Song row ─────────────────────────────────────────────────────────────────

type SongRowProps = {
  song: SubsonicSong;
  isActive: boolean;
  onPress: () => void;
  onMorePress: () => void;
};

function SongRow({song, isActive, onPress, onMorePress}: SongRowProps) {
  return (
    <TouchableOpacity
      style={styles.songRow}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onMorePress}
      delayLongPress={400}>
      <CoverArt id={song.coverArt} size={44} borderRadius={4} />
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, isActive && {color: darkTheme.accent}]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.songDots}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        onPress={onMorePress}>
        <ThreeDotsVertIcon />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── List Header ──────────────────────────────────────────────────────────────

type HeaderProps = {
  topBarH: number;
  coverArtId?: string;
  localCoverUri?: string | null;
  playlistName: string;
  songCount: number;
  totalDuration: number;
  isShuffled: boolean;
  isThisPlaylistActive: boolean;
  isGlobalPlaying: boolean;
  loadingPlaylist: boolean;
  coverScale: Animated.AnimatedInterpolation<number>;
  coverTranslateY: Animated.AnimatedInterpolation<number>;
  query: string;
  onQueryChange: (q: string) => void;
  onPlay: () => void;
  onShuffle: () => void;
  onMorePress: () => void;
  onStartEdit: () => void;
  onOpenInfo: () => void;
};

function PlaylistHeader({
  topBarH,
  coverArtId,
  localCoverUri,
  playlistName,
  songCount,
  totalDuration,
  isShuffled,
  isThisPlaylistActive,
  isGlobalPlaying,
  loadingPlaylist,
  coverScale,
  coverTranslateY,
  query,
  onQueryChange,
  onPlay,
  onShuffle,
  onMorePress,
  onStartEdit,
  onOpenInfo,
}: HeaderProps) {
  const t = useT();
  const showPause = isThisPlaylistActive && isGlobalPlaying;

  return (
    <View>
      <View style={{height: topBarH + 16}} />

      {/* Search bar (scrolls with content) */}
      <View style={styles.searchInHeader}>
        <SearchSmIcon size={16} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder={t.playlistDetail.searchPlaceholder}
          placeholderTextColor="#888"
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
        />
      </View>

      {/* Cover with parallax */}
      <View style={styles.coverWrap}>
        <Animated.View
          style={[
            styles.coverShadow,
            {transform: [{scale: coverScale}, {translateY: coverTranslateY}]},
          ]}>
          {localCoverUri ? (
            <Image source={{uri: localCoverUri}} style={styles.coverLocalImg} />
          ) : coverArtId ? (
            <CoverArt id={coverArtId} size={COVER_SIZE} borderRadius={8} />
          ) : (
            <LikedCover size={COVER_SIZE} />
          )}
        </Animated.View>
      </View>

      {/* Title + meta */}
      <View style={styles.meta}>
        <Text style={styles.playlistName} numberOfLines={2}>
          {playlistName || '…'}
        </Text>
        <View style={styles.metaRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Circle cx={12} cy={8} r={4} fill="#aaa" />
            <Path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" fill="#aaa" />
          </Svg>
          <Text style={styles.metaSub}>{t.playlistDetail.owner}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaSub}>
            {t.playlistDetail.trackCount(songCount)} · {formatDuration(totalDuration)}
          </Text>
        </View>
      </View>

      {/* Context label — visible when this playlist is active */}
      {isThisPlaylistActive && (
        <Text style={styles.contextLabel}>{t.playlistDetail.contextLabel}</Text>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <DownloadIcon size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onMorePress}>
            <MoreDotsIcon size={22} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onShuffle}
            activeOpacity={0.7}>
            <ShuffleIcon size={24} active={isShuffled} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={onPlay}
            activeOpacity={0.85}>
            {loadingPlaylist ? (
              <ActivityIndicator color="#000" size="small" />
            ) : showPause ? (
              <PauseIcon size={24} color="#000" />
            ) : (
              <PlayIcon size={24} color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pills */}
      <View style={styles.pillsRow}>
        <TouchableOpacity style={styles.pillBtn} activeOpacity={0.7} onPress={onStartEdit}>
          <DragHandleIcon size={14} color="#fff" />
          <Text style={[styles.pillText, styles.pillTextIndent]}>{t.playlistDetail.pills.edit}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillBtn} activeOpacity={0.7} onPress={() => showToast(t.playlistDetail.comingSoon)}>
          <FadersIcon size={14} />
          <Text style={[styles.pillText, styles.pillTextIndent]}>{t.playlistDetail.pills.sort}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillBtn} activeOpacity={0.7} onPress={onOpenInfo}>
          <PencilIcon size={14} />
          <Text style={[styles.pillText, styles.pillTextIndent]}>{t.playlistDetail.pills.info}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── List Footer ──────────────────────────────────────────────────────────────

function PlaylistFooter() {
  const t = useT();
  return (
    <View style={styles.recoSection}>
      <Text style={styles.recoTitle}>{t.playlistDetail.recommendations.title}</Text>
      <Text style={styles.recoSub}>{t.playlistDetail.recommendations.subtitle}</Text>
      {MOCK_RECS.map(rec => (
        <View key={rec.id} style={styles.recoRow}>
          <View style={styles.recoCover}>
            <MusicNoteIcon size={18} color="#555" />
          </View>
          <View style={styles.recoInfo}>
            <Text style={styles.recoName} numberOfLines={1}>
              {rec.title}
            </Text>
            <Text style={styles.recoArtist} numberOfLines={1}>
              {rec.artist}
            </Text>
          </View>
          <TouchableOpacity
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <PlusCircleIcon size={26} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─── Edit Mode Components ─────────────────────────────────────────────────────

function EditHeader({
  topInset,
  isSaving,
  onCancel,
  onSave,
}: {
  topInset: number;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useT();
  return (
    <View style={[styles.editBar, {paddingTop: topInset}]}>
      <TouchableOpacity onPress={onCancel} style={styles.editBarSide} activeOpacity={0.7}>
        <BackArrowIcon size={22} />
      </TouchableOpacity>
      <Text style={styles.editBarTitle}>{t.playlistDetail.editHeader}</Text>
      <TouchableOpacity
        onPress={onSave}
        style={[styles.editBarSide, styles.editBarRight]}
        activeOpacity={0.7}
        disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator size="small" color={darkTheme.accent} />
        ) : (
          <Text style={styles.editSaveText}>{t.playlistDetail.saveButton}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function EditSongRow({
  song,
  drag,
  isActive,
  onRemove,
}: {
  song: SubsonicSong;
  drag: () => void;
  isActive: boolean;
  onRemove: () => void;
}) {
  return (
    <ScaleDecorator>
      <View style={[styles.editRow, isActive && styles.editRowActive]}>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.editMinusBtn}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <MinusCircleIcon />
        </TouchableOpacity>
        <CoverArt id={song.coverArt} size={48} borderRadius={4} />
        <View style={styles.songInfo}>
          <Text style={styles.editSongTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.editSongArtist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={0}
          style={styles.dragHandle}
          activeOpacity={0.6}>
          <DragHandleIcon />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type RouteT = RouteProp<LibraryStackParams, 'PlaylistDetail'>;

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<LibraryStackParams, 'PlaylistDetail'>>();
  const route = useRoute<RouteT>();
  const {playlistId} = route.params;

  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [songs, setSongs] = useState<SubsonicSong[]>([]);
  const [coverArtId, setCoverArtId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [query, setQuery] = useState('');

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editSongs, setEditSongs] = useState<SubsonicSong[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [localCoverUri, setLocalCoverUri] = useState<string | null>(() => getLocalCoverUri(playlistId));

  // Sheets & modals
  const [songOptionsTrack, setSongOptionsTrack] = useState<SubsonicSong | null>(null);
  const [songOptionsIndex, setSongOptionsIndex] = useState<number>(0);
  const [playlistOptionsVisible, setPlaylistOptionsVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalInitialView, setInfoModalInitialView] = useState<'info' | 'cover'>('info');
  const [addAllVisible, setAddAllVisible] = useState(false);
  const playbackState = usePlaybackState();
  const isGlobalPlaying = playbackState.state === State.Playing;
  const currentPlaylistId = usePlayerStore(s => s.currentPlaylistId);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const togglePlay = usePlayerStore(s => s.togglePlay);

  const isThisPlaylistActive = currentPlaylistId === playlistId;

  // history.length == index of the currently playing track in the RNTP queue.
  // AudioPlayer syncs this from PlaybackActiveTrackChanged, so it stays current.
  // -1 when this playlist is not the active context, so no row highlights.
  const queueHistory = usePlayerStore(s => s.history);
  const activeQueueIndex = isThisPlaylistActive ? queueHistory.length : -1;

  const dominantColor = usePlaylistColor(coverArtId);
  const topBarH = insets.top + TOP_BAR_H;

  // Parallax animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const coverScale = scrollY.interpolate({
    inputRange: [0, COVER_SIZE],
    outputRange: [1, 0.55],
    extrapolate: 'clamp',
  });
  const coverTranslateY = scrollY.interpolate({
    inputRange: [0, COVER_SIZE],
    outputRange: [0, COVER_SIZE * 0.2],
    extrapolate: 'clamp',
  });

  // Refresh local cover whenever info modal closes
  useEffect(() => {
    if (!infoModalVisible) {
      setLocalCoverUri(getLocalCoverUri(playlistId));
    }
  }, [infoModalVisible, playlistId]);

  useEffect(() => {
    getPlaylist(playlistId)
      .then(({playlist, songs: s}) => {
        setPlaylistName(playlist.name);
        setDescription(playlist.comment ?? '');
        setCoverArtId(playlist.coverArt);
        setSongs(s);
      })
      .catch(e => console.warn('getPlaylist error', e))
      .finally(() => setLoading(false));
  }, [playlistId]);

  const handlePlay = useCallback(async () => {
    if (isThisPlaylistActive) {
      togglePlay();
      return;
    }
    setLoadingPlaylist(true);
    try {
      await loadAndPlayPlaylist(playlistId, isShuffled);
    } catch (e) {
      console.warn('play error', e);
    } finally {
      setLoadingPlaylist(false);
    }
  }, [isThisPlaylistActive, togglePlay, playlistId, isShuffled]);

  // Pair each displayed song with its original index in `songs` so we can:
  // 1. Pass the exact startIndex to RNTP (correct playback position)
  // 2. Highlight only the index actually playing, not all occurrences of the same ID
  const filteredWithOrigIdx = useMemo(
    () =>
      query.length < 2
        ? songs.map((s, i) => ({s, origIdx: i}))
        : songs
            .map((s, i) => ({s, origIdx: i}))
            .filter(
              ({s}) =>
                s.title.toLowerCase().includes(query.toLowerCase()) ||
                s.artist.toLowerCase().includes(query.toLowerCase()),
            ),
    [songs, query],
  );

  const totalDuration = useMemo(
    () => songs.reduce((acc, s) => acc + (s.duration ?? 0), 0),
    [songs],
  );

  const handlePlayTrack = useCallback(async (origIdx: number) => {
    if (!songs.length) return;
    const tracks: Track[] = songs.map((s: any) => ({
      id: s.id,
      title: s.title || getT().home.unknownTitle,
      artist: s.artist || getT().home.unknownArtist,
      album: s.album || 'Single',
      duration: s.duration || 0,
      coverArt: s.coverArt || s.id,
      streamUrl: getStreamUrl(s.id),
      url: getStreamUrl(s.id),
      artwork: getCoverArtUrl(s.coverArt || s.id, 300),
    }));
    await loadAndPlayTracks(tracks, origIdx, {id: playlistId, name: playlistName});
  }, [songs, playlistId, playlistName]);

  const handleSongMore = useCallback((song: SubsonicSong, origIdx: number) => {
    setSongOptionsTrack(song);
    // Use the pre-computed original index directly — findIndex by ID would return the
    // first duplicate, causing removal of the wrong entry in playlists with repeated tracks.
    setSongOptionsIndex(origIdx);
  }, []);

  const handleSongRemoved = useCallback(() => {
    setSongOptionsTrack(null);
    // Reload playlist after removal
    getPlaylist(playlistId)
      .then(({playlist: pl, songs: s}) => {
        setPlaylistName(pl.name);
        setCoverArtId(pl.coverArt);
        setSongs(s);
      })
      .catch(() => {});
  }, [playlistId]);

  const handleNavigateAlbum = useCallback((albumId: string) => {
    navigation.navigate('AlbumDetail', {albumId});
  }, [navigation]);

  const handleNavigateArtist = useCallback((artistId: string | undefined, artistName: string) => {
    navigation.navigate('ArtistDetail', artistId ? {artistId} : {artistName});
  }, [navigation]);

  const handleStartEdit = useCallback(() => {
    setEditSongs([...songs]);
    setIsEditing(true);
  }, [songs]);

  const handleOpenInfo = useCallback(() => {
    setInfoModalInitialView('info');
    setInfoModalVisible(true);
  }, []);

  const handleOpenCover = useCallback(() => {
    setInfoModalInitialView('cover');
    setInfoModalVisible(true);
  }, []);

  const handleInfoSaved = useCallback((name: string, desc: string) => {
    setPlaylistName(name);
    setDescription(desc);
    showToast(getT().playlistInfo.saved);
  }, []);

  const handleInfoDeleted = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditSongs([]);
  }, []);

  const handleRemoveFromEdit = useCallback((songId: string) => {
    setEditSongs(prev => prev.filter(s => String(s.id) !== songId));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    setIsSaving(true);
    try {
      await replacePlaylist(playlistId, editSongs.map(s => String(s.id)));
      const {playlist: pl, songs: fresh} = await getPlaylist(playlistId);
      setPlaylistName(pl.name);
      setCoverArtId(pl.coverArt);
      setSongs(fresh);
      setIsEditing(false);
      setEditSongs([]);
      showToast(getT().playlistDetail.savedToast);
      fetchAndCachePlaylistSongs();
    } catch {
      showToast(getT().playlistDetail.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [editSongs, playlistId]);

  const renderItem = useCallback(
    ({item}: {item: {s: SubsonicSong; origIdx: number}}) => (
      <SongRow
        song={item.s}
        // Highlight by position, not by ID: avoids false positives when playing
        // from a different context, and handles duplicate songs in the same playlist.
        isActive={activeQueueIndex === item.origIdx}
        onPress={() => handlePlayTrack(item.origIdx)}
        onMorePress={() => handleSongMore(item.s, item.origIdx)}
      />
    ),
    [activeQueueIndex, handlePlayTrack, handleSongMore],
  );

  const listHeader = useMemo(
    () => (
      <PlaylistHeader
        topBarH={topBarH}
        coverArtId={coverArtId}
        localCoverUri={localCoverUri}
        playlistName={playlistName}
        songCount={songs.length}
        totalDuration={totalDuration}
        isShuffled={isShuffled}
        isThisPlaylistActive={isThisPlaylistActive}
        isGlobalPlaying={isGlobalPlaying}
        loadingPlaylist={loadingPlaylist}
        coverScale={coverScale}
        coverTranslateY={coverTranslateY}
        query={query}
        onQueryChange={setQuery}
        onPlay={handlePlay}
        onShuffle={toggleShuffle}
        onMorePress={() => setPlaylistOptionsVisible(true)}
        onStartEdit={handleStartEdit}
        onOpenInfo={handleOpenInfo}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      topBarH, coverArtId, localCoverUri, playlistName, songs.length, totalDuration,
      isShuffled, isThisPlaylistActive, isGlobalPlaying, loadingPlaylist,
      query, handlePlay, handleStartEdit, handleOpenInfo,
    ],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background — gradient normally, opaque when editing */}
      {isEditing ? (
        <View style={[StyleSheet.absoluteFill, styles.editBg]} />
      ) : (
        <LinearGradient
          colors={[dominantColor, darkTheme.background]}
          locations={[0, 0.72]}
          style={styles.bgGradient}
        />
      )}

      {/* Scrollable content */}
      {isEditing ? (
        <DraggableFlatList
          data={editSongs}
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          renderItem={({item, drag, isActive}: RenderItemParams<SubsonicSong>) => (
            <EditSongRow
              song={item}
              drag={drag}
              isActive={isActive}
              onRemove={() => handleRemoveFromEdit(String(item.id))}
            />
          )}
          onDragEnd={({data}) => setEditSongs(data)}
          contentContainerStyle={[styles.listContent, {paddingTop: insets.top + 56 + 16}]}
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={[styles.center, {paddingTop: topBarH}]}>
          <ActivityIndicator size="large" color={darkTheme.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredWithOrigIdx}
          keyExtractor={(item) => `${String(item.s.id)}-${item.origIdx}`}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={<PlaylistFooter />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: false},
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Fixed top bar — back button / edit header */}
      {isEditing ? (
        <EditHeader
          topInset={insets.top}
          isSaving={isSaving}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />
      ) : (
        <View style={[styles.topBar, {paddingTop: insets.top}]} pointerEvents="box-none">
          <View style={styles.topBarInner}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}>
              <BackArrowIcon size={24} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SongOptionsSheet
        visible={songOptionsTrack !== null}
        onClose={() => setSongOptionsTrack(null)}
        track={songOptionsTrack}
        playlistId={playlistId}
        trackIndex={songOptionsIndex}
        onToast={showToast}
        onRemoved={handleSongRemoved}
        onNavigateAlbum={handleNavigateAlbum}
        onNavigateArtist={handleNavigateArtist}
      />

      <PlaylistOptionsSheet
        visible={playlistOptionsVisible}
        onClose={() => setPlaylistOptionsVisible(false)}
        playlist={coverArtId !== undefined || playlistName ? {id: playlistId, name: playlistName, coverArt: coverArtId, songCount: songs.length} : null}
        isPinned={false}
        onTogglePin={() => {}}
        onToast={showToast}
        onDeleted={() => navigation.goBack()}
        onStartEdit={handleStartEdit}
        onOpenInfo={handleOpenInfo}
        onOpenCover={handleOpenCover}
        onAddAll={() => setAddAllVisible(true)}
      />

      <AddToPlaylistSheet
        visible={addAllVisible}
        onClose={() => setAddAllVisible(false)}
        trackIds={songs.map(s => String(s.id))}
        onToast={showToast}
      />

      <PlaylistInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        playlistId={playlistId}
        initialName={playlistName}
        initialDescription={description}
        coverArtId={coverArtId}
        onSaved={handleInfoSaved}
        onDeleted={handleInfoDeleted}
        initialView={infoModalInitialView}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pillTextIndent: {marginLeft: 5},
  editBarRight: {alignItems: 'flex-end'},
  root: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.78,
  },
  // Fixed top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TOP_BAR_H,
    paddingHorizontal: 12,
  },
  backBtn: {
    padding: 6,
  },
  // Search inside scroll
  searchInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 0,
  },
  // List
  listContent: {
    paddingBottom: 150,
  },
  // Header
  coverWrap: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 22,
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.75,
    shadowRadius: 22,
    elevation: 18,
  },
  coverLocalImg: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 8,
  },
  meta: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  playlistName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaSub: {
    fontSize: 13,
    color: '#aaa',
  },
  metaDot: {
    fontSize: 13,
    color: '#555',
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: darkTheme.accent,
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionBtn: {
    padding: 10,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: darkTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Song row
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  songCoverPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: darkTheme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  songArtist: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2,
  },
  songDots: {
    padding: 8,
  },
  // Recommendations
  recoSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  recoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  recoSub: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
  },
  recoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  recoCover: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: darkTheme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoInfo: {
    flex: 1,
  },
  recoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ddd',
  },
  recoArtist: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Edit mode
  editBg: {
    backgroundColor: '#121212',
  },
  editBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: '#121212',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  editBarSide: {
    width: 100,
    padding: 6,
  },
  editBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: darkTheme.accent,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#121212',
  },
  editRowActive: {
    backgroundColor: '#2A2A2A',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  editMinusBtn: {
    padding: 4,
  },
  editSongTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editSongArtist: {
    fontSize: 14,
    color: '#A7A7A7',
    marginTop: 2,
  },
  dragHandle: {
    padding: 8,
  },
});
