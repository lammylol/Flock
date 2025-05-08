import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { EditMode } from '@/types/ComponentProps';

export function PrayerContent({
  editMode,
  backgroundColor,
  prayerOrPrayerPoint,
  prayer,
  onChange, // Callback for changes
}: {
  editMode: EditMode;
  backgroundColor?: string;
  prayerOrPrayerPoint: EntityType;
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
    triggerChange({
      tags: tags,
      prayerType: tags[0] || PrayerType.Request,
    });
  };

  const triggerChange = (partial: Partial<Prayer | PrayerPoint>) => {
    if (!onChange) return;

    const updatedPrayer = {
      ...(prayer || {}),
      ...partial,
    };

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
      {(editMode === EditMode.EDIT || editMode === EditMode.CREATE) &&
      prayerOrPrayerPoint === EntityType.PrayerPoint ? (
        <TextInput
          style={[styles.titleText, styles.input]}
          value={prayer?.title}
          onChangeText={handleTitleChange}
          multiline
          maxLength={100}
          placeholder="Enter a title"
          scrollEnabled={false}
        />
      ) : prayerOrPrayerPoint === EntityType.PrayerPoint ? (
        <ThemedText style={styles.titleText}>{prayer?.title}</ThemedText>
      ) : (
        <ThemedText style={styles.titleText}>
          {editMode === EditMode.CREATE ? 'Transcript' : formattedDate}
        </ThemedText>
      )}
      {editMode === EditMode.EDIT || editMode === EditMode.CREATE ? (
        <TextInput
          style={[styles.contentText, styles.input]}
          value={prayer?.content}
          onChangeText={handleContentChange}
          multiline
          placeholder="Enter your prayer point here"
          scrollEnabled={false}
        />
      ) : (
        <ThemedText style={styles.contentText}>{prayer?.content}</ThemedText>
      )}
      {prayerOrPrayerPoint === EntityType.PrayerPoint &&
        prayer &&
        'prayerType' in prayer && (
          <TagsSection
            tags={
              !prayer.tags || prayer.tags.length === 0
                ? [prayer.prayerType]
                : prayer.tags || [PrayerType.Request]
            } // this is a workaround for the issue where prayerType is not set
            onChange={handleTagsChange}
            editMode={editMode}
          />
        )}
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
