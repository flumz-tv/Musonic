import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Line, Path, Circle} from 'react-native-svg';
import {darkTheme} from '../theme';
import {useSettingsStore} from '../store/settingsStore';
import {useT} from '../i18n';

function PrefsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Line x1={3} y1={6} x2={21} y2={6} stroke="#aaa" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={3} y1={12} x2={21} y2={12} stroke="#aaa" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={3} y1={18} x2={21} y2={18} stroke="#aaa" strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={8} cy={6} r={2.5} fill="#1a1a1a" stroke="#aaa" strokeWidth={1.8} />
      <Circle cx={16} cy={12} r={2.5} fill="#1a1a1a" stroke="#aaa" strokeWidth={1.8} />
      <Circle cx={10} cy={18} r={2.5} fill="#1a1a1a" stroke="#aaa" strokeWidth={1.8} />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M9 21 L3 21 L3 3 L9 3" fill="none" stroke="#E8553E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17 L21 12 L16 7" fill="none" stroke="#E8553E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={21} y1={12} x2={9} y2={12} stroke="#E8553E" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

import type {DrawerContentComponentProps} from '@react-navigation/drawer';

type Props = Partial<DrawerContentComponentProps> & {onClose?: () => void};

export default function CustomDrawerContent({onClose}: Props) {
  const t = useT();
  const navigation = useNavigation<any>();
  const {getActiveServer, disconnectServer} = useSettingsStore();
  const server = getActiveServer();

  const handleDisconnect = () => {
    Alert.alert(
      t.drawer.logoutTitle,
      t.drawer.logoutMessage(server?.name ?? 'Serveur', server?.url ?? ''),
      [
        {text: t.drawer.cancelButton, style: 'cancel'},
        {
          text: t.drawer.logoutConfirm,
          style: 'destructive',
          onPress: () => {
            onClose?.();
            disconnectServer();
          },
        },
      ],
    );
  };

  const MENU_ITEMS = [
    {label: t.drawer.settings, icon: <PrefsIcon />, screen: 'Settings'},
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle} />
        <Text style={styles.appName}>Musonic</Text>
        {server && (
          <Text style={styles.serverName} numberOfLines={1}>
            {server.name}
          </Text>
        )}
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {
              if (item.screen) {
                navigation.navigate(item.screen);
                onClose?.();
              }
            }}>
            {item.icon}
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Logout */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.item} onPress={handleDisconnect} activeOpacity={0.7}>
          <LogoutIcon />
          <Text style={[styles.itemLabel, styles.logoutLabel]}>{t.drawer.logout}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: darkTheme.background},
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 8,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: darkTheme.textPrimary,
  },
  serverName: {
    fontSize: 13,
    color: '#888',
  },
  menu: {paddingHorizontal: 12, gap: 2},
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  bottom: {paddingHorizontal: 12},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.textPrimary,
  },
  logoutLabel: {
    color: '#E8553E',
  },
});
