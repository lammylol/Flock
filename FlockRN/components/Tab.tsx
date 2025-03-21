import { Colors } from '@/constants/Colors';
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

type TabsProps = {
  tabs: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  indicatorColor?: string;
  textColor?: string;
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  selectedIndex,
  onChange,
  indicatorColor = Colors.primary,
}) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<number[]>([]);

  // Update the indicator animation when selectedIndex changes
  useEffect(() => {
    if (tabWidths.current.length === tabs.length) {
      const offset = tabWidths.current
        .slice(0, selectedIndex)
        .reduce((a, b) => a + b, 0);
      Animated.spring(indicatorAnim, {
        toValue: offset,
        useNativeDriver: false,
      }).start();
    }
  }, [selectedIndex, tabWidths.current]);

  const onTabLayout = (event: LayoutChangeEvent, index: number) => {
    const { width } = event.nativeEvent.layout;
    tabWidths.current[index] = width;
    // Force a re-render once widths are calculated
    if (tabWidths.current.filter((w) => w > 0).length === tabs.length) {
      // Optionally adjust indicator to current position in case of dynamic layout changes
      const offset = tabWidths.current
        .slice(0, selectedIndex)
        .reduce((a, b) => a + b, 0);
      indicatorAnim.setValue(offset);
    }
  };

  // Calculate indicator width based on selected tab width
  const indicatorWidth = tabWidths.current[selectedIndex] || 0;

  return (
    <ThemedView style={styles.root}>
      <ThemedView style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <Pressable
            key={tab}
            style={styles.tabButton}
            onPress={() => onChange(index)}
            onLayout={(e) => onTabLayout(e, index)}
          >
            <ThemedText style={styles.tabText}>{tab}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>
      {/* Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: indicatorColor,
            width: indicatorWidth,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  indicator: {
    height: 3,
  },
  root: {
    // Use border bottom for overall tab bar look
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
});
