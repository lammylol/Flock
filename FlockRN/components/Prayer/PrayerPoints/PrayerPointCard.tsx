import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Entypo, MaterialIcons } from '@expo/vector-icons';

interface PrayerPointProps {
  title: string;
  content: string;
  isEditMode: boolean;
  drag?: () => void;
  onDelete?: () => void;
}

const PrayerPointCard: React.FC<PrayerPointProps> = ({
  title,
  content,
  isEditMode,
  drag,
  onDelete,
}) => {
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  return (
    <ThemedView style={styles.prayerPointContainer}>
      {isEditMode && (
        <ThemedView style={styles.iconContainer}>
          <MaterialIcons
            name="drag-handle"
            size={20}
            color={Colors.light.textSecondary}
            onLongPress={drag}
          />
        </ThemedView>
      )}

      <ThemedView style={styles.contentContainer}>
        {/* Title Rendering */}
        {isEditMode ? (
          <TextInput
            style={[styles.titleText, styles.input]}
            value={editableTitle}
            onChangeText={setEditableTitle}
            multiline={true}
          />
        ) : (
          <ThemedText style={styles.titleText}>{editableTitle}</ThemedText>
        )}

        {/* Content Rendering */}
        {isEditMode ? (
          <TextInput
            style={[styles.contentText, styles.input]}
            value={editableContent}
            onChangeText={setEditableContent}
            multiline={true}
          />
        ) : (
          <ThemedText style={styles.contentText}>{editableContent}</ThemedText>
        )}
      </ThemedView>

      {isEditMode && (
        <ThemedView style={styles.iconContainer}>
          <Entypo
            name="circle-with-minus"
            size={20}
            color={Colors.light.textSecondary}
            onPress={onDelete}
          />
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    maxWidth: '100%', // Ensure it doesn't overflow the parent container
  },
  contentText: {
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 5,
  },
  input: {
    padding: 4,
  },
  prayerPointContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: '100%', // Ensure it doesn't overflow the parent container
    width: '100%',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default PrayerPointCard;
