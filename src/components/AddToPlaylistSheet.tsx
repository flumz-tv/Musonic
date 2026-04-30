/**
 * @file AddToPlaylistSheet.tsx
 * @description Bottom sheet for adding one or more tracks to existing playlists
 *   or creating a new one. Updates the playlist membership cache on success.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import CoverArt from './CoverArt';
import {usePlayerStore} from '../store/playerStore';
import {usePlaylistCacheStore} from '../store/playlistCacheStore';
import {useT, getT} from '../i18n';
import {
  getPlaylists,
  getPlaylist,
  updatePlaylist,
  createPlaylist,
} from '../api/endpoints/playlists';
import {SubsonicError} from '../api/client';
import CreatePlaylistModal from './CreatePlaylistModal';
import type {SubsonicPlaylist} from '../api/types';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.91;

type PlaylistItem = SubsonicPlaylist & {
  containsTrack: boolean;
  trackIndex: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  trackId?: string;
  trackIds?: string[];
  trackTitle?: string;
  onToast: (message: string) => void;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckCircle({size = 26}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
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

function PlusCircle({size = 26}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={12} stroke="#535353" strokeWidth={1.5} fill="none" />
      <Path
        d="M13 8 L13 18 M8 13 L18 13"
        stroke="#B3B3B3"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={10} cy={10} r={6.5} fill="none" stroke="#888" strokeWidth={2} />
      <Path d="M14.8 14.8 L20 20" stroke="#888" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function PlaylistRow({
  item,
  onToggle,
}: {
  item: PlaylistItem;
  onToggle: (item: PlaylistItem) => void;
}) {
  const t = useT();
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => onToggle(item)}>
      <CoverArt id={item.coverArt} size={50} borderRadius={4} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.rowSub}>
          {t.addToPlaylist.trackCount(item.songCount)}
        </Text>
      </View>
      {item.containsTrack ? <CheckCircle /> : <PlusCircle />}
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AddToPlaylistSheet({
  visible,
  onClose,
  trackId,
  trackIds,
  trackTitle,
  onToast,
}: Props) {
  const t = useT();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');
  const scrollY = useRef(0);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const bumpPlaylistVersion = usePlayerStore(s => s.bumpPlaylistVersion);
  const setPlaylistSong = usePlayerStore(s => s.setPlaylistSong);
  const {addTracks: cacheAdd, removeTrack: cacheRemove} = usePlaylistCacheStore();

  const isMultiMode = !!(trackIds?.length);

  const loadPlaylists = useCallback(async () => {
    if (!trackId && !isMultiMode) return;
    setLoading(true);
    try {
      const raw = await getPlaylists();
      if (isMultiMode) {
        setPlaylists(raw.map(p => ({...p, containsTrack: false, trackIndex: -1})));
      } else {
        const items = await Promise.all(
          raw.map(async p => {
            try {
              const {songs} = await getPlaylist(p.id);
              const idx = songs.findIndex(s => String(s.id) === String(trackId));
              return {...p, containsTrack: idx !== -1, trackIndex: idx} as PlaylistItem;
            } catch {
              return {...p, containsTrack: false, trackIndex: -1} as PlaylistItem;
            }
          }),
        );
        setPlaylists(items);
      }
    } catch (e) {
      console.warn('[AddToPlaylistSheet] load error', e);
    } finally {
      setLoading(false);
    }
  }, [trackId, isMultiMode]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.78,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      loadPlaylists();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity, loadPlaylists]);

  const handleToggle = useCallback(
    async (item: PlaylistItem) => {
      if (!trackId) return;

      if (item.containsTrack) {
        // Optimistic remove
        setPlaylists(prev =>
          prev.map(p =>
            p.id === item.id
              ? {
                  ...p,
                  containsTrack: false,
                  trackIndex: -1,
                  songCount: Math.max(0, p.songCount - 1),
                }
              : p,
          ),
        );
        onToast(getT().addToPlaylist.removedFrom(item.name));
        try {
          if (item.trackIndex >= 0) {
            await updatePlaylist(item.id, undefined, undefined, [item.trackIndex]);
            bumpPlaylistVersion();
            const stillInAny = playlists.some(
              p => p.id !== item.id && p.containsTrack,
            );
            if (trackId) {
              setPlaylistSong(trackId, stillInAny);
              if (!stillInAny) cacheRemove(trackId);
            }
          }
        } catch (e) {
          // Revert
          setPlaylists(prev =>
            prev.map(p =>
              p.id === item.id
                ? {
                    ...p,
                    containsTrack: true,
                    trackIndex: item.trackIndex,
                    songCount: p.songCount + 1,
                  }
                : p,
            ),
          );
          const isPermanent = e instanceof SubsonicError && e.isPermanent;
          if (isPermanent) {
            onToast(getT().addToPlaylist.unavailableTrack);
          }
          console.warn('[AddToPlaylistSheet] remove error:', e instanceof Error ? e.message : String(e));
        }
      } else {
        // Optimistic add — track will be appended at current songCount index
        const newIdx = item.songCount;
        setPlaylists(prev =>
          prev.map(p =>
            p.id === item.id
              ? {
                  ...p,
                  containsTrack: true,
                  trackIndex: newIdx,
                  songCount: p.songCount + 1,
                }
              : p,
          ),
        );
        onToast(getT().addToPlaylist.addedTo(item.name));
        try {
          await updatePlaylist(item.id, undefined, [String(trackId)]);
          bumpPlaylistVersion();
          if (trackId) { setPlaylistSong(trackId, true); cacheAdd([trackId]); }
        } catch (e) {
          // Revert
          setPlaylists(prev =>
            prev.map(p =>
              p.id === item.id
                ? {
                    ...p,
                    containsTrack: false,
                    trackIndex: -1,
                    songCount: Math.max(0, p.songCount - 1),
                  }
                : p,
            ),
          );
          const isPermanent = e instanceof SubsonicError && e.isPermanent;
          if (isPermanent) {
            onToast(getT().addToPlaylist.unavailableTrack);
          }
          console.warn('[AddToPlaylistSheet] add error:', e instanceof Error ? e.message : String(e));
        }
      }
    },
    [trackId, onToast, bumpPlaylistVersion, setPlaylistSong, playlists, cacheAdd, cacheRemove],
  );

  const handleAddAllToPlaylist = useCallback(
    async (item: PlaylistItem) => {
      if (!trackIds?.length) return;
      onClose();
      try {
        await updatePlaylist(item.id, undefined, trackIds.map(String));
        bumpPlaylistVersion();
        cacheAdd(trackIds.map(String));
        onToast(getT().playlistOptions.addedAllToPlaylist(trackIds.length, item.name));
      } catch {
        onToast(getT().playlistOptions.addToPlaylistError);
      }
    },
    [trackIds, onClose, onToast, bumpPlaylistVersion, cacheAdd],
  );

  const handleCreate = useCallback(
    async (name: string) => {
      setCreateModalVisible(false);
      onClose();
      if (!trackId) return;
      try {
        await createPlaylist(name, [String(trackId)]);
        setPlaylistSong(trackId, true);
        cacheAdd([trackId]);
        onToast(getT().addToPlaylist.addedTo(name));
        bumpPlaylistVersion();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[AddToPlaylistSheet] create error:', msg);
      }
    },
    [trackId, onClose, onToast, setPlaylistSong, bumpPlaylistVersion, cacheAdd],
  );

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50 || gs.vy > 0.3) {
          onClose();
        } else {
          Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
        }
      },
    }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, gs) =>
        gs.dy > 10 &&
        Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5 &&
        scrollY.current < 5,
      onMoveShouldSetPanResponder: (_e, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > 50 || gs.vy > 0.3) {
          onClose();
        } else {
          Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
        }
      },
    }),
  ).current;

  const filtered = search
    ? playlists.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : playlists;

  const active = filtered.filter(p => p.containsTrack);
  const others = filtered.filter(p => !p.containsTrack);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}>

        {/* Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay, {opacity: overlayOpacity},
          ]}
          pointerEvents="none"
        />

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, {transform: [{translateY}]}]}
          {...panResponder.panHandlers}>

          {/* Handle */}
          <View style={styles.handleArea} {...handlePanResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.addToPlaylist.savedIn}</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
              <Text style={styles.newPlaylistBtn}>{t.addToPlaylist.newPlaylist}</Text>
            </TouchableOpacity>
          </View>

          {trackTitle ? (
            <Text style={styles.trackSub} numberOfLines={1}>
              {trackTitle}
            </Text>
          ) : null}

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color="#1ED760" size="large" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={e => {
                scrollY.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}>

              {/* Active playlists (contains track) */}
              {active.map(item => (
                <PlaylistRow key={item.id} item={item} onToggle={isMultiMode ? handleAddAllToPlaylist : handleToggle} />
              ))}

              {/* Divider between active and others */}
              {active.length > 0 && <View style={styles.divider} />}

              {/* Search + Sort */}
              <View style={styles.searchRow}>
                <View style={styles.searchPill}>
                  <SearchIcon />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t.addToPlaylist.searchPlaceholder}
                    placeholderTextColor="#666"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
                <TouchableOpacity style={styles.sortBtn}>
                  <Text style={styles.sortText}>{t.addToPlaylist.sortButton}</Text>
                </TouchableOpacity>
              </View>

              {/* Other playlists */}
              {others.map(item => (
                <PlaylistRow key={item.id} item={item} onToggle={isMultiMode ? handleAddAllToPlaylist : handleToggle} />
              ))}

              {/* Footer: create new playlist */}
              <TouchableOpacity
                style={styles.footerRow}
                activeOpacity={0.7}
                onPress={() => setCreateModalVisible(true)}>
                <View style={styles.footerIcon}>
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Path
                      d="M12 5 L12 19 M5 12 L19 12"
                      stroke="#fff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                </View>
                <Text style={styles.footerText}>{t.addToPlaylist.newPlaylist}</Text>
              </TouchableOpacity>

            </ScrollView>
          )}
        </Animated.View>
      </Modal>

      <CreatePlaylistModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onCreate={handleCreate}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {backgroundColor: '#000'},
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#535353',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newPlaylistBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ED760',
  },
  trackSub: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#282828',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 0,
  },
  sortBtn: {
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sortText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rowName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  rowSub: {
    color: '#B3B3B3',
    fontSize: 13,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  footerIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#282828',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
