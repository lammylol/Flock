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
  onChange, // Callback for changes
  initialTitle, // Added prop for direct title initialization
  initialContent, // Added prop for direct content initialization
  initialTags, // Added prop for direct tags initialization
}: {
  editMode: 'create' | 'edit' | 'view';
  backgroundColor?: string;
  prayerOrPrayerPoint: 'prayer' | 'prayerPoint';
  prayerId?: string; // only required for edit and view modes
  onChange?: (updatedPrayer: PrayerPoint | Prayer) => void;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: PrayerType[];
}): JSX.Element {
  const { userPrayers, userPrayerPoints } = usePrayerCollection();

  // Log received props for debugging
  useEffect(() => {
    console.log('PrayerContent received props:', {
      editMode,
      prayerId,
      initialTitle: initialTitle?.substring(0, 20) + (initialTitle && initialTitle.length > 20 ? '...' : ''),
      hasInitialContent: !!initialContent,
      hasInitialTags: !!initialTags && initialTags.length > 0,
    });
  }, [editMode, prayerId, initialTitle, initialContent, initialTags]);

  const selectedPrayer =
    prayerOrPrayerPoint === 'prayer'
      ? userPrayers.find((prayer) => prayer.id === prayerId)
      : userPrayerPoints.find((prayerPoint) => prayerPoint.id === prayerId);

  // Log if prayer was found in context
  useEffect(() => {
    if (prayerId) {
      console.log('Looking for prayer ID in context:', prayerId);
      console.log('Prayer found in context:', !!selectedPrayer);
      if (selectedPrayer) {
        console.log('Prayer data from context:', {
          title: selectedPrayer.title,
          content: selectedPrayer.content?.substring(0, 20) + '...',
        });
      }
    }
  }, [prayerId, selectedPrayer]);

  // Use direct props if provided, otherwise fall back to selected prayer data
  const title = initialTitle !== undefined ? initialTitle : selectedPrayer?.title;
  const content = initialContent !== undefined ? initialContent : selectedPrayer?.content;
  const tags = initialTags || selectedPrayer?.tags || [];

  // Initialize state with provided values or from the selected prayer
  const [updatedTags, setUpdatedTags] = useState<PrayerType[]>(tags);
  const [editableTitle, setEditableTitle] = useState(title || '');
  const [editableContent, setEditableContent] = useState(content || '');

  // Update state when direct props change
  useEffect(() => {
    if (initialTitle !== undefined) {
      console.log('Updating title from props:', initialTitle);
      setEditableTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (initialContent !== undefined) {
      console.log('Updating content from props');
      setEditableContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (initialTags) {
      console.log('Updating tags from props:', initialTags);
      setUpdatedTags(initialTags);
    }
  }, [initialTags]);

  // Also update when selectedPrayer changes (for cases when initialProps aren't provided)
  useEffect(() => {
    if (selectedPrayer) {
      console.log('Prayer data updated from context');
      
      if (!initialTitle && selectedPrayer.title) {
        console.log('Setting title from context:', selectedPrayer.title);
        setEditableTitle(selectedPrayer.title);
      }
      
      if (!initialContent && selectedPrayer.content) {
        console.log('Setting content from context');
        setEditableContent(selectedPrayer.content);
      }
      
      if (!initialTags && selectedPrayer.tags) {
        console.log('Setting tags from context:', selectedPrayer.tags);
        setUpdatedTags(selectedPrayer.tags);
      }
    }
  }, [selectedPrayer, initialTitle, initialContent, initialTags]);

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
    // Only call onChange if it exists
    if (onChange) {
      const baseData = selectedPrayer || {};
      const updatedPrayer = {
        ...baseData,
        title: editableTitle || '',
        content: editableContent || '',
        tags: updatedTags || [],
      };

      console.log('Sending prayer update to parent:', {
        title: updatedPrayer.title,
        contentLength: updatedPrayer.content?.length || 0,
        tags: updatedPrayer.tags
      });

      if (prayerOrPrayerPoint === 'prayer') {
        onChange(updatedPrayer as Prayer);
      } else {
        onChange(updatedPrayer as PrayerPoint);
      }
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
      <TagsSection
        tags={updatedTags}
        onChange={handleTagsChange}
        editMode={editMode}
      />
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