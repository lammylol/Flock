import React from 'react';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '../ThemedView';

interface ContentUnvailableProps {
  errorTitle: string;
  errorMessage: string;
}

const ContentUnavailable: React.FC<ContentUnvailableProps> = ({
  errorTitle,
  errorMessage,
}) => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText
        lightColor={Colors.light.textPrimary}
        darkColor={Colors.dark.textPrimary}
        style={styles.titleText}
      >
        {errorTitle}
      </ThemedText>
      <ThemedText
        lightColor={Colors.light.textSecondary}
        darkColor={Colors.dark.textSecondary}
        style={styles.contentText}
      >
        {errorMessage}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  contentText: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default ContentUnavailable;
