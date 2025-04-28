/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { iconBackgroundColors, tagColors } from './TagColors';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  // Common colors used across both themes
  primary: '#9d9fe1', // Purple button color
  secondary: '#F5E9DC80', // Beige background
  purple: '#9747FF',
  mildPurple: '#E8DEF8',
  red: '#FF3B30',
  white: '#ffffff',
  black: '#000000',
  brown1: '#F5E9DC80',
  brown2: '#9C8B77',
  border: '#C6C6C8',
  link: '#007aff',
  disabled: '#ccc',
  grey1: '#F5F5F5',

  // Theme-specific colors
  light: {
    textPrimary: '#11181C',
    textSecondary: '#49454F',
    background: '#ffffff',
    backgroundSecondary: '#F5E9DC80',
    backgroundVoiceRecording: '#9747FF',
    borderPrimary: '#F5F5F5',
    modalOverlay: '#00000080',
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
    backgroundVoiceRecording: '#151718',
    borderPrimary: '#ECEDEE',
    modalOverlay: '#ffffff33',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },

  // Tag Colors
  tagColors: tagColors,

  // Icon Background Colors
  iconBackgroundColors: iconBackgroundColors,
};
