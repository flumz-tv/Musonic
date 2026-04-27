import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';

type Props = {visible: boolean; message: string};

export default function Toast({visible, message}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 280,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[styles.toast, {opacity}]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  text: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});
