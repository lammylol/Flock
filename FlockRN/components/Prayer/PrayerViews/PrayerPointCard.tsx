import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { IconBackgroundSquare } from '@/components/ui/IconBackgroundSquare';
import { Entypo } from '@expo/vector-icons';
import { prayerTagDisplayNames, prayerTags } from '@/types/Tag';
import { PrayerPoint, PrayerTopic } from '@/types/firebase';
import { PrayerType } from '@/types/PrayerSubtypes';

interface EditablePrayerPointCardProps {
  prayerPoint: PrayerPoint;
  isEditMode: boolean;
  onDelete?: () => void;
  onChange?: (updated: PrayerPoint) => void;
}

const EditablePrayerPointCard: React.FC<EditablePrayerPointCardProps> = ({
  prayerPoint,
  isEditMode,
  onDelete,
  onChange,
}) => {
  const colorScheme = useColorScheme() ?? 'light';

  const triggerChange = (
    partial: Partial<PrayerPoint> | Partial<PrayerTopic>,
  ) => {
    if (!onChange) return;

    const updatedPrayer = {
      ...(prayerPoint || {}),
      ...partial,
    };

    console.log(updatedPrayer);

    onChange(updatedPrayer as PrayerPoint);
  };

  const handleTitleChange = (text: string) => {
    triggerChange({ title: text });
  };

  const handleContentChange = (text: string) => {
    triggerChange({ content: text });
  };

  const handleTypeChange = (tag: string) => {
    const tags = [tag as PrayerType];
    triggerChange({
      tags: tags,
      prayerType: tags[0] || PrayerType.Request,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.headerContainer}>
        <IconBackgroundSquare type={prayerPoint.prayerType} />
        <View style={styles.titleContainer}>
          {isEditMode ? (
            <TextInput
              value={prayerPoint.title}
              onChangeText={handleTitleChange}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors[colorScheme].textSecondary}
            />
          ) : (
            <ThemedText style={styles.titleText}>
              {prayerPoint.title}
            </ThemedText>
          )}
          {isEditMode ? (
            <View style={styles.typeSelector}>
              {prayerTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor:
                        tag === prayerPoint.prayerType
                          ? Colors.tagColors.typeColors[tag]
                          : Colors.tagColors.defaultTag,
                    },
                  ]}
                  onPress={() => handleTypeChange(tag)}
                >
                  <ThemedText style={styles.tagText}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ThemedText
              style={[
                styles.subtitle,
                { color: Colors[colorScheme].textSecondary },
              ]}
            >
              {(prayerTagDisplayNames[prayerPoint.prayerType]
                ?.charAt(0)
                .toUpperCase() ?? '') +
                (prayerTagDisplayNames[prayerPoint.prayerType]?.slice(1) ?? '')}
            </ThemedText>
          )}
        </View>

        {isEditMode && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteIcon}>
            <Entypo
              name="circle-with-minus"
              size={20}
              color={Colors[colorScheme].textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {isEditMode ? (
        <TextInput
          value={prayerPoint.content}
          onChangeText={handleContentChange}
          style={styles.contentInput}
          placeholder="Write your prayer..."
          placeholderTextColor={Colors[colorScheme].textSecondary}
          multiline
        />
      ) : (
        <ThemedText style={styles.contentText}>
          {prayerPoint.content}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingVertical: 10,
    gap: 10,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 4,
  },
  deleteIcon: {
    padding: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EditablePrayerPointCard;
