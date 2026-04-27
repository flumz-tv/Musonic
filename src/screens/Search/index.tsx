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