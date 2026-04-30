/**
 * @file index.tsx
 * @description Home screen. Displays personalised quick-access cards, recently
 *   played albums, frequently played albums, AI-recommended songs, and a discover
 *   section of similar artists. Supports filter pills, pull-to-refresh, and
 *   auto-recovery when connectivity is restored.
 * @author DoodzProg
 * @version 0.9.1
 * @license MIT
 */

import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {darkTheme} from '../../theme';
import {
  getRecentAlbums,
  getFrequentAlbums,
  getStarred,
  getSimilarSongs,
  getSimilarArtists,
} from '../../api/endpoints/library';
import {getPlaylists} from '../../api/endpoints/playlists';
import {getArtistImage} from '../../api/lastfm';
import {getStreamUrl, getCoverArtUrl} from '../../api/client';
import {loadAndPlayAlbum, loadAndPlayTracks} from '../../services/playerActions';
import { usePlayerStore, type Track } from '../../store/playerStore';
import type {SubsonicAlbum, SubsonicSong, SubsonicSimilarArtist, SubsonicPlaylist} from '../../api/types';
import AlbumCard from '../../components/AlbumCard';
import ArtistCard from '../../components/ArtistCard';
import QuickAccessCard from '../../components/QuickAccessCard';
import SectionHeader from '../../components/SectionHeader';
import HeartIcon from '../../components/icons/HeartIcon';
import GlobalHeader from '../../components/GlobalHeader';
import {useT} from '../../i18n';
import {useNetworkStore} from '../../store/networkStore';

type FilterKey = 'all' | 'recent' | 'frequent' | 'reco' | 'discover';

type HomeData = {
  recentAlbums: SubsonicAlbum[];
  frequentAlbums: SubsonicAlbum[];
  recommendedSongs: SubsonicSong[];
  discoverArtists: SubsonicSimilarArtist[];
  playlists: SubsonicPlaylist[];
  likedCount: number;
};

export default function HomeScreen() {
  const t = useT();
  const filters: {key: FilterKey; label: string}[] = [
    {key: 'all', label: t.home.filters.all},
    {key: 'recent', label: t.home.filters.recent},
    {key: 'frequent', label: t.home.filters.frequent},
    {key: 'reco', label: t.home.filters.reco},
    {key: 'discover', label: t.home.filters.discover},
  ];

  const [data, setData] = useState<HomeData>({
    recentAlbums: [],
    frequentAlbums: [],
    recommendedSongs: [],
    discoverArtists: [],
    playlists: [],
    likedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const scrollRef = useRef<ScrollView>(null);
  const sectionYs = useRef<Partial<Record<FilterKey, number>>>({});

  const playlistVersion = usePlayerStore(s => s.playlistVersion);

  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    try {
      const [recent, frequent, starred, playlists] = await Promise.all([
        getRecentAlbums(8),
        getFrequentAlbums(8),
        getStarred(),
        getPlaylists().catch(() => [] as SubsonicPlaylist[]),
      ]);

      const seedArtistIds = frequent
        .slice(0, 3)
        .map(a => a.artistId)
        .filter(Boolean);

      const [songArrays, artistArrays] = await Promise.all([
        Promise.all(seedArtistIds.map(id => getSimilarSongs(id, 10).catch(() => []))),
        Promise.all(seedArtistIds.map(id => getSimilarArtists(id, 8).catch(() => []))),
      ]);

      const allSongs = songArrays.flat();
      for (let i = allSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
      }
      const seenSongs = new Set<string>();
      const artistSongCount = new Map<string, number>();
      const recommendedSongs = allSongs
        .filter(s => {
          if (seenSongs.has(s.id)) return false;
          const key = s.artistId ?? s.artist;
          const count = artistSongCount.get(key) ?? 0;
          if (count >= 2) return false;
          seenSongs.add(s.id);
          artistSongCount.set(key, count + 1);
          return true;
        })
        .slice(0, 15);

      const seenArtists = new Set<string>();
      const rawDiscover = artistArrays
        .flat()
        .filter(a => {
          if (a.present || seenArtists.has(a.id)) return false;
          seenArtists.add(a.id);
          return true;
        })
        .slice(0, 12);

      const discoverArtists = await Promise.all(
        rawDiscover.map(async a => ({
          ...a,
          artistImageUrl: (await getArtistImage(a.name)) ?? undefined,
        })),
      );

      setData({
        recentAlbums: recent,
        frequentAlbums: frequent,
        recommendedSongs,
        discoverArtists,
        playlists,
        likedCount: starred.songs.length,
      });
      setError(false);
    } catch (e) {
      console.warn('Home load error', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, playlistVersion]);

  // ─── Auto-recovery when connectivity is restored ──────────────────────────
  const isOffline = useNetworkStore(s => s.isOffline);
  const prevOfflineRef = useRef(isOffline);
  const errorRef = useRef(error);
  errorRef.current = error;

  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = isOffline;
    if (wasOffline && !isOffline && errorRef.current) {
      setError(false);
      setLoading(true);
      load();
    }
  }, [isOffline, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleFilter = (key: string) => {
    setActiveFilter(key as FilterKey);
    if (key === 'all') {
      scrollRef.current?.scrollTo({y: 0, animated: true});
    } else if (sectionYs.current[key as FilterKey] !== undefined) {
      scrollRef.current?.scrollTo({y: sectionYs.current[key as FilterKey]!, animated: true});
    }
  };

  type QuickItem = {
    id: string;
    name: string;
    coverArt?: string;
    accent?: string;
    isLiked: boolean;
    kind: 'liked' | 'playlist' | 'album';
  };

  const likedItem: QuickItem = {
    id: 'liked',
    name: t.home.likedSongs,
    coverArt: undefined,
    accent: '#5038A0',
    isLiked: true,
    kind: 'liked',
  };
  const playlistItems: QuickItem[] = data.playlists.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    coverArt: p.coverArt,
    accent: undefined,
    isLiked: false,
    kind: 'playlist',
  }));
  const albumFill: QuickItem[] = data.recentAlbums
    .slice(0, Math.max(0, 5 - playlistItems.length))
    .map(a => ({
      id: a.id,
      name: a.name,
      coverArt: a.coverArt,
      accent: undefined,
      isLiked: false,
      kind: 'album' as const,
    }));
  const quickItems = [likedItem, ...playlistItems, ...albumFill].slice(0, 6);

  const handleQuickPress = useCallback(
    (item: QuickItem) => {
      if (item.kind === 'playlist') {
        navigation.navigate('PlaylistDetail', {playlistId: item.id});
      } else if (item.kind === 'album') {
        navigation.navigate('AlbumDetail', {albumId: item.id});
      } else if (item.kind === 'liked') {
        navigation.navigate('LikedSongs');
      }
    },
    [navigation],
  );

  const handlePlayReco = useCallback(
    (index: number) => {
      if (data.recommendedSongs.length === 0) return;
      const tracks: Track[] = data.recommendedSongs.map(s => {
        const trackId = String(s.id);
        return {
          id: trackId,
          title: s.title,
          artist: s.artist,
          album: s.album,
          duration: s.duration,
          coverArt: s.coverArt || trackId,
          streamUrl: getStreamUrl(trackId),
          url: getStreamUrl(trackId),
          artwork: getCoverArtUrl(s.coverArt || trackId, 300),
          artistId: s.artistId,
        };
      });
      loadAndPlayTracks(tracks, index);
    },
    [data.recommendedSongs],
  );

  const quickRows: typeof quickItems[] = [];
  for (let i = 0; i < Math.min(quickItems.length, 8); i += 2) {
    quickRows.push(quickItems.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.background} />

      <GlobalHeader
        variant="home"
        filters={filters}
        activeFilter={activeFilter}
        onFilterPress={handleFilter}
      />

      {/* Scrollable content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkTheme.accent}
          />
        }>

        {/* Error state */}
        {!loading && error && data.recentAlbums.length === 0 && (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{t.home.loadError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setError(false); setLoading(true); load(); }}
              activeOpacity={0.7}>
              <Text style={styles.retryText}>{t.common.retry}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick access grid */}
        {!loading && !error && quickRows.length > 0 && (
          <View style={styles.quickGrid}>
            {quickRows.map((row, i) => (
              <View key={i} style={styles.quickRow}>
                {row.map(item => (
                  <QuickAccessCard
                    key={item.id}
                    name={item.name}
                    coverArt={item.coverArt}
                    accent={item.accent}
                    icon={
                      item.isLiked ? (
                        <HeartIcon size={26} color="#fff" filled />
                      ) : undefined
                    }
                    onPress={() => handleQuickPress(item)}
                  />
                ))}
                {row.length === 1 && <View style={styles.spacer} />}
              </View>
            ))}
          </View>
        )}

        {/* Recently played */}
        {!error && data.recentAlbums.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current.recent = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title={t.home.sections.recentlyPlayed} />
            <FlatList
              horizontal
              data={data.recentAlbums}
              keyExtractor={a => a.id}
              renderItem={({item}) => (
                <AlbumCard
                  id={item.id}
                  name={item.name}
                  artist={item.artist}
                  coverArt={item.coverArt}
                  label={item.songCount === 1 ? t.home.typeSingle : t.home.typeAlbum}
                  onPress={() =>
                    item.songCount === 1
                      ? loadAndPlayAlbum(item.id)
                      : navigation.navigate('AlbumDetail', {albumId: item.id})
                  }
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Frequently played */}
        {!error && data.frequentAlbums.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current.frequent = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title={t.home.sections.frequentlyPlayed} />
            <FlatList
              horizontal
              data={data.frequentAlbums}
              keyExtractor={a => a.id}
              renderItem={({item}) => (
                <AlbumCard
                  id={item.id}
                  name={item.name}
                  artist={item.artist}
                  coverArt={item.coverArt}
                  label={item.songCount === 1 ? t.home.typeSingle : t.home.typeAlbum}
                  onPress={() =>
                    item.songCount === 1
                      ? loadAndPlayAlbum(item.id)
                      : navigation.navigate('AlbumDetail', {albumId: item.id})
                  }
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Recommendations */}
        {!error && data.recommendedSongs.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current.reco = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title={t.home.sections.recommendations} />
            <FlatList
              horizontal
              data={data.recommendedSongs}
              keyExtractor={s => s.id}
              renderItem={({item, index}) => (
                <AlbumCard
                  id={item.id}
                  name={item.title}
                  artist={item.artist}
                  coverArt={item.coverArt}
                  onPress={() => handlePlayReco(index)}
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Discover */}
        {!error && data.discoverArtists.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current.discover = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title={t.home.sections.discover} />
            <FlatList
              horizontal
              data={data.discoverArtists}
              keyExtractor={a => a.id}
              renderItem={({item}) => (
                <ArtistCard
                  id={item.id}
                  name={item.name}
                  coverArt={item.coverArt}
                  imageUrl={item.artistImageUrl}
                  onPress={() => navigation.navigate('ArtistDetail', {artistId: item.id})}
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  spacer: {flex: 1},
  root: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  quickGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  bottomPad: {height: 200},
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#E84040',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#282828',
    borderWidth: 1,
    borderColor: '#444',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
