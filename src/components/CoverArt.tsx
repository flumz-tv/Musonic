import React from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {getCoverArtUrl} from '../api/client';
import {darkTheme} from '../theme';

type Props = {
  id?: string;
  size: number;
  borderRadius?: number;
  imageUrl?: string;
};

export default function CoverArt({id, size, borderRadius = 4, imageUrl}: Props) {
  const uri = imageUrl ?? (id ? getCoverArtUrl(id, size * 2) : null);

  return (
    <View
      style={[
        styles.placeholder,
        {width: size, height: size, borderRadius},
        !uri && styles.empty,
      ]}>
      {uri && (
        <FastImage
          style={{width: size, height: size, borderRadius}}
          source={{uri, priority: FastImage.priority.normal}}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: darkTheme.surfaceAlt,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
