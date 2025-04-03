import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface PrayerContentProps {
  title: string;
  content: string;
}

const PrayerContent: React.FC<PrayerContentProps> = ({ title, content }) => {
  return (
    <View style={styles.container}>
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
  container: {
    gap: 10,
  },
  contentText: {
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default PrayerContent;
