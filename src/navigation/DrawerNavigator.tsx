/**
 * @file DrawerNavigator.tsx
 * @description Drawer navigator shell. Wraps the main tab navigator inside a
 *   @react-navigation/drawer so the custom slide-in panel can be triggered from
 *   any screen via DrawerContainer context.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React from 'react';
import {StyleSheet} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Animated, {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import {useDrawerProgress} from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import CustomDrawerContent from '../components/CustomDrawerContent';
import {darkTheme} from '../theme';

const Drawer = createDrawerNavigator();

function ScaledMain() {
  const progress = useDrawerProgress();
  const animStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 0.88]);
    const borderRadius = interpolate(progress.value, [0, 1], [0, 16]);
    return {
      transform: [{scale}],
      borderRadius,
      overflow: 'hidden',
    };
  });

  return (
    <Animated.View style={[styles.fill, animStyle]}>
      <TabNavigator />
    </Animated.View>
  );
}

const styles = StyleSheet.create({fill: {flex: 1}});

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerType: 'back',
        drawerStyle: {
          width: '80%',
          backgroundColor: darkTheme.background,
        },
        overlayColor: 'transparent',
        swipeEdgeWidth: 40,
      }}>
      <Drawer.Screen name="Main" component={ScaledMain} />
    </Drawer.Navigator>
  );
}
