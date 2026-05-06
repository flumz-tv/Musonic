/**
 * @file SearchActive.tsx
 * @description Live search screen. Single FlatList with 1:1:3 artist/album/song
 *   interleave. Subsonic results are immediate; Deezer artist images are enriched
 *   asynchronously using a generation counter to prevent race conditions.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React, {useState, useEffect, useRef, useCallback, memo} from 'react';
import {
  View, StyleSheet, StatusBar, TextInput, TouchableOpacity,
  Text, ActivityIndicator, FlatList, Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Path, Circle} from 'react-native-svg';
import {darkTheme} from '../../theme';
import {search, getDeezerArtistImageCached} from '../../api/endpoints/search';
import {getStreamUrl, getCoverArtUrl} from '../../api/client';
import {loadAndPlayTracks} from '../../services/playerActions';
import type {SubsonicArtist, SubsonicAlbum, SubsonicSong} from '../../api/types';
import type {Track} from '../../store/playerStore';
import CoverArt from '../../components/CoverArt';
import SongOptionsSheet from '../../components/SongOptionsSheet';
import {showToast} from '../../components/Toast';
import {useT} from '../../i18n';
import {useSearchHistoryStore} from '../../store/searchHistoryStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchItem =
  | {type: 'artist'; data: SubsonicArtist}
  | {type: 'album';  data: SubsonicAlbum}
  | {type: 'song';   data: SubsonicSong};

function mergeResults(
  artists: SubsonicArtist[],
  albums: SubsonicAlbum[],
  songs: SubsonicSong[],
): SearchItem[] {
  const out: SearchItem[] = [];
  let ai = 0, li = 0, si = 0;
  while (ai < artists.length || li < albums.length || si < songs.length) {
    if (ai < artists.length) out.push({type: 'artist', data: artists[ai++]});
    if (li < albums.length)  out.push({type: 'album',  data: albums[li++]});
    for (let i = 0; i < 3 && si < songs.length; i++) out.push({type: 'song', data: songs[si++]});
  }
  return out;
}

function songToTrack(s: SubsonicSong): Track {
  const sid = String(s.id);
  return {
    id: sid,
    title: s.title,
    artist: s.artist,
    album: s.album || '',
    duration: s.duration || 0,
    coverArt: s.coverArt,
    streamUrl: getStreamUrl(sid),
    url: getStreamUrl(sid),
    artwork: getCoverArtUrl(s.coverArt || sid, 300),
  };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon({size = 24, color = '#fff'}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 12 H4 M10 18 L4 12 L10 6"
        stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

function ThreeDotsIcon({size = 20, color = '#b3b3b3'}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </Svg>
  );
}

function ClockIcon({size = 18, color = '#707070'}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Row Components ───────────────────────────────────────────────────────────

type ArtistRowProps = {
  artist: SubsonicArtist;
  imageUrl: string | null | undefined;
  onPress: () => void;
};

const ArtistResultRow = memo(
  function ArtistResultRow({artist, imageUrl, onPress}: ArtistRowProps) {
    const tr = useT();
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.roundImg} />
        ) : (
          <View style={[styles.roundImg, styles.roundImgPlaceholder]} />
        )}
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>{artist.name}</Text>
          <Text style={styles.rowMeta}>{tr.search.artistType}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.artist.id === next.artist.id && prev.imageUrl === next.imageUrl,
);

function AlbumResultRow({album, onPress}: {album: SubsonicAlbum; onPress: () => void}) {
  const tr = useT();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <CoverArt id={album.coverArt} size={48} borderRadius={4} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{album.name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{tr.search.albumType} • {album.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SongResultRow({
  song, onPress, onMore,
}: {song: SubsonicSong; onPress: () => void; onMore: () => void}) {
  const tr = useT();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onMore}
      delayLongPress={400}
      activeOpacity={0.7}>
      <CoverArt id={song.coverArt} size={48} borderRadius={4} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{tr.search.trackType} • {song.artist}</Text>
      </View>
      <TouchableOpacity
        style={styles.moreBtn}
        onPress={onMore}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <ThreeDotsIcon />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── History Section ──────────────────────────────────────────────────────────

function SearchHistorySection({
  history, onSelect, onClear,
}: {history: string[]; onSelect: (term: string) => void; onClear: () => void}) {
  const tr = useT();
  if (!history.length) return null;
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.historySectionTitle}>{tr.search.history.title}</Text>
        <TouchableOpacity onPress={onClear} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.historyClearText}>{tr.search.history.clear}</Text>
        </TouchableOpacity>
      </View>
      {history.map(term => (
        <TouchableOpacity
          key={term}
          style={styles.historyItem}
          onPress={() => onSelect(term)}
          activeOpacity={0.6}>
          <ClockIcon />
          <Text style={styles.historyItemText} numberOfLines={1}>{term}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchActive() {
  const t = useT();
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [artistImages, setArtistImages] = useState<Map<string, string | null>>(new Map());
  const genRef = useRef(0);
  const allSongsRef = useRef<SubsonicSong[]>([]);

  const {history, addTerm, clearHistory} = useSearchHistoryStore();
  const [selectedSong, setSelectedSong] = useState<SubsonicSong | null>(null);
  const [songOptsVisible, setSongOptsVisible] = useState(false);

  const handleMore = useCallback((song: SubsonicSong) => {
    setSelectedSong(song);
    setSongOptsVisible(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (q) addTerm(q);
  }, [query, addTerm]);

  const handleSelectHistory = useCallback((term: string) => {
    addTerm(term);
    setQuery(term);
    inputRef.current?.blur();
  }, [addTerm]);

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      genRef.current += 1;
      setItems([]);
      setArtistImages(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    genRef.current += 1;
    const myGen = genRef.current;

    const debounce = setTimeout(async () => {
      if (genRef.current !== myGen) return;
      try {
        const data = await search(query);
        if (genRef.current !== myGen) return;

        allSongsRef.current = data.songs;
        setItems(mergeResults(data.artists, data.albums, data.songs));
        setArtistImages(new Map());
        setLoading(false);

        // Async Deezer enrichment for artists without a Subsonic coverArt
        const needEnrich = data.artists.filter(a => !a.artistImageUrl);
        for (const artist of needEnrich) {
          if (genRef.current !== myGen) break;
          const url = await getDeezerArtistImageCached(artist.name);
          if (genRef.current !== myGen) break;
          if (url) {
            setArtistImages(prev => {
              const next = new Map(prev);
              next.set(artist.id, url);
              return next;
            });
          }
        }
      } catch {
        if (genRef.current !== myGen) return;
        setItems([]);
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [query]);

  const handlePlaySong = useCallback((song: SubsonicSong) => {
    const songs = allSongsRef.current;
    const tracks = songs.map(songToTrack);
    const startIndex = songs.findIndex(s => String(s.id) === String(song.id));
    loadAndPlayTracks(tracks, startIndex >= 0 ? startIndex : 0);
  }, []);

  const renderItem = useCallback(({item}: {item: SearchItem}) => {
    if (item.type === 'artist') {
      const imageUrl = item.data.artistImageUrl ?? artistImages.get(item.data.id) ?? null;
      return (
        <ArtistResultRow
          artist={item.data}
          imageUrl={imageUrl}
          onPress={() => navigation.push('ArtistDetail', {artistId: item.data.id, artistName: item.data.name})}
        />
      );
    }
    if (item.type === 'album') {
      return (
        <AlbumResultRow
          album={item.data}
          onPress={() => navigation.push('AlbumDetail', {albumId: item.data.id})}
        />
      );
    }
    return (
      <SongResultRow
        song={item.data}
        onPress={() => handlePlaySong(item.data)}
        onMore={() => handleMore(item.data)}
      />
    );
  }, [artistImages, navigation, handlePlaySong, handleMore]);

  const keyExtractor = useCallback((item: SearchItem) => `${item.type}-${item.data.id}`, []);

  const showHistory = !query.trim() && history.length > 0;
  const showNoResults = !loading && items.length === 0 && query.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t.search.placeholder}
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={darkTheme.accent}
            returnKeyType="search"
          />
        </View>
      </View>

      {showHistory ? (
        <SearchHistorySection
          history={history}
          onSelect={handleSelectHistory}
          onClear={clearHistory}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={darkTheme.accent} />
        </View>
      ) : showNoResults ? (
        <View style={styles.center}>
          <Text style={styles.noResultsText}>{t.search.noResults(query)}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={artistImages}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        />
      )}

      <SongOptionsSheet
        visible={songOptsVisible}
        onClose={() => setSongOptsVisible(false)}
        track={selectedSong}
        onToast={showToast}
        onNavigateAlbum={albumId => {
          setSongOptsVisible(false);
          navigation.push('AlbumDetail', {albumId});
        }}
        onNavigateArtist={(artistId, artistName) => {
          setSongOptsVisible(false);
          navigation.push('ArtistDetail', {artistId, artistName});
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: darkTheme.background},
  header: {
    flexDirection: 'row', alignItems: 'center',
    height: 60, backgroundColor: '#121212', paddingRight: 16,
  },
  backBtn: {padding: 16},
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#282828', borderRadius: 4, height: 40,
  },
  input: {flex: 1, color: '#fff', fontSize: 14, fontWeight: '500', paddingHorizontal: 12, height: '100%'},
  center: {marginTop: 80, alignItems: 'center'},
  noResultsText: {color: '#b3b3b3', fontSize: 16, fontWeight: '500'},
  listContent: {paddingTop: 8, paddingBottom: 120},
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8},
  roundImg: {width: 48, height: 48, borderRadius: 24},
  roundImgPlaceholder: {backgroundColor: '#333'},
  rowInfo: {flex: 1, marginLeft: 12},
  rowTitle: {color: '#fff', fontSize: 15, fontWeight: '500'},
  rowMeta: {color: '#b3b3b3', fontSize: 13, marginTop: 2},
  moreBtn: {padding: 8},
  historySection: {paddingTop: 16, paddingBottom: 8},
  historyHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4,
  },
  historySectionTitle: {fontSize: 16, fontWeight: '700', color: '#fff'},
  historyClearText: {fontSize: 13, fontWeight: '600', color: '#b3b3b3'},
  historyItem: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14},
  historyItemText: {flex: 1, color: '#e0e0e0', fontSize: 14, fontWeight: '500'},
});
