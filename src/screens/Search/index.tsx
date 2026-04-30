/**
 * @file index.tsx
 * @description Search feature entry — re-exports the SearchStack navigator so
 *   the tab navigator imports a single path regardless of internal structure.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SearchHome from './SearchHome';
import SearchActive from './SearchActive';

const Stack = createNativeStackNavigator();

export default function SearchNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false, 
        animation: 'fade' // Transition fluide style Spotify
      }}>
      <Stack.Screen name="SearchHome" component={SearchHome} />
      <Stack.Screen name="SearchActive" component={SearchActive} />
    </Stack.Navigator>
  );
}