import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import TrackPlayer from 'react-native-track-player';
import CoverArt from './CoverArt';
import AddToPlaylistSheet from './AddToPlaylistSheet';
import {darkTheme} from '../theme';
import {updatePlaylist} from '../api/endpoints/playlists';
import {getStreamUrl, getCoverArtUrl} from '../api/client';
import {syncUpcomingFromRNTP} from '../services/playerActions';
import {useT, getT} from '../i18n';
import type {SubsonicSong} from '../api/types';

const {height: SH} = Dimensions.get('window');
const ICON_COLOR = '#B3B3B3';

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path d="M12 7 V17 M7 12 H17" stroke={ICON_COLOR} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function MinusCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path d="M7 12 H17" stroke={ICON_COLOR} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function QueuePlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 6 H17" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 12 H13" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 18 H10" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M18 13 V21 M14 17 H22" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function DiscIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Circle cx={12} cy={12} r={3} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Circle cx={12} cy={12} r={1} fill={ICON_COLOR} />
    </Svg>
  );
}

function PersonIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path
        d="M4 20 C4 16 7.6 13 12 13 C16.4 13 20 16 20 20"
        stroke={ICON_COLOR}
        strokeWidth={1.7}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  track: SubsonicSong | null;
  playlistId?: string;
  trackIndex?: number;
  onToast: (message: string) => void;
  onRemoved?: () => void;
  onNavigateAlbum?: (albumId: string) => void;
  onNavigateArtist?: (artistId: string | undefined, artistName: string) => void;
};

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, accent && {color: darkTheme.accent}]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SongOptionsSheet({
  visible,
  onClose,
  track,
  playlistId,
  trackIndex,
  onToast,
  onRemoved,
  onNavigateAlbum,
  onNavigateArtist,
}: Props) {
  const t = useT();
  const translateY = useRef(new Animated.Value(SH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [addPlaylistVisible, setAddPlaylistVisible] = useState(false);

  // Preserve last non-null track so the header stays visible during close animation
  const lastTrack = useRef(track);
  if (track) lastTrack.current = track;
  const tr = lastTrack.current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(overlayOpacity, {toValue: 0.7, duration: 200, useNativeDriver: true}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {toValue: SH, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true}),
        Animated.timing(overlayOpacity, {toValue: 0, duration: 180, useNativeDriver: true}),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const handleAddToQueue = useCallback(async () => {
    if (!tr) return;
    const rnTrack = {
      id: String(tr.id),
      url: getStreamUrl(String(tr.id)),
      title: tr.title,
      artist: tr.artist,
      artwork: getCoverArtUrl(tr.coverArt || tr.id, 300),
      coverArt: tr.coverArt,
      album: tr.album,
      duration: tr.duration,
    };
    try {
      const idx = await TrackPlayer.getActiveTrackIndex();
      await TrackPlayer.add(rnTrack, idx != null ? idx + 1 : undefined);
      await syncUpcomingFromRNTP();
      onToast(getT().songOptions.addedToQueue);
    } catch {
      onToast(getT().songOptions.addError);
    }
    onClose();
  }, [tr, onToast, onClose]);

  const handleRemoveFromPlaylist = useCallback(async () => {
    if (!playlistId || trackIndex == null) return;
    onClose();
    try {
      await updatePlaylist(playlistId, undefined, undefined, [trackIndex]);
      onToast(getT().songOptions.removedFromPlaylist);
      onRemoved?.();
    } catch {
      onToast(getT().songOptions.removeError);
    }
  }, [playlistId, trackIndex, onClose, onToast, onRemoved]);

  const handleGoToAlbum = useCallback(() => {
    onClose();
    if (tr?.albumId) onNavigateAlbum?.(tr.albumId);
  }, [tr, onClose, onNavigateAlbum]);

  const handleGoToArtist = useCallback(() => {
    onClose();
    if (tr) onNavigateArtist?.(tr.artistId, tr.artist);
  }, [tr, onClose, onNavigateArtist]);

  return (
    <>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, {opacity: overlayOpacity}]}
          pointerEvents="none"
        />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          {tr && (
            <View style={styles.header}>
              <CoverArt id={tr.coverArt} size={48} borderRadius={4} />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle} numberOfLines={1}>{tr.title}</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {tr.artist}{tr.album ? ` • ${tr.album}` : ''}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.divider} />

          {/* Actions */}
          <ActionRow
            icon={<PlusCircleIcon />}
            label={t.songOptions.addToPlaylist}
            onPress={() => setAddPlaylistVisible(true)}
          />
          {playlistId != null && (
            <ActionRow
              icon={<MinusCircleIcon />}
              label={t.songOptions.removeFromPlaylist}
              onPress={handleRemoveFromPlaylist}
            />
          )}
          <ActionRow
            icon={<QueuePlusIcon />}
            label={t.songOptions.addToQueue}
            onPress={handleAddToQueue}
          />
          {tr?.albumId && (
            <ActionRow
              icon={<DiscIcon />}
              label={t.songOptions.goToAlbum}
              onPress={handleGoToAlbum}
            />
          )}
          <ActionRow
            icon={<PersonIcon />}
            label={t.songOptions.goToArtist}
            onPress={handleGoToArtist}
          />

          <View style={styles.bottomPad} />
        </Animated.View>
      </Modal>

      <AddToPlaylistSheet
        visible={addPlaylistVisible}
        onClose={() => setAddPlaylistVisible(false)}
        trackId={tr?.id}
        trackTitle={tr?.title}
        onToast={onToast}
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
    backgroundColor: '#121212',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#535353',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: '#B3B3B3',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#282828',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fff',
    marginLeft: 16,
  },
  bottomPad: {
    height: 24,
  },
});
