import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

export function PrayerContent({
  isEditMode,
  backgroundColor,
  prayerOrPrayerPoint,
  prayerId,
}: {
  isEditMode?: boolean;
  backgroundColor?: string;
  prayerOrPrayerPoint: 'prayer' | 'prayerPoint';
  prayerId: string;
}): JSX.Element {
  const { userPrayers, userPrayerPoints, updateCollection } =
    usePrayerCollection();

  const selectedPrayer =
    prayerOrPrayerPoint === 'prayer'
      ? userPrayers.find((prayer) => prayer.id === prayerId)
      : userPrayerPoints.find((prayerPoint) => prayerPoint.id === prayerId);

  const title = selectedPrayer?.title || 'Untitled Prayer';
  const content = selectedPrayer?.content || 'Untitled Prayer';
  const tags = selectedPrayer?.tags || [];

  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);
  console.log('PrayerContent', { title, content, tags });

  const handleTitleChange = (text: string) => {
    setEditableTitle(text);
    updateCollection({ ...selectedPrayer }, prayerOrPrayerPoint);
  };

  const handleContentChange = (text: string) => {
    setEditableContent(text);
    updateCollection({ ...selectedPrayer }, prayerOrPrayerPoint);
  };

  const formattedDate = (() => {
    if (!selectedPrayer?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      selectedPrayer.createdAt instanceof Date
        ? selectedPrayer.createdAt
        : typeof selectedPrayer.createdAt === 'object' &&
          'seconds' in selectedPrayer.createdAt
          ? new Date(selectedPrayer.createdAt.seconds * 1000)
          : new Date(selectedPrayer.createdAt);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      {isEditMode && prayerOrPrayerPoint === 'prayerPoint' ? (
        <TextInput
          style={[styles.titleText, styles.input]}
          value={editableTitle}
          onChangeText={handleTitleChange}
          multiline
          maxLength={100}
        />
      ) : prayerOrPrayerPoint === 'prayerPoint' ? (
        <ThemedText style={styles.titleText}>{title}</ThemedText>
      ) : (
        <ThemedText style={styles.titleText}>{formattedDate}</ThemedText>
      )}
      {isEditMode ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={editableContent}
          onChangeText={handleContentChange}
          multiline
        />
      ) : (
        <ThemedText style={styles.contentText}>{content}</ThemedText>
      )}
      <TagsSection tags={tags} prayerId={selectedPrayer?.id || ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    gap: 10,
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
    lineHeight: 36,
  },
});

export default PrayerContent;
