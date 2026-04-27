import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LibraryScreen from '../screens/Library';
import LikedSongsScreen from '../screens/LikedSongs';
import PlaylistDetailScreen from '../screens/PlaylistDetail';
import AlbumDetailScreen from '../screens/AlbumDetail';
import ArtistDetailScreen from '../screens/ArtistDetail';
import type {LibraryStackParams} from './types';

const Stack = createNativeStackNavigator<LibraryStackParams>();

export default function LibraryStack() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="LibraryHome" component={LibraryScreen} />
      <Stack.Screen name="LikedSongs" component={LikedSongsScreen} />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
}