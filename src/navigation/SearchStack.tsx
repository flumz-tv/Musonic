import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SearchHome from '../screens/Search/SearchHome';
import SearchActive from '../screens/Search/SearchActive';
import AlbumDetailScreen from '../screens/AlbumDetail';
import ArtistDetailScreen from '../screens/ArtistDetail';

const Stack = createNativeStackNavigator();

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
      <Stack.Screen name="SearchHome" component={SearchHome} />
      <Stack.Screen name="SearchActive" component={SearchActive} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}