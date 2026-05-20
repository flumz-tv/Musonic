/**
 * @file PlusCircleIcon.tsx
 * @description Outlined circle with a plus sign. Used for add-to-library actions.
 * @author DoodzProg
 * @version 1.0.0
 * @license CC-BY-NC-4.0
 */
import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

type Props = {size?: number; color?: string};

export default function PlusCircleIcon({size = 26, color = '#fff'}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M13 8 L13 18 M8 13 L18 13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
