import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import CoverArt from './CoverArt';
import {darkTheme} from '../theme';

type Props = {
  id: string;
  name: string;
  artist?: string;
  coverArt?: string;
  imageUrl?: string;
  onPress?: () => void;
};

export default function AlbumCard({name, artist, coverArt, imageUrl, onPress}: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <CoverArt id={coverArt} size={150} borderRadius={6} imageUrl={imageUrl} />
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {artist && (
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    marginRight: 14,
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.textPrimary,
    lineHeight: 18,
  },
  artist: {
    marginTop: 3,
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
});
