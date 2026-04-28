import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import CoverArt from './CoverArt';
import {useT} from '../i18n';
import {useActiveTrack, usePlaybackState, State} from 'react-native-track-player';
import {usePlayerStore, type Track} from '../store/playerStore';

const {height: SH} = Dimensions.get('window');
const ORANGE = '#FF6B35';
const SHEET_H = SH * 0.85;

// ─── Animated Equalizer ───────────────────────────────────────────────────────

function Equalizer({playing}: {playing: boolean}) {
  const b1 = useRef(new Animated.Value(3)).current;
  const b2 = useRef(new Animated.Value(3)).current;
  const b3 = useRef(new Animated.Value(3)).current;

  useEffect(() => {
    const bars = [b1, b2, b3];
    if (playing) {
      bars.forEach((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 14,
              duration: 320 + i * 80,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 3,
              duration: 300 + i * 60,
              useNativeDriver: false,
            }),
          ]),
        ).start(),
      );
    } else {
      bars.forEach(bar => {
        bar.stopAnimation();
        bar.setValue(3);
      });
    }
    return () => bars.forEach(bar => bar.stopAnimation());
  }, [playing, b1, b2, b3]);

  return (
    <View style={styles.eqContainer}>
      {[b1, b2, b3].map((bar, i) => (
        <Animated.View key={i} style={[styles.eqBar, {height: bar}]} />
      ))}
    </View>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DragHandleIcon() {
  return (
    <Svg width={18} height={14} viewBox="0 0 18 14">
      <Rect x={0} y={0} width={18} height={2.5} rx={1.25} fill="#535353" />
      <Rect x={0} y={5.75} width={18} height={2.5} rx={1.25} fill="#535353" />
      <Rect x={0} y={11.5} width={18} height={2.5} rx={1.25} fill="#535353" />
    </Svg>
  );
}

function CheckCircle({selected}: {selected: boolean}) {
  if (!selected) {
    return <View style={styles.checkEmpty} />;
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill={ORANGE} />
      <Path
        d="M6 12 L10 16 L18 8"
        stroke="#000"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function SmallPlayIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="#000">
      <Path d="M7 4 L20 12 L7 20 Z" />
    </Svg>
  );
}

function SmallPauseIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="#000">
      <Rect x={5} y={4} width={4} height={16} rx={1.5} />
      <Rect x={15} y={4} width={4} height={16} rx={1.5} />
    </Svg>
  );
}

function ShuffleMiniIcon({color = '#fff'}: {color?: string}) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function RepeatMiniIcon({color = '#fff'}: {color?: string}) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function TimerIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={13} r={9} stroke="#fff" strokeWidth={2} fill="none" />
      <Path
        d="M12 8 L12 13 L15 15"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M9 2 L15 2" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M18 6 L6 18 M6 6 L18 18"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Queue Row ────────────────────────────────────────────────────────────────

interface QueueRowProps {
  item: Track;
  drag: () => void;
  isActive: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function QueueRow({item, drag, isActive, isEditMode, isSelected, onSelect}: QueueRowProps) {
  return (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.queueRow, isActive && styles.queueRowDragging]}
        onPress={() => isEditMode && onSelect(item.id)}
        activeOpacity={isEditMode ? 0.6 : 1}>
        {isEditMode && (
          <View style={styles.checkWrapper}>
            <CheckCircle selected={isSelected} />
          </View>
        )}
        <CoverArt id={item.coverArt} size={48} borderRadius={4} />
        <View style={styles.queueRowInfo}>
          <Text style={styles.queueRowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.queueRowArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <TouchableOpacity
          onPressIn={drag}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          style={styles.dragHandle}>
          <DragHandleIcon />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

// ─── QueueSheet ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  slideY: Animated.Value;
}

export default function QueueSheet({visible, onClose, slideY}: Props) {
  const t = useT();
  const currentTrack = useActiveTrack();
  const {state} = usePlaybackState();
  const isPlaying = state === State.Playing;
  const upcoming = usePlayerStore(s => s.upcoming);
  const currentPlaylistName = usePlayerStore(s => s.currentPlaylistName);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const cycleRepeat = usePlayerStore(s => s.cycleRepeat);
  const reorderQueue = usePlayerStore(s => s.reorderQueue);
  const removeFromQueue = usePlayerStore(s => s.removeFromQueue);
  const moveToTop = usePlayerStore(s => s.moveToTop);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const headerPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50 || gs.vy > 0.5) {
          onClose();
        }
      },
    }),
  ).current;

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setSelectedIds([]);
  }, []);

  const enterEditMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditMode(true);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleMoveToTop = useCallback(() => {
    if (selectedIds.length === 0) return;
    moveToTop(selectedIds);
    exitEditMode();
  }, [selectedIds, moveToTop, exitEditMode]);

  const handleRemove = useCallback(() => {
    if (selectedIds.length === 0) return;
    removeFromQueue(selectedIds);
    exitEditMode();
  }, [selectedIds, removeFromQueue, exitEditMode]);

  useEffect(() => {
    if (!visible) exitEditMode();
  }, [visible, exitEditMode]);

  const renderItem = useCallback(
    ({item, drag, isActive}: RenderItemParams<Track>) => (
      <QueueRow
        item={item}
        drag={drag}
        isActive={isActive}
        isEditMode={isEditMode}
        isSelected={selectedIds.includes(item.id)}
        onSelect={toggleSelect}
      />
    ),
    [isEditMode, selectedIds, toggleSelect],
  );

  if (!visible || !currentTrack) return null;

  const hasSelection = selectedIds.length > 0;
  const repeatActive = repeatMode !== 'none';

  return (
    <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, {transform: [{translateY: slideY}]}]}>
        <SafeAreaView style={styles.sheetInner} edges={['bottom']}>

          {/* ── Top zone with swipe-to-close ── */}
          <View {...headerPan.panHandlers}>
            <View style={styles.pill} />

            <View style={styles.header}>
              {isEditMode ? (
                <>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {t.queue.editTitle(selectedIds.length)}
                  </Text>
                  <TouchableOpacity
                    onPress={exitEditMode}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <CloseIcon />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.headerTitle}>{t.queue.title}</Text>
                  <TouchableOpacity style={styles.editBtn} onPress={enterEditMode}>
                    <Text style={styles.editBtnText}>{t.queue.modifyButton}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.subtitle}>
              {t.queue.nowPlaying(currentPlaylistName || t.queue.fallbackName)}
            </Text>

            <View style={styles.currentRow}>
              <Equalizer playing={isPlaying} />
              <View style={styles.currentInfo}>
                <Text style={styles.currentTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.currentArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
              <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
                {isPlaying ? <SmallPauseIcon /> : <SmallPlayIcon />}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
          </View>

          {/* ── Draggable list ── */}
          <GestureHandlerRootView style={styles.fill}>
            <DraggableFlatList
              data={upcoming}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              onDragEnd={({from, to}) => reorderQueue(from, to)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </GestureHandlerRootView>

          {/* ── Bottom bar ── */}
          {isEditMode ? (
            <View style={styles.editBar}>
              <TouchableOpacity onPress={handleMoveToTop} disabled={!hasSelection}>
                <Text style={[styles.editAction, !hasSelection && styles.editActionDisabled]}>
                  {t.queue.moveToTop}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRemove} disabled={!hasSelection}>
                <Text style={[styles.editAction, !hasSelection && styles.editActionDisabled]}>
                  {t.queue.removeButton}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.bottomBtn}
                onPress={toggleShuffle}
                activeOpacity={0.7}>
                <ShuffleMiniIcon color={isShuffled ? ORANGE : '#fff'} />
                <Text style={[styles.bottomBtnLabel, isShuffled && styles.bottomBtnLabelActive]}>
                  {t.queue.shuffle}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomBtn}
                onPress={cycleRepeat}
                activeOpacity={0.7}>
                <RepeatMiniIcon color={repeatActive ? ORANGE : '#fff'} />
                <Text style={[styles.bottomBtnLabel, repeatActive && styles.bottomBtnLabelActive]}>
                  {t.queue.repeat}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bottomBtn} activeOpacity={0.7}>
                <TimerIcon />
                <Text style={styles.bottomBtnLabel}>{t.queue.timer}</Text>
              </TouchableOpacity>
            </View>
          )}

        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: {flex: 1},
  listContent: {paddingBottom: 8},
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 200,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#535353',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  editBtn: {
    backgroundColor: '#282828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#A7A7A7',
    marginBottom: 16,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    gap: 12,
  },
  currentInfo: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ORANGE,
  },
  currentArtist: {
    fontSize: 13,
    color: '#A7A7A7',
    marginTop: 2,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    marginBottom: 8,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  queueRowDragging: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  checkWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#535353',
  },
  queueRowInfo: {
    flex: 1,
  },
  queueRowTitle: {
    fontSize: 16,
    color: '#fff',
  },
  queueRowArtist: {
    fontSize: 14,
    color: '#A7A7A7',
    marginTop: 2,
  },
  dragHandle: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  editAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  editActionDisabled: {
    color: '#535353',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  bottomBtn: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  bottomBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  bottomBtnLabelActive: {
    color: ORANGE,
  },
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 20,
    height: 16,
    gap: 3,
  },
  eqBar: {
    width: 4,
    backgroundColor: ORANGE,
    borderRadius: 1,
  },
});
