/**
 * @file index.tsx
 * @description Artist detail screen. Shows artist biography, top songs, and album
 *   discography fetched from the Subsonic API.
 * @author DoodzProg
 * @version 0.9.1
 * @license MIT
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {darkTheme} from '../../theme';
import {subsonicGet, getStreamUrl, getCoverArtUrl} from '../../api/client';
import {loadAndPlayTracks} from '../../services/playerActions';
import type {Track} from '../../store/playerStore';
import type {LibraryStackParams} from '../../navigation/types';
import AlbumCard from '../../components/AlbumCard';
import {useT, getT} from '../../i18n';

const {width: SCREEN_W} = Dimensions.get('window');
const COVER_SIZE = SCREEN_W;

// ─── Icons ─────────────────────────────────────────────────────────────────
function BackIcon({size = 24, color = '#fff'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M15 4 L7 12 L15 20" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>);
}
function PlayIcon({size = 24, color = '#000'}: {size?: number; color?: string}) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M7 4 L21 12 L7 20 Z" fill={color} /></Svg>);
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type RouteT = RouteProp<LibraryStackParams, 'ArtistDetail'>;

export default function ArtistDetailScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParams, 'ArtistDetail'>>();
  const route = useRoute<RouteT>();
  const {artistId: routeArtistId, artistName: routeArtistName} = route.params;

  const [artistName, setArtistName] = useState<string>(t.artistDetail.loading);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  const coverScale = scrollY.interpolate({ inputRange: [-100, 0, COVER_SIZE], outputRange: [1.3, 1, 1.1], extrapolate: 'clamp' });
  const coverOpacity = scrollY.interpolate({ inputRange: [0, COVER_SIZE * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });

  useEffect(() => {
    async function loadArtistData() {
      try {
        let artistId = routeArtistId;
        if (!artistId && routeArtistName) {
          const res = await subsonicGet<any>('search3.view', {query: routeArtistName, artistCount: 1, albumCount: 0, songCount: 0});
          const d = res['subsonic-response'] || res;
          artistId = d.searchResult3?.artist?.[0]?.id;
        }
        if (!artistId) {
          setArtistName(routeArtistName || getT().artistDetail.unknownArtist);
          if (routeArtistName) {
            const r = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(routeArtistName)}`);
            const j = await r.json();
            if (j.data?.length > 0) setArtistImage(j.data[0].picture_xl);
          }
          setLoading(false);
          return;
        }
        const resArtist = await subsonicGet<any>('getArtist.view', { id: artistId });
        const data = resArtist['subsonic-response'] || resArtist;
        const artistData = data.artist || {};
        
        setArtistName(artistData.name || getT().artistDetail.unknownArtist);
        setAlbums(artistData.album || []);

        try {
          const resTop = await subsonicGet<any>('getTopSongs.view', { artist: artistData.name });
          const topData = resTop['subsonic-response'] || resTop;
          setTopSongs(topData.topSongs?.song || []);
        } catch { console.warn('getTopSongs not supported'); }

        if (artistData.name) {
          const resDeezer = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistData.name)}`);
          const jsonDeezer = await resDeezer.json();
          if (jsonDeezer.data && jsonDeezer.data.length > 0) {
            setArtistImage(jsonDeezer.data[0].picture_xl);
          }
        }
      } catch (error) {
        console.warn('ArtistDetail load error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadArtistData();
  }, [routeArtistId, routeArtistName]);

  const handlePlayTopSongs = useCallback(async () => {
    if (!topSongs.length) return;
    const tracks: Track[] = topSongs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      artistId: s.artistId,
      album: s.album,
      duration: s.duration || 0,
      coverArt: s.coverArt,
      streamUrl: getStreamUrl(s.id),
      url: getStreamUrl(s.id),
      artwork: getCoverArtUrl(s.coverArt || s.id, 300),
    }));
    await loadAndPlayTracks(tracks, 0);
  }, [topSongs]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[styles.coverWrap, { transform: [{scale: coverScale}], opacity: coverOpacity }]}>
        {artistImage ? (
          <Image source={{uri: artistImage}} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]} />
        )}
        <LinearGradient colors={['transparent', darkTheme.background]} style={styles.coverGradient} />
      </Animated.View>

      <View style={[styles.topBar, {paddingTop: insets.top}]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnBg}><BackIcon size={24} /></View>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: true})}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.artistName}>{artistName}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={darkTheme.accent} style={styles.loader} />
        ) : (
          <View style={styles.content}>
            
            {topSongs.length > 0 && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.playBtn} onPress={handlePlayTopSongs}>
                  <PlayIcon size={24} />
                </TouchableOpacity>
              </View>
            )}

            {topSongs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.artistDetail.popularSongs}</Text>
                {topSongs.slice(0, 5).map((song, index) => (
                  <View key={song.id} style={styles.songRow}>
                    <Text style={styles.songIndex}>{index + 1}</Text>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{song.album}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.artistDetail.popularReleases}</Text>
                <FlatList
                  horizontal
                  data={albums}
                  keyExtractor={a => a.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hList}
                  renderItem={({item}) => (
                    <AlbumCard 
                      id={item.id} 
                      name={item.name} 
                      artist={item.artist} 
                      coverArt={item.coverArt}
                      onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
                    />
                  )}
                />
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  coverPlaceholder: {backgroundColor: '#333'},
  scrollContent: {paddingTop: COVER_SIZE * 0.7, paddingBottom: 100},
  loader: {marginTop: 50},
  root: { flex: 1, backgroundColor: darkTheme.background },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 12 },
  backBtn: { padding: 6, alignSelf: 'flex-start' },
  backBtnBg: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  coverWrap: { position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: COVER_SIZE },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: COVER_SIZE * 0.6 },
  artistName: { fontSize: 44, fontWeight: '900', color: '#fff', paddingHorizontal: 16, marginBottom: 16 },
  content: { flex: 1, backgroundColor: darkTheme.background },
  actionRow: { paddingHorizontal: 16, marginBottom: 24, flexDirection: 'row', justifyContent: 'flex-end' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: darkTheme.accent, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 16 },
  hList: { paddingHorizontal: 16, gap: 16 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 16 },
  songIndex: { width: 20, fontSize: 14, fontWeight: '600', color: '#888', textAlign: 'center' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
  songArtist: { fontSize: 13, color: '#aaa', marginTop: 2 },
});