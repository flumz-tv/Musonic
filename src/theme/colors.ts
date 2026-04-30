/**
 * @file colors.ts
 * @description Design-token colour palette and pre-built dark theme object.
 *   The app accent colour is #FF6B35 (orange) — intentionally distinct from
 *   Spotify green.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
export const palette = {
  black: '#000000',
  white: '#FFFFFF',
  orange: '#FF6B35',
  orangeDark: '#CC5220',
  grey100: '#121212',
  grey200: '#1A1A1A',
  grey300: '#282828',
  grey400: '#3E3E3E',
  grey500: '#535353',
  grey600: '#B3B3B3',
  grey700: '#E0E0E0',
};

export type Theme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  tabBar: string;
  tabBarBorder: string;
};

export const darkTheme: Theme = {
  background: palette.grey100,
  surface: palette.grey200,
  surfaceAlt: palette.grey300,
  border: palette.grey400,
  accent: palette.orange,
  textPrimary: palette.white,
  textSecondary: palette.grey600,
  tabBar: '#0A0A0A',
  tabBarBorder: palette.grey300,
};

export const lightTheme: Theme = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EBEBEB',
  border: '#D0D0D0',
  accent: palette.orange,
  textPrimary: '#000000',
  textSecondary: '#606060',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
};
