import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';

interface PrayerContentProps {
  title: string;
  content: string;
}

const PrayerContent: React.FC<PrayerContentProps> = ({ title, content }) => {
  return (
    <View>
      <ThemedText
        lightColor={Colors.light.textSecondary}
        darkColor={Colors.dark.textPrimary}
        style={styles.titleText}
      >
        {title}
      </ThemedText>
      <ThemedText
        lightColor={Colors.light.textSecondary}
        darkColor={Colors.dark.textPrimary}
        style={styles.contentText}
      >
        {content}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  contentText: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
    padding: 16,
  },
});

export default PrayerContent;
