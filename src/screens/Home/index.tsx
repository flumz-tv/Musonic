import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  StatusBar,
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
import {getStreamUrl} from '../../api/client';
import {playTrack} from '../../services/playerActions';
import { usePlayerStore, type Track } from '../../store/playerStore';
import type {SubsonicAlbum, SubsonicSong, SubsonicSimilarArtist, SubsonicPlaylist} from '../../api/types';
import AlbumCard from '../../components/AlbumCard';
import ArtistCard from '../../components/ArtistCard';
import QuickAccessCard from '../../components/QuickAccessCard';
import SectionHeader from '../../components/SectionHeader';
import HeartIcon from '../../components/icons/HeartIcon';
import GlobalHeader from '../../components/GlobalHeader';
import {t} from '../../i18n/fr';

const FILTERS = [
  {key: 'all', label: t.home.filters.all},
  {key: 'recent', label: t.home.filters.recent},
  {key: 'frequent', label: t.home.filters.frequent},
  {key: 'reco', label: t.home.filters.reco},
  {key: 'discover', label: t.home.filters.discover},
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

type HomeData = {
  recentAlbums: SubsonicAlbum[];
  frequentAlbums: SubsonicAlbum[];
  recommendedSongs: SubsonicSong[];
  discoverArtists: SubsonicSimilarArtist[];
  playlists: SubsonicPlaylist[];
  likedCount: number;
};

export default function HomeScreen() {
  const [data, setData] = useState<HomeData>({
    recentAlbums: [],
    frequentAlbums: [],
    recommendedSongs: [],
    discoverArtists: [],
    playlists: [],
    likedCount: 0,
  });
  const [loading, setLoading] = useState(true);
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
          artistImageUrl: await getArtistImage(a.name),
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
    } catch (e) {
      console.warn('Home load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, playlistVersion]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleFilter = (key: FilterKey) => {
    setActiveFilter(key);
    if (key === 'all') {
      scrollRef.current?.scrollTo({y: 0, animated: true});
    } else if (sectionYs.current[key] !== undefined) {
      scrollRef.current?.scrollTo({y: sectionYs.current[key]!, animated: true});
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
        navigation.navigate('Library', {
          screen: 'PlaylistDetail',
          params: {playlistId: item.id},
        });
      } else if (item.kind === 'album') {
        navigation.navigate('Library', {
          screen: 'AlbumDetail',
          params: {albumId: item.id},
        });
      } else if (item.kind === 'liked') {
        navigation.navigate('Library', {screen: 'LikedSongs'}); 
      }
    },
    [navigation],
  );

  const handlePlaySong = useCallback((s: any) => {
    const trackId = String(s.id || s.songId || s.trackId);
    if (!trackId || trackId === 'undefined') return;

    const stream = getStreamUrl(trackId);

    const track = {
      id: trackId,
      title: s.title || s.name || t.home.unknownTitle,
      artist: s.artist || t.home.unknownArtist,
      album: s.album || 'Single',
      duration: Number(s.duration) || 0,
      coverArt: s.coverArt || s.albumId || trackId,
      streamUrl: stream,
      url: stream,
    } as Track;

    playTrack(track);
  }, []);

  const quickRows: typeof quickItems[] = [];
  for (let i = 0; i < Math.min(quickItems.length, 8); i += 2) {
    quickRows.push(quickItems.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.background} />

      <GlobalHeader
        variant="home"
        filters={FILTERS}
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

        {/* Quick access grid */}
        {!loading && quickRows.length > 0 && (
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
                {row.length === 1 && <View style={{flex: 1}} />}
              </View>
            ))}
          </View>
        )}

        {/* Recently played */}
        {data.recentAlbums.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current['recent'] = e.nativeEvent.layout.y;
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
                  onPress={() => navigation.navigate('Library', { 
                    screen: 'AlbumDetail', 
                    params: { albumId: item.id } 
                  })}
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Frequently played */}
        {data.frequentAlbums.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current['frequent'] = e.nativeEvent.layout.y;
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
                  onPress={() => navigation.navigate('Library', { 
                    screen: 'AlbumDetail', 
                    params: { albumId: item.id } 
                  })}
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Recommendations */}
        {data.recommendedSongs.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current['reco'] = e.nativeEvent.layout.y;
            }}>
            <SectionHeader title={t.home.sections.recommendations} />
            <FlatList
              horizontal
              data={data.recommendedSongs}
              keyExtractor={s => s.id}
              renderItem={({item}) => (
                <AlbumCard
                  id={item.id}
                  name={item.title || item.name}
                  artist={item.artist}
                  coverArt={item.coverArt}
                  onPress={() => handlePlaySong(item)}
                />
              )}
              contentContainerStyle={styles.hList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Discover */}
        {data.discoverArtists.length > 0 && (
          <View
            onLayout={e => {
              sectionYs.current['discover'] = e.nativeEvent.layout.y;
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
                  onPress={() => navigation.navigate('Library', { 
                    screen: 'ArtistDetail', 
                    params: { artistId: item.id } 
                  })}
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
  bottomPad: {height: 100},
});
