import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';
import { PrayerOrPrayerPointType } from '@/types/PrayerSubtypes';
import { Prayer, PrayerPoint, PrayerType } from '@/types/firebase';

export function PrayerContent({
  editMode,
  backgroundColor,
  prayerOrPrayerPoint,
  prayer,
  onChange, // Callback for changes
}: {
  editMode: 'create' | 'edit' | 'view';
  backgroundColor?: string;
  prayerOrPrayerPoint: PrayerOrPrayerPointType;
  prayer?: Prayer | PrayerPoint; // only required for edit and view modes
  onChange?: (updatedPrayer: PrayerPoint | Prayer) => void;
}): JSX.Element {
  // Initialize state with provided values or from the selected prayer
  const handleTitleChange = (text: string) => {
    triggerChange({ title: text });
  };

  const handleContentChange = (text: string) => {
    triggerChange({ content: text });
  };

  const handleTagsChange = (tags: PrayerType[]) => {
    triggerChange({ tags: tags, type: tags[0] || 'request' });
  };

  const triggerChange = (partial: Partial<Prayer | PrayerPoint>) => {
    if (!onChange) return;

    console.log(partial);

    const updatedPrayer = {
      ...(prayer || {}),
      ...partial,
    };

    console.log(updatedPrayer);

    onChange(
      prayerOrPrayerPoint === 'prayer'
        ? (updatedPrayer as Prayer)
        : (updatedPrayer as PrayerPoint),
    );
  };

  const formattedDate = (() => {
    if (!prayer?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      prayer.createdAt instanceof Date
        ? prayer.createdAt
        : typeof prayer.createdAt === 'object' && 'seconds' in prayer.createdAt
          ? new Date(prayer.createdAt.seconds * 1000)
          : new Date(prayer.createdAt);

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
          value={prayer?.title}
          onChangeText={handleTitleChange}
          multiline
          maxLength={100}
          placeholder="Enter a title"
        />
      ) : prayerOrPrayerPoint === 'prayerPoint' ? (
        <ThemedText style={styles.titleText}>{prayer?.title}</ThemedText>
      ) : (
        <ThemedText style={styles.titleText}>{formattedDate}</ThemedText>
      )}
      {editMode === 'edit' || editMode === 'create' ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={prayer?.content}
          onChangeText={handleContentChange}
          multiline
          placeholder="Enter your prayer point here"
        />
      ) : (
        <ThemedText style={styles.contentText}>{prayer?.content}</ThemedText>
      )}
      <TagsSection
        tags={prayer?.tags || []}
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
