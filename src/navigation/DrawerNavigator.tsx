import React from 'react';
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
    <Animated.View style={[{flex: 1}, animStyle]}>
      <TabNavigator />
    </Animated.View>
  );
}

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
