import { ThemedText } from '@/components/ThemedText';
import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
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
import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { useMemo } from 'react';
import { getEntityType } from '@/types/typeGuards';
import { getPrayerType } from '@/utils/prayerUtils';
import { router } from 'expo-router';

interface EditablePrayerCardProps {
  prayer: Prayer | PrayerPoint | PrayerTopic;
  editable?: boolean;
  onDelete?: () => void;
  onChange?: (updated: PrayerPoint) => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
  showContent?: boolean;
  maxLines?: number;
}

const EditablePrayerCard: React.FC<EditablePrayerCardProps> = ({
  prayer,
  editable,
  onDelete,
  onChange,
  isDisabled,
  children,
  showContent = true,
  maxLines,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const maxLinesValue = maxLines ?? 1;

  const { prayerType, entityType } = useMemo(
    () => ({
      prayerType: getPrayerType(prayer),
      entityType: getEntityType(prayer),
    }),
    [prayer],
  );

  // Use the entityType to create the boolean checks
  const isPrayerPoint = entityType === EntityType.PrayerPoint;
  const isPrayerTopic = entityType === EntityType.PrayerTopic;
  const isPrayer = entityType === EntityType.Prayer;

  const triggerChange = (
    partial: Partial<PrayerPoint> | Partial<PrayerTopic>,
  ) => {
    if (!onChange) return;
    onChange({ ...prayer, ...partial } as PrayerPoint);
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

  const handlePress = () => {
    if (entityType) {
      switch (entityType) {
        case 'prayerPoint':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerPointView',
            params: { id: prayer.id },
          });
          break;
        case 'prayer':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerView',
            params: { id: (prayer as Prayer).id },
          });
          break;
        case 'prayerTopic':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerTopicView',
            params: { id: (prayer as PrayerTopic).id },
          });
          break;
        default:
          // Handle unknown entity type
          console.error('Unknown entity type:', entityType);
          return;
      }
    }
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
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={!isDisabled ? handlePress : undefined}
      activeOpacity={isDisabled ? 1 : 0.7} // disable opacity change when disabled
    >
      <View style={styles.headerContainer}>
        {!isPrayer && (
          <IconBackgroundSquare
            entityType={entityType ?? EntityType.PrayerPoint}
            type={isPrayerPoint ? prayerType : undefined}
          />
        )}
        <View style={styles.titleContainer}>
          {editable ? (
            <TextInput
              value={prayer.title}
              onChangeText={handleTitleChange}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors[colorScheme].textSecondary}
            />
          ) : (
            <ThemedText style={styles.titleText}>
              {isPrayerPoint || isPrayerTopic ? prayer.title : formattedDate}
            </ThemedText>
          )}
          {editable ? (
            <View style={styles.typeSelector}>
              {prayerTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor:
                        tag === prayerType
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
            !isPrayer && (
              <ThemedText
                style={[
                  styles.subtitle,
                  { color: Colors[colorScheme].textSecondary },
                ]}
              >
                {prayerType &&
                  (prayerTagDisplayNames[prayerType]?.charAt(0).toUpperCase() ??
                    '') + (prayerTagDisplayNames[prayerType]?.slice(1) ?? '')}
              </ThemedText>
            )
          )}
        </View>

        {editable && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteIcon}>
            <Entypo
              name="circle-with-minus"
              size={20}
              color={Colors[colorScheme].textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {editable ? (
        <TextInput
          value={prayer.content}
          onChangeText={handleContentChange}
          style={styles.contentInput}
          placeholder="Write your prayer..."
          placeholderTextColor={Colors[colorScheme].textSecondary}
          multiline
        />
      ) : (
        prayer.content &&
        showContent && (
          <ThemedText style={styles.contentText} numberOfLines={maxLinesValue}>
            {prayer.content}
          </ThemedText>
        )
      )}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingVertical: 10,
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
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

export default EditablePrayerCard;
