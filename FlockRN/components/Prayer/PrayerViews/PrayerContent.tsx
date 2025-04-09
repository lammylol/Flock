import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { Prayer, PrayerPoint, PrayerType } from '@/types/firebase';

export function PrayerContent({
  editMode,
  backgroundColor,
  prayerOrPrayerPoint,
  prayerId,
  onChange, // New prop to receive the callback
}: {
  editMode: 'create' | 'edit' | 'view';
  backgroundColor?: string;
  prayerOrPrayerPoint: 'prayer' | 'prayerPoint';
  prayerId?: string; // only required for edit and view modes
  onChange?: (updatedPrayer: PrayerPoint | Prayer) => void;
}): JSX.Element {
  const { userPrayers, userPrayerPoints } = usePrayerCollection();

  const selectedPrayer =
    prayerOrPrayerPoint === 'prayer'
      ? userPrayers.find((prayer) => prayer.id === prayerId)
      : userPrayerPoints.find((prayerPoint) => prayerPoint.id === prayerId);

  const title = selectedPrayer?.title;
  const content = selectedPrayer?.content;
  const tags = selectedPrayer?.tags || [];

  const [updatedTags, setUpdatedTags] = useState<PrayerType[]>(tags);
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  const handleTitleChange = (text: string) => {
    setEditableTitle(text);
  };

  const handleContentChange = (text: string) => {
    setEditableContent(text);
  };

  const handleTagsChange = (tags: PrayerType[]) => {
    setUpdatedTags(tags);
  };

  useEffect(() => {
    const updatedPrayer = {
      ...selectedPrayer,
      title: editableTitle || '',
      content: editableContent || '',
      tags: updatedTags || [],
    };

    if (prayerOrPrayerPoint === 'prayer') {
      onChange?.(updatedPrayer as Prayer);
    } else {
      onChange?.(updatedPrayer as PrayerPoint);
    }
  }, [editableTitle, editableContent, updatedTags]);

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
      {(editMode === 'edit' || editMode === 'create') &&
        prayerOrPrayerPoint === 'prayerPoint' ? (
        <TextInput
          style={[styles.titleText, styles.input]}
          value={editableTitle}
          onChangeText={handleTitleChange}
          multiline
          maxLength={100}
          placeholder="Enter a title"
        />
      ) : prayerOrPrayerPoint === 'prayerPoint' ? (
        <ThemedText style={styles.titleText}>{title}</ThemedText>
      ) : (
        <ThemedText style={styles.titleText}>{formattedDate}</ThemedText>
      )}
      {editMode === 'edit' || editMode === 'create' ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={editableContent}
          onChangeText={handleContentChange}
          multiline
          placeholder="Enter your prayer point here"
        />
      ) : (
        <ThemedText style={styles.contentText}>{content}</ThemedText>
      )}
      <TagsSection tags={updatedTags} onChange={handleTagsChange} />
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
