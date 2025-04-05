import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface PrayerContentProps {
  title: string;
  content: string;
  isEditMode?: boolean;
  onTitleChange?: (newTitle: string) => void;
  onContentChange?: (newContent: string) => void;
  titlePlaceholder?: string;
  contentPlaceholder?: string;
  backgroundColor?: string;
}

export function PrayerContent({
  title,
  content,
  isEditMode,
  onTitleChange,
  onContentChange,
  titlePlaceholder,
  contentPlaceholder,
  backgroundColor,
}: PrayerContentProps): JSX.Element {
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  const handleTitleChange = (text: string) => {
    setEditableTitle(text);
    onTitleChange?.(text); // Pass updated title to parent if provided
  };

  const handleContentChange = (text: string) => {
    setEditableContent(text);
    onContentChange?.(text); // Pass updated content to parent if provided
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      {isEditMode ? (
        <TextInput
          style={[styles.titleText, styles.input]}
          value={editableTitle}
          placeholder={titlePlaceholder}
          onChangeText={handleTitleChange}
          multiline={true}
          maxLength={100}
        />
      ) : (
        <ThemedText style={styles.titleText}> {title}</ThemedText>
      )}
      {isEditMode ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={editableContent}
          onChangeText={handleContentChange}
          placeholder={contentPlaceholder}
          multiline={true}
        />
      ) : (
        <ThemedText style={styles.contentText}>{content}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    flex: 0,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  contentText: {
    fontSize: 16,
  },
  input: {
    padding: 4,
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
});

export default PrayerContent;
