import type { PropsWithChildren } from 'react';
import { RefreshControl, ScrollViewProps, StyleSheet } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

type Props = PropsWithChildren<ScrollViewProps> & {
  refreshing?: boolean; // Parent manages refresh state
  onRefresh?: () => void; // Parent handles refresh logic
};

export function ThemedScrollView({
  children,
  style,
  refreshing,
  onRefresh,
  ...props
}: Props) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const bottom = useBottomTabOverflow();
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom },
          style,
        ]}
        style={[{ backgroundColor }, props.style]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
            />
          ) : undefined
        }
        {...props} // Spread all other props
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
    paddingHorizontal: 32,
  },
});
