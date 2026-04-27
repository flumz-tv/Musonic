import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import {useSettingsStore} from '../../store/settingsStore';
import Slider from '@react-native-community/slider';
import {t} from '../../i18n/fr';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PhoneRotateIcon({locked}: {locked: boolean}) {
  const color = locked ? '#FF6B35' : '#fff';
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      {/* Phone body */}
      <Rect x={8} y={5} width={10} height={16} rx={2} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={13} cy={18.5} r={1} fill={color} />
      {/* Rotation arc */}
      <Path
        d="M20 6 A9 9 0 0 0 6 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <Path
        d="M4.5 5 L6 6 L7.5 4.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    useWaveformScrubber,
    setUseWaveformScrubber,
    crossfadeDuration,
    setCrossfadeDuration,
    rotationLocked,
    setRotationLocked,
  } = useSettingsStore();

  const [mono, setMono] = useState(false);

  const ACCENT = '#FF6B35';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Spotify-style header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Player section */}
        <Text style={styles.sectionTitle}>{t.settings.sections.player}</Text>

        <View style={styles.settingRow}>
          <View style={styles.textBlock}>
            <Text style={styles.settingLabel}>{t.settings.player.progressLabel}</Text>
            <Text style={styles.settingDesc}>{t.settings.player.progressDesc}</Text>
          </View>
        </View>

        {/* Waveform vs Classic preview */}
        <View style={styles.previewContainer}>
          <TouchableOpacity
            style={[styles.previewCard, !useWaveformScrubber && styles.previewCardActive]}
            onPress={() => setUseWaveformScrubber(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.previewTitle, !useWaveformScrubber && styles.previewTitleActive]}>
              {t.settings.player.classic}
            </Text>
            <Svg width="100%" height="30" viewBox="0 0 100 30">
              <Path d="M10 15 L50 15" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
              <Path d="M50 15 L90 15" stroke="#535353" strokeWidth={3} strokeLinecap="round" />
              <Circle cx="50" cy="15" r="5" fill="#fff" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewCard, useWaveformScrubber && styles.previewCardActive]}
            onPress={() => setUseWaveformScrubber(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.previewTitle, useWaveformScrubber && styles.previewTitleActive]}>
              {t.settings.player.waveform}
            </Text>
            <Svg width="100%" height="30" viewBox="0 0 100 30">
              <Rect x="20" y="10" width="3" height="10" fill="#fff" rx="1.5" />
              <Rect x="28" y="5" width="3" height="20" fill="#fff" rx="1.5" />
              <Rect x="36" y="12" width="3" height="6" fill="#fff" rx="1.5" />
              <Rect x="44" y="2" width="3" height="26" fill="#fff" rx="1.5" />
              <Rect x="52" y="8" width="3" height="14" fill="#FF6B35" rx="1.5" />
              <Rect x="60" y="14" width="3" height="2" fill="#535353" rx="1.5" />
              <Rect x="68" y="6" width="3" height="18" fill="#535353" rx="1.5" />
              <Rect x="76" y="11" width="3" height="8" fill="#535353" rx="1.5" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Transitions section */}
        <Text style={styles.sectionTitle}>{t.settings.sections.transitions}</Text>

        <View style={styles.settingRow}>
          <View style={styles.textBlock}>
            <Text style={styles.settingLabel}>{t.settings.transitions.crossfadeLabel}</Text>
            <Text style={styles.settingDesc}>{t.settings.transitions.crossfadeDesc}</Text>
          </View>
        </View>

        <View style={styles.realSliderContainer}>
          <Text style={styles.sliderText}>0 s</Text>

          <View style={styles.sliderWrapper}>
            {/* Floating tooltip above thumb */}
            <View style={[styles.tooltip, {left: `${(crossfadeDuration / 12) * 100}%`}]}>
              <Text style={styles.tooltipText}>{crossfadeDuration} s</Text>
            </View>

            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0}
              maximumValue={12}
              step={1}
              value={crossfadeDuration}
              onValueChange={setCrossfadeDuration}
              minimumTrackTintColor={ACCENT}
              maximumTrackTintColor="#535353"
              thumbTintColor="#fff"
            />
          </View>

          <Text style={styles.sliderText}>12 s</Text>
        </View>

        {/* Playback section */}
        <Text style={styles.sectionTitle}>{t.settings.sections.playback}</Text>

        <View style={styles.settingRow}>
          <View style={styles.textBlock}>
            <Text style={styles.settingLabel}>{t.settings.playback.monoLabel}</Text>
            <Text style={styles.settingDesc}>{t.settings.playback.monoDesc}</Text>
          </View>
          <Switch
            value={mono}
            onValueChange={setMono}
            trackColor={{false: '#535353', true: ACCENT}}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>

        {/* Display section */}
        <Text style={styles.sectionTitle}>{t.settings.sections.display}</Text>

        <View style={styles.settingRow}>
          <PhoneRotateIcon locked={rotationLocked} />
          <View style={[styles.textBlock, {marginLeft: 12}]}>
            <Text style={styles.settingLabel}>{t.settings.display.lockRotationLabel}</Text>
            <Text style={styles.settingDesc}>{t.settings.display.lockRotationDesc}</Text>
          </View>
          <Switch
            value={rotationLocked}
            onValueChange={setRotationLocked}
            trackColor={{false: '#535353', true: ACCENT}}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textBlock: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#A7A7A7',
    lineHeight: 18,
  },
  previewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  previewCard: {
    flex: 1,
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewCardActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#333333',
  },
  previewTitle: {
    color: '#A7A7A7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewTitleActive: {
    color: '#FF6B35',
  },
  realSliderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 8,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -25,
    marginLeft: -15,
    backgroundColor: '#282828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
