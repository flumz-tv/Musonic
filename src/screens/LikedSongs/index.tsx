/**
 * @file index.tsx
 * @description Liked Songs screen. Displays all starred tracks with playback,
 *   add-to-playlist, and remove-from-liked actions.
 * @author DoodzProg
 * @version 0.9.1
 * @license MIT
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {darkTheme} from '../../theme';
import {getStarred} from '../../api/endpoints/library';
import {getStreamUrl, getCoverArtUrl} from '../../api/client';
import {loadAndPlayTracks} from '../../services/playerActions';
import {usePlayerStore} from '../../store/playerStore';
import type {SubsonicSong} from '../../api/types';
import type {Track} from '../../store/playerStore';
import CoverArt from '../../components/CoverArt';
import HeartIcon from '../../components/icons/HeartIcon';
import ShuffleIcon from '../../components/icons/ShuffleIcon';
import SongOptionsSheet from '../../components/SongOptionsSheet';
import {showToast} from '../../components/Toast';
import {useT} from '../../i18n';

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M20 12 H4 M10 18 L4 12 L10 6"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#000">
      <Path d="M6 4l14 8-14 8V4z" />
    </Svg>
  );
}


function ThreeDotsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#b3b3b3">
      <Path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </Svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function songToTrack(s: SubsonicSong): Track {
  const id = String(s.id);
  return {
    id,
    title: s.title,
    artist: s.artist,
    album: s.album || '',
    duration: s.duration || 0,
    coverArt: s.coverArt,
    streamUrl: getStreamUrl(id),
    url: getStreamUrl(id),
    artwork: getCoverArtUrl(s.coverArt || id, 300),
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LikedSongsScreen() {
  const t = useT();
  const navigation = useNavigation<any>();
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const setLikedSongs = usePlayerStore(s => s.setLikedSongs);
  const localLikeOverrides = usePlayerStore(s => s.localLikeOverrides);
  const [songs, setSongs] = useState<SubsonicSong[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSong, setSelectedSong] = useState<SubsonicSong | null>(null);
  const [songOptsVisible, setSongOptsVisible] = useState(false);
  useFocusEffect(useCallback(() => {
    setLoading(true);
    getStarred()
      .then(d => {
        setSongs(d.songs);
        setLikedSongs(d.songs.map(s => String(s.id)));
      })
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, [setLikedSongs]));

  const displayedSongs = songs.filter(s => localLikeOverrides[String(s.id)] !== false);

  const handlePlayAll = useCallback(() => {
    if (displayedSongs.length === 0) return;
    const tracks = displayedSongs.map(songToTrack);
    const ordered = isShuffled ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    loadAndPlayTracks(ordered, 0);
  }, [displayedSongs, isShuffled]);

  const handlePressSong = useCallback(
    (index: number) => {
      loadAndPlayTracks(displayedSongs.map(songToTrack), index);
    },
    [displayedSongs],
  );

  const handleMore = useCallback((song: SubsonicSong) => {
    setSelectedSong(song);
    setSongOptsVisible(true);
  }, []);

  const handleNavigateAlbum = useCallback((albumId: string) => {
    navigation.navigate('AlbumDetail', {albumId});
  }, [navigation]);

  const handleNavigateArtist = useCallback((artistId: string | undefined, artistName: string) => {
    navigation.navigate('ArtistDetail', {artistId, artistName});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1040" />

      <FlatList
        data={displayedSongs}
        keyExtractor={s => s.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={['#3d1870', '#1a1040', darkTheme.background]}
              style={styles.headerGrad}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}>
                <BackIcon />
              </TouchableOpacity>
              <LinearGradient
                colors={['#6B2FA0', '#1E3A8A']}
                style={styles.headerCover}>
                <HeartIcon size={72} color="#fff" filled />
              </LinearGradient>
              <Text style={styles.title}>{t.likedSongs.title}</Text>
              <Text style={styles.subtitle}>
                {loading ? '…' : t.likedSongs.trackCount(displayedSongs.length)}
              </Text>
            </LinearGradient>

            {!loading && displayedSongs.length > 0 && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={toggleShuffle}
                  activeOpacity={0.8}>
                  <ShuffleIcon active={isShuffled} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={handlePlayAll}
                  activeOpacity={0.85}>
                  <PlayIcon />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={darkTheme.accent} />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.likedSongs.emptyState}</Text>
            </View>
          )
        }
        renderItem={({item, index}) => (
          <TouchableOpacity
            style={styles.songRow}
            onPress={() => handlePressSong(index)}
            onLongPress={() => handleMore(item)}
            activeOpacity={0.7}>
            <CoverArt id={item.coverArt} size={48} borderRadius={4} />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => handleMore(item)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ThreeDotsIcon />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      <SongOptionsSheet
        visible={songOptsVisible}
        onClose={() => setSongOptsVisible(false)}
        track={selectedSong}
        onToast={showToast}
        onNavigateAlbum={handleNavigateAlbum}
        onNavigateArtist={handleNavigateArtist}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: darkTheme.background},
  headerGrad: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 8,
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    padding: 6,
    zIndex: 10,
  },
  headerCover: {
    width: 160,
    height: 160,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#b3b3b3',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  shuffleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: darkTheme.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  listContent: {
    paddingBottom: 140,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
  center: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#b3b3b3',
    fontSize: 15,
    fontWeight: '500',
  },
});
