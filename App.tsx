import React from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { darkTheme } from './src/theme';
import { useSetupPlayer } from './src/hooks/useSetupPlayer';
import OfflineBanner from './src/components/OfflineBanner';
import LikeRetryManager from './src/components/LikeRetryManager';

export default function App() {
  useSetupPlayer();
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={darkTheme.background}
        />
        <View style={{flex: 1}}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <OfflineBanner />
          <LikeRetryManager />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}