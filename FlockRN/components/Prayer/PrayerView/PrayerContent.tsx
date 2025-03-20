import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';

interface PrayerContentProps {
  title: string;
  content: string;
}

const PrayerContent: React.FC<PrayerContentProps> = ({ title, content }) => {
  return (
    <View styles={styles.container}>
      <ThemedText style={styles.titleText}>{title}</ThemedText>
      <ThemedText style={styles.contentText}>{content}</ThemedText>
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
