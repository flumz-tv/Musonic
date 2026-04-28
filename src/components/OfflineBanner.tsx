import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {useNetworkStore} from '../store/networkStore';
import {useT} from '../i18n';

// ─── Icons ────────────────────────────────────────────────────────────────────

function WifiOffIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ServerOffIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h20v6H2zM2 15h20v6H2z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 7h.01M6 19h.01"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 2l20 20"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export default function OfflineBanner() {
  const t = useT();
  const isOffline = useNetworkStore(s => s.isOffline);
  const serverReachable = useNetworkStore(s => s.serverReachable);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const showBanner = isOffline || !serverReachable;
  const BANNER_H = insets.top + 44;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: showBanner ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [showBanner, anim]);

  const bannerBg = isOffline ? '#C0392B' : '#C0690B';
  const icon = isOffline ? <WifiOffIcon /> : <ServerOffIcon />;
  const message = isOffline ? t.offline.noInternet : t.offline.serverUnreachable;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          height: BANNER_H,
          paddingTop: insets.top,
          backgroundColor: bannerBg,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-BANNER_H, 0],
              }),
            },
          ],
        },
      ]}>
      {icon}
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
