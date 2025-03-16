import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = PropsWithChildren & {
  style?: object;
};

export function ThemedScrollView({ children, style }: Props) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
<<<<<<< Updated upstream
  const bottom = useBottomTabOverflow();
  const backgroundColor = useThemeColor({}, 'background'); // Ensure background is themed
=======
  const bottomTabHeight = useBottomTabOverflow();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const backgroundColor = useThemeColor({}, 'background');
>>>>>>> Stashed changes

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom: bottomTabHeight }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomTabHeight - insets.bottom + 10 },
        ]}
<<<<<<< Updated upstream
        style={{ backgroundColor }} // Apply theme-based background
=======
        style={[{ backgroundColor }, style]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
            />
          ) : undefined
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={'on-drag'}
        {...props} // Spread all other props
>>>>>>> Stashed changes
      >
        {children}
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1, // Ensures the content expands
    gap: 16,
  },
});
