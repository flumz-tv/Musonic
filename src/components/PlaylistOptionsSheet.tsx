import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import TrackPlayer from 'react-native-track-player';
import CoverArt from './CoverArt';
import {darkTheme} from '../theme';
import {getPlaylist, updatePlaylist, deletePlaylist} from '../api/endpoints/playlists';
import {getStreamUrl, getCoverArtUrl} from '../api/client';
import {syncUpcomingFromRNTP} from '../services/playerActions';
import {t} from '../i18n/fr';

const {height: SH} = Dimensions.get('window');
const ICON_COLOR = '#B3B3B3';

// ─── Icons ────────────────────────────────────────────────────────────────────

function QueuePlusIcon({color = ICON_COLOR}: {color?: string}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 6 H17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 12 H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 18 H10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M18 13 V21 M14 17 H22" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function DownloadCircleIcon({color = ICON_COLOR}: {color?: string}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.7} fill="none" />
      <Path
        d="M12 7 V14 M9 12 L12 15 L15 12"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PinIcon({color = ICON_COLOR, filled = false}: {color?: string; filled?: boolean}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M9 2 L15 2 L15 8 L18 11 L13.5 11 L13.5 21 L12 22 L10.5 21 L10.5 11 L6 11 L9 8 Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        transform="rotate(45, 12, 12)"
      />
    </Svg>
  );
}

function PencilIcon({color = ICON_COLOR}: {color?: string}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M11 5 H5 C4.4 5 4 5.4 4 6 V19 C4 19.6 4.4 20 5 20 H18 C18.6 20 19 19.6 19 19 V13 M17.5 2.5 C18.3 1.7 19.7 1.7 20.5 2.5 C21.3 3.3 21.3 4.7 20.5 5.5 L12 14 L8 15 L9 11 Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function TrashIcon({color = ICON_COLOR}: {color?: string}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M3 6 H21 M8 6 V4 C8 3.4 8.4 3 9 3 H15 C15.6 3 16 3.4 16 4 V6 M19 6 L18 20 C18 20.6 17.6 21 17 21 H7 C6.4 21 6 20.6 6 20 L5 6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M10 11 V17 M14 11 V17" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlaylistInfo = {
  id: string;
  name: string;
  coverArt?: string;
  songCount: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  playlist: PlaylistInfo | null;
  isPinned: boolean;
  onTogglePin: () => void;
  onToast: (message: string) => void;
  onRenamed?: (newName: string) => void;
  onDeleted?: () => void;
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

// ─── Rename Modal ─────────────────────────────────────────────────────────────

function RenameModal({
  visible,
  initialName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  initialName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [value, setValue] = useState(initialName);
  useEffect(() => {
    if (visible) setValue(initialName);
  }, [visible, initialName]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.renameOverlay}>
        <View style={styles.renameCard}>
          <Text style={styles.renameTitle}>{t.renameModal.title}</Text>
          <TextInput
            style={styles.renameInput}
            value={value}
            onChangeText={setValue}
            autoFocus
            selectTextOnFocus
            placeholderTextColor="#555"
            maxLength={100}
          />
          <View style={styles.renameBtns}>
            <TouchableOpacity style={styles.renameBtnCancel} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.renameBtnCancelText}>{t.renameModal.cancelButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.renameBtnOk, !value.trim() && {opacity: 0.4}]}
              onPress={() => value.trim() && onConfirm(value.trim())}
              activeOpacity={0.7}
              disabled={!value.trim()}>
              <Text style={styles.renameBtnOkText}>{t.renameModal.confirmButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlaylistOptionsSheet({
  visible,
  onClose,
  playlist,
  isPinned,
  onTogglePin,
  onToast,
  onRenamed,
  onDeleted,
}: Props) {
  const translateY = useRef(new Animated.Value(SH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [renameVisible, setRenameVisible] = useState(false);

  const lastPlaylist = useRef(playlist);
  if (playlist) lastPlaylist.current = playlist;
  const p = lastPlaylist.current;

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
    if (!p) return;
    onClose();
    try {
      const {songs} = await getPlaylist(p.id);
      const tracks = songs.map(s => ({
        id: String(s.id),
        url: getStreamUrl(String(s.id)),
        title: s.title,
        artist: s.artist,
        artwork: getCoverArtUrl(s.coverArt || s.id, 300),
        coverArt: s.coverArt,
        album: s.album,
        duration: s.duration,
      }));
      const idx = await TrackPlayer.getActiveTrackIndex();
      await TrackPlayer.add(tracks, idx != null ? idx + 1 : undefined);
      await syncUpcomingFromRNTP();
      onToast(t.playlistOptions.queuedToast(tracks.length));
    } catch {
      onToast(t.playlistOptions.queueError);
    }
  }, [p, onClose, onToast]);

  const handlePin = useCallback(() => {
    onTogglePin();
    onClose();
    onToast(isPinned ? t.playlistOptions.unpinnedToast : t.playlistOptions.pinnedToast);
  }, [onTogglePin, onClose, onToast, isPinned]);

  const handleRenameConfirm = useCallback(async (newName: string) => {
    if (!p) return;
    setRenameVisible(false);
    onClose();
    try {
      await updatePlaylist(p.id, newName);
      onRenamed?.(newName);
      onToast(t.playlistOptions.renamedToast);
    } catch {
      onToast(t.playlistOptions.renameError);
    }
  }, [p, onClose, onRenamed, onToast]);

  const handleDelete = useCallback(() => {
    if (!p) return;
    Alert.alert(
      t.playlistOptions.deleteTitle,
      t.playlistOptions.deleteMessage(p.name),
      [
        {text: t.playlistOptions.cancelButton, style: 'cancel'},
        {
          text: t.playlistOptions.deleteConfirm,
          style: 'destructive',
          onPress: async () => {
            onClose();
            try {
              await deletePlaylist(p.id);
              onDeleted?.();
              onToast(t.playlistOptions.deletedToast);
            } catch {
              onToast(t.playlistOptions.deleteError);
            }
          },
        },
      ],
    );
  }, [p, onClose, onDeleted, onToast]);

  return (
    <>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, {backgroundColor: '#000', opacity: overlayOpacity}]}
          pointerEvents="none"
        />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          {p && (
            <View style={styles.header}>
              <CoverArt id={p.coverArt} size={48} borderRadius={4} />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {t.playlistOptions.byYou} • {t.playlistOptions.trackCount(p.songCount)}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.divider} />

          <ActionRow icon={<QueuePlusIcon />} label={t.playlistOptions.addToQueue} onPress={handleAddToQueue} />
          <ActionRow icon={<DownloadCircleIcon />} label={t.playlistOptions.download} onPress={() => { onClose(); onToast(t.playlistOptions.comingSoon); }} />
          <ActionRow
            icon={<PinIcon color={isPinned ? darkTheme.accent : ICON_COLOR} />}
            label={isPinned ? t.playlistOptions.unpin : t.playlistOptions.pin}
            onPress={handlePin}
            accent={isPinned}
          />
          <ActionRow
            icon={<PencilIcon />}
            label={t.playlistOptions.rename}
            onPress={() => setRenameVisible(true)}
          />
          <ActionRow
            icon={<TrashIcon color="#E84040" />}
            label={t.playlistOptions.delete}
            onPress={handleDelete}
          />

          <View style={styles.bottomPad} />
        </Animated.View>
      </Modal>

      <RenameModal
        visible={renameVisible}
        initialName={p?.name ?? ''}
        onCancel={() => setRenameVisible(false)}
        onConfirm={handleRenameConfirm}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  renameCard: {
    width: '100%',
    backgroundColor: '#282828',
    borderRadius: 16,
    padding: 24,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  renameInput: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  renameBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  renameBtnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  renameBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  renameBtnOk: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: darkTheme.accent,
    alignItems: 'center',
  },
  renameBtnOkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
