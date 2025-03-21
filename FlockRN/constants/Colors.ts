/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { tagColors } from './TagColors';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  // Common colors used across both themes
  primary: '#9d9fe1', // Purple button color
  secondary: '#f1eee0', // Beige background
  purple: '#9747FF',
  white: '#ffffff',
  black: '#000000',
  brown1: '#EDE8DA',
  brown2: '#9C8B77',
  brown3: '#F5E9DC',
  border: '#C6C6C8',
  link: '#007aff',
  disabled: '#ccc',
  grey1: '#e6e6e6',

  // Theme-specific colors
  light: {
    textPrimary: '#11181C',
    textSecondary: '#49454F',
    background: '#ffffff',
    backgroundSecondary: '#f1eee0',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    textPrimary: '#ECEDEE',
    textSecondary: '#49454F',
    background: '#151718',
    backgroundSecondary: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },

  // Tag Colors
  tagColors: tagColors,
};
