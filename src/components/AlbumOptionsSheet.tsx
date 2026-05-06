/**
 * @file AlbumOptionsSheet.tsx
 * @description Bottom sheet with album-level actions: star/unstar, add all tracks
 *   to queue, add to playlist, and navigate to artist.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React, {useEffect, useRef, useState} from 'react';
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
import CoverArt from './CoverArt';
import AddToPlaylistSheet from './AddToPlaylistSheet';
import {useT, getT} from '../i18n';

const {height: SH} = Dimensions.get('window');
const ICON_COLOR = '#B3B3B3';

function PlusCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path d="M12 7 V17 M7 12 H17" stroke={ICON_COLOR} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke="#1ED760" strokeWidth={1.7} fill="rgba(30,215,96,0.12)" />
      <Path d="M7.5 12 L10.5 15 L16.5 9" stroke="#1ED760" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path d="M12 7 V14 M9 12 L12 15 L15 12" stroke={ICON_COLOR} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PersonIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} stroke={ICON_COLOR} strokeWidth={1.7} fill="none" />
      <Path d="M4 20 C4 16 7.6 13 12 13 C16.4 13 20 16 20 20" stroke={ICON_COLOR} strokeWidth={1.7} strokeLinecap="round" fill="none" />
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

function PlaylistAddIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 6 H15 M3 12 H12 M3 18 H9" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 14 V20 M13 17 H19" stroke={ICON_COLOR} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  albumName: string;
  coverArtId?: string;
  isStarred: boolean;
  onToggleStar: () => void;
  onGoToArtist?: () => void;
  onAddToQueue: () => void;
  trackIds: string[];
  onToast: (msg: string) => void;
};

function ActionRow({icon, label, onPress}: {icon: React.ReactNode; label: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AlbumOptionsSheet({
  visible, onClose,
  albumName, coverArtId,
  isStarred, onToggleStar,
  onGoToArtist,
  onAddToQueue,
  trackIds,
  onToast,
}: Props) {
  const t = useT();
  const translateY = useRef(new Animated.Value(SH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [addPlaylistVisible, setAddPlaylistVisible] = useState(false);

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

  return (
    <>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, {opacity: overlayOpacity}]} pointerEvents="none" />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <CoverArt id={coverArtId} size={48} borderRadius={4} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{albumName}</Text>
              <Text style={styles.headerSub} numberOfLines={1}>Album</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <ActionRow
            icon={isStarred ? <CheckCircleIcon /> : <PlusCircleIcon />}
            label={isStarred ? t.albumDetail.removeFromLibraryAction : t.albumDetail.addToLibrary}
            onPress={() => { onClose(); onToggleStar(); }}
          />
          <ActionRow
            icon={<DownloadIcon />}
            label={t.playlistOptions.download}
            onPress={() => { onClose(); onToast(getT().playlistOptions.comingSoon); }}
          />
          {onGoToArtist && (
            <ActionRow
              icon={<PersonIcon />}
              label={t.songOptions.goToArtist}
              onPress={() => { onClose(); onGoToArtist(); }}
            />
          )}
          <ActionRow
            icon={<QueuePlusIcon />}
            label={t.songOptions.addToQueue}
            onPress={() => { onClose(); onAddToQueue(); }}
          />
          <ActionRow
            icon={<PlaylistAddIcon />}
            label={t.playlistOptions.addAllToPlaylist}
            onPress={() => setAddPlaylistVisible(true)}
          />

          <View style={styles.bottomPad} />
        </Animated.View>
      </Modal>

      {trackIds.length > 0 && (
        <AddToPlaylistSheet
          visible={addPlaylistVisible}
          onClose={() => { setAddPlaylistVisible(false); onClose(); }}
          trackIds={trackIds}
          onToast={onToast}
        />
      )}
    </>
  );
}

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
  handleWrap: {alignItems: 'center', paddingTop: 8, paddingBottom: 16},
  handle: {width: 32, height: 4, borderRadius: 2, backgroundColor: '#535353'},
  header: {flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center'},
  headerText: {marginLeft: 12, flex: 1},
  headerTitle: {fontSize: 16, fontWeight: 'bold', color: '#fff'},
  headerSub: {fontSize: 13, color: '#B3B3B3', marginTop: 4},
  divider: {height: 1, backgroundColor: '#282828', marginBottom: 4},
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20},
  rowIcon: {width: 24, alignItems: 'center'},
  rowLabel: {fontSize: 16, fontWeight: '400', color: '#fff', marginLeft: 16},
  bottomPad: {height: 24},
});
