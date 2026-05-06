/**
 * @file SearchHome.tsx
 * @description Search landing screen. Shows genre/mood browse cards and
 *   transitions to SearchActive when the user taps the search bar.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity, StatusBar, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Circle, Path} from 'react-native-svg';
import {darkTheme} from '../../theme';
import GlobalHeader from '../../components/GlobalHeader';
import {useT} from '../../i18n';

function SearchIconDark({size = 24, color = '#121212'}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth={2.5} fill="none" />
      <Path d="M15.5 15.5 L21 21" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function SearchHome() {
  const t = useT();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.background} />
      <GlobalHeader variant="simple" title={t.search.headerTitle} />

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.fakeSearchBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SearchActive')}>
          <SearchIconDark size={24} />
          <Text style={styles.fakeInputText}>{t.search.placeholder}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>{t.search.browseAll}</Text>
        {/* Colored genre tiles — coming soon */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: darkTheme.background},
  searchContainer: {paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8},
  fakeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 48,
    borderRadius: 6,
    paddingHorizontal: 14,
  },
  fakeInputText: {color: '#555', fontSize: 16, fontWeight: '600', marginLeft: 12},
  content: {flex: 1},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#fff', marginHorizontal: 16, marginTop: 16},
});
