import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View, StyleSheet, StatusBar, TextInput, TouchableOpacity, ScrollView, Text, ActivityIndicator, FlatList
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';
import {darkTheme} from '../../theme';
import {search} from '../../api/endpoints/search';
import {getStreamUrl, getCoverArtUrl} from '../../api/client';
import {playTrack} from '../../services/playerActions';
import type {SubsonicSearchResult, SubsonicSong} from '../../api/types';
import type {Track} from '../../store/playerStore';
import AlbumCard from '../../components/AlbumCard';
import ArtistCard from '../../components/ArtistCard';
import CoverArt from '../../components/CoverArt';
import AddToPlaylistSheet from '../../components/AddToPlaylistSheet';
import Toast from '../../components/Toast';
import {t} from '../../i18n/fr';

// ─── Icons ─────────────────────────────────────────────────────────────────

function BackIcon({size = 24, color = '#fff'}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 12 H4 M10 18 L4 12 L10 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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

// ─── Song Item Component ───────────────────────────────────────────────────

function SongResultItem({song, onPress, onMore}: {song: SubsonicSong, onPress: () => void, onMore: () => void}) {
  return (
    <TouchableOpacity style={styles.songItem} onPress={onPress} activeOpacity={0.7}>
      <CoverArt id={song.coverArt} size={48} borderRadius={4} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songMeta} numberOfLines={1}>{t.search.trackType} • {song.artist}</Text>
      </View>
      <TouchableOpacity style={styles.moreBtn} onPress={onMore} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <ThreeDotsIcon />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SearchActive() {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SubsonicSearchResult | null>(null);

  const [sheetTrackId, setSheetTrackId] = useState<string | undefined>();
  const [sheetTrackTitle, setSheetTrackTitle] = useState<string | undefined>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  const ARTIST_LIMIT = 5;
  const ALBUM_LIMIT = 10;

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleOpenSheet = useCallback((song: SubsonicSong) => {
    setSheetTrackId(String(song.id));
    setSheetTrackTitle(song.title);
    setSheetVisible(true);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setShowAllArtists(false);
    setShowAllAlbums(false);
    const delay = setTimeout(async () => {
      try {
        const data = await search(query);
        setResults(data);
      } catch (e) {
        console.warn('Search error', e);
        setResults({artists: [], albums: [], songs: []});
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const handlePlaySong = (s: SubsonicSong) => {
    const sid = String(s.id);
    const track: Track = {
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
    playTrack(track);
  };

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
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={darkTheme.accent}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={darkTheme.accent} />
          </View>
        )}

        {!loading && results && (
          <View style={styles.resultsContainer}>
            
            {/* Songs */}
            {results.songs && results.songs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.search.sections.songs}</Text>
                {results.songs.map(song => (
                  <SongResultItem
                    key={song.id}
                    song={song}
                    onPress={() => handlePlaySong(song)}
                    onMore={() => handleOpenSheet(song)}
                  />
                ))}
              </View>
            )}

            {/* Artists */}
            {results.artists && results.artists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.search.sections.artists}</Text>
                <FlatList
                  horizontal
                  data={showAllArtists ? results.artists : results.artists.slice(0, ARTIST_LIMIT)}
                  keyExtractor={a => a.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hList}
                  renderItem={({item}) => (
                    <ArtistCard
                      id={item.id}
                      name={item.name}
                      coverArt={item.coverArt}
                      imageUrl={item.artistImageUrl}
                      onPress={() => navigation.push('ArtistDetail', { artistId: item.id })}
                    />
                  )}
                  ListFooterComponent={
                    !showAllArtists && results.artists.length > ARTIST_LIMIT ? (
                      <TouchableOpacity style={styles.moreChip} onPress={() => setShowAllArtists(true)}>
                        <Text style={styles.moreChipText}>+{results.artists.length - ARTIST_LIMIT}</Text>
                      </TouchableOpacity>
                    ) : null
                  }
                />
              </View>
            )}

            {/* Albums */}
            {results.albums && results.albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.search.sections.albums}</Text>
                <FlatList
                  horizontal
                  data={showAllAlbums ? results.albums : results.albums.slice(0, ALBUM_LIMIT)}
                  keyExtractor={a => a.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hList}
                  renderItem={({item}) => (
                    <AlbumCard
                      id={item.id}
                      name={item.name}
                      artist={item.artist}
                      coverArt={item.coverArt}
                      onPress={() => navigation.push('AlbumDetail', { albumId: item.id })}
                    />
                  )}
                  ListFooterComponent={
                    !showAllAlbums && results.albums.length > ALBUM_LIMIT ? (
                      <TouchableOpacity style={styles.moreChip} onPress={() => setShowAllAlbums(true)}>
                        <Text style={styles.moreChipText}>+{results.albums.length - ALBUM_LIMIT}</Text>
                      </TouchableOpacity>
                    ) : null
                  }
                />
              </View>
            )}
          </View>
        )}

        {!loading && results && !results.songs?.length && !results.artists?.length && !results.albums?.length && query.length > 0 && (
          <View style={styles.center}>
            <Text style={{color: '#b3b3b3', fontSize: 16, fontWeight: '500'}}>{t.search.noResults(query)}</Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <AddToPlaylistSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        trackId={sheetTrackId}
        trackTitle={sheetTrackTitle}
        onToast={showToast}
      />

      <Toast visible={toastVisible} message={toastMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: darkTheme.background},
  header: {flexDirection: 'row', alignItems: 'center', height: 60, backgroundColor: '#121212', paddingRight: 16},
  backBtn: {padding: 16},
  searchBar: {flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828', borderRadius: 4, height: 40},
  input: {flex: 1, color: '#fff', fontSize: 14, fontWeight: '500', paddingHorizontal: 12, height: '100%'},
  content: {flex: 1},
  center: {marginTop: 80, alignItems: 'center'},
  resultsContainer: {paddingTop: 8},
  section: {marginBottom: 24},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 16, marginBottom: 16},
  hList: {paddingHorizontal: 16, gap: 16},
  songItem: {
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
  songMeta: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
  bottomPad: {height: 120},
  moreChip: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },
  moreChipText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});