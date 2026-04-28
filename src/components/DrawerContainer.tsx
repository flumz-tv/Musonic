import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {darkTheme} from '../theme';
import CustomDrawerContent from './CustomDrawerContent';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

type DrawerCtx = {open: () => void; close: () => void};
const DrawerContext = createContext<DrawerCtx>({open: () => {}, close: () => {}});
export const useDrawer = () => useContext(DrawerContext);

type Props = {children: React.ReactNode};

export default function DrawerContainer({children}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => {
    setVisible(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const close = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setVisible(false));
  }, [progress]);

  const drawerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const contentTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DRAWER_WIDTH],
  });

  const contentScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const contentBorderRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < -30 || gs.vx < -0.3) {
          close();
        }
      },
    }),
  ).current;

  return (
    <DrawerContext.Provider value={{open, close}}>
      <View style={styles.root}>
        {/* Drawer panel (behind main content) */}
        {visible && (
          <Animated.View
            style={[
              styles.drawer,
              {transform: [{translateX: drawerTranslateX}]},
            ]}
            {...panResponder.panHandlers}>
            <CustomDrawerContent onClose={close} />
          </Animated.View>
        )}

        {/* Animated main content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                {translateX: contentTranslateX},
                {scale: contentScale},
              ],
              borderRadius: contentBorderRadius,
            },
          ]}>
          {children}

          {/* Overlay sombre + tap pour fermer */}
          {visible && (
            <TouchableWithoutFeedback onPress={close}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.overlay, {opacity: overlayOpacity},
                ]}
              />
            </TouchableWithoutFeedback>
          )}
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 0,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
  overlay: {backgroundColor: '#000'},
});
