import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import {useSettingsStore} from '../store/settingsStore';
import {configureClient} from '../api/client';
import TabNavigator from './TabNavigator';
import DrawerContainer from '../components/DrawerContainer';
import ServerSetupScreen from '../screens/ServerSetup';
import SettingsScreen from '../screens/Settings';

const Stack = createNativeStackNavigator();

function MainWithDrawer() {
  return (
    <DrawerContainer>
      <TabNavigator />
    </DrawerContainer>
  );
}

export default function RootNavigator() {
  const {getActiveServer, rotationLocked} = useSettingsStore();
  const activeServer = getActiveServer();

  if (activeServer) {
    configureClient(activeServer);
  }

  useEffect(() => {
    if (rotationLocked) {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }
  }, [rotationLocked]);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!activeServer ? (
        <Stack.Screen name="ServerSetup" component={ServerSetupScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainWithDrawer} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
