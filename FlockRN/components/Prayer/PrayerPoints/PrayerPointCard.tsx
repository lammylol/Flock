import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';

interface PrayerPointProps {
  title: string;
  content: string;
}

const PrayerPointCard: React.FC<PrayerPointProps> = ({ title, content }) => {
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
    fontSize: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default PrayerPointCard;
