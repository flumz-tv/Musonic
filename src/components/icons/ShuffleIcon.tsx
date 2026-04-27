import React from 'react';
import {View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {darkTheme} from '../../theme';

type Props = {
  active?: boolean;
  size?: number;
};

export default function ShuffleIcon({active = false, size = 22}: Props) {
  const col = active ? darkTheme.accent : 'rgba(255,255,255,0.7)';
  return (
    <View style={{alignItems: 'center'}}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
          stroke={col}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      {active && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: darkTheme.accent,
            marginTop: 3,
            alignSelf: 'center',
          }}
        />
      )}
    </View>
  );
}
