import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';

interface PrayerPointProps {
  title: string;
  content: string;
  mode: 'create' | 'update';
}

const PrayerPointCard: React.FC<PrayerPointProps> = ({
  title,
  content,
  mode,
}) => {
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  return (
    <View>
      {mode == 'update' ? (
        <TextInput
          style={[styles.titleText, styles.input]}
          value={editableTitle}
          onChangeText={setEditableTitle}
        />
      ) : (
        <ThemedText
          lightColor={Colors.light.textSecondary}
          darkColor={Colors.dark.textPrimary}
          style={styles.titleText}
        >
          {editableTitle}
        </ThemedText>
      )}
      {mode == 'update' ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={editableContent}
          onChangeText={setEditableContent}
          multiline
        />
      ) : (
        <ThemedText
          lightColor={Colors.light.textSecondary}
          darkColor={Colors.dark.textPrimary}
          style={styles.contentText}
        >
          {editableContent}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentText: {
    fontSize: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: Colors.light.textSecondary,
    padding: 4,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default PrayerPointCard;
