import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import {useT} from '../i18n';
import HomeScreen from '../screens/Home';
import SearchStack from './SearchStack';
import LibraryStack from './LibraryStack';
import HomeIcon from '../components/icons/HomeIcon';
import SearchIcon from '../components/icons/SearchIcon';
import LibraryIcon from '../components/icons/LibraryIcon';
import MiniPlayer from '../components/MiniPlayer';
import FullScreenPlayer from '../components/FullScreenPlayer';
import AudioPlayer from '../components/AudioPlayer';
import OfflineBanner from '../components/OfflineBanner';
import ConnectivityMonitor from '../components/ConnectivityMonitor';
import {useImageColor} from '../hooks/useImageColor';

const Tab = createBottomTabNavigator();

const TAB_H = 60;
const ICON_SIZE = 24;
const COLOR_ACTIVE = '#FFFFFF';
const COLOR_INACTIVE = '#707070';

type TabIconProps = {focused: boolean; color: string; size: number};

function HomeTabIcon({focused}: TabIconProps) {
  return <HomeIcon size={ICON_SIZE} color={focused ? COLOR_ACTIVE : COLOR_INACTIVE} filled={focused} />;
}
function SearchTabIcon({focused}: TabIconProps) {
  return <SearchIcon size={ICON_SIZE} color={focused ? COLOR_ACTIVE : COLOR_INACTIVE} filled={focused} />;
}
function LibraryTabIcon({focused}: TabIconProps) {
  return <LibraryIcon size={ICON_SIZE} color={focused ? COLOR_ACTIVE : COLOR_INACTIVE} filled={focused} />;
}

export default function TabNavigator() {
  const t = useT();
  useImageColor();

  return (
    <View style={styles.fill}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: '#000000',
            height: TAB_H,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLOR_ACTIVE,
          tabBarInactiveTintColor: COLOR_INACTIVE,
          tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t.tabs.home,
            tabBarIcon: HomeTabIcon,
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{
            tabBarLabel: t.tabs.search,
            tabBarIcon: SearchTabIcon,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Search', { screen: 'SearchHome' });
            },
          })}
        />
        <Tab.Screen
          name="Library"
          component={LibraryStack}
          options={{
            tabBarLabel: t.tabs.library,
            tabBarIcon: LibraryTabIcon,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Library', { screen: 'LibraryHome' });
            },
          })}
        />
      </Tab.Navigator>

      {/* Gradient fade — transparent → black, juste au-dessus de la tab bar */}
      <View style={styles.bottomFade} pointerEvents="none">
        <LinearGradient
          colors={['transparent', '#000000']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ConnectivityMonitor />
      <AudioPlayer />
      <MiniPlayer />
      <FullScreenPlayer />
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  bottomFade: {
    position: 'absolute',
    bottom: TAB_H,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 6,
  },
});
