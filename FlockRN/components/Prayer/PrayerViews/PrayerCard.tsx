import { ThemedText } from '@/components/ThemedText';
import {
  AnyPrayerEntity,
  PartialLinkedPrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
} from '@/types/firebase';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { IconBackgroundSquare } from '@/components/ui/IconBackgroundSquare';
import { Entypo } from '@expo/vector-icons';
import { prayerTagDisplayNames, prayerTags } from '@/types/Tag';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { useMemo } from 'react';
import { getEntityType } from '@/types/typeGuards';
import { getPrayerType } from '@/utils/prayerUtils';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { EditMode } from '@/types/ComponentProps';

interface EditablePrayerCardProps {
  prayer: AnyPrayerEntity;
  editable?: boolean;
  onDelete?: () => void;
  onChange?: (updated: PrayerPoint) => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
  showContent?: boolean;
  maxLines?: number;
  index?: number; // for use when selecting a prayer point w/o id.
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
  const isEditMode = false; // temporarily set to false until we update prayer cards.

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

  const triggerChange = (partial: PartialLinkedPrayerEntity) => {
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

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/(prayers)/(createPrayer)/createPrayerPointFromContent',
      params: {
        editMode: EditMode.EDIT,
        id: prayer.id,
      },
    });
  };

  const handlePress = () => {
    if (editable) {
      // this basically makes the whole prayer card editable.
      handleEdit();
      return;
    }
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
            type={
              entityType === EntityType.PrayerPoint
                ? prayerType
                : entityType === EntityType.PrayerTopic
                  ? prayer?.journey?.[0]?.prayerType
                  : undefined
            }
          />
        )}
        <View style={styles.titleContainer}>
          {isEditMode ? (
            <TextInput
              value={prayer.title}
              onChangeText={handleTitleChange}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors[colorScheme].textSecondary}
            />
          ) : (
            <ThemedText style={styles.titleText}>
              {isPrayerPoint || isPrayerTopic
                ? isPrayerTopic
                  ? `#${prayer.title}`
                  : prayer.title
                : formattedDate}
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
                {isPrayerPoint && prayerType && (
                  <ThemedText>
                    {prayerTagDisplayNames[prayerType]
                      ?.charAt(0)
                      .toUpperCase() +
                      prayerTagDisplayNames[prayerType]?.slice(1)}
                  </ThemedText>
                )}
                {isPrayerTopic && <ThemedText>{'Topic'}</ThemedText>}
              </ThemedText>
            )
          )}
        </View>
        {editable && (
          <TouchableOpacity onPress={handleEdit} style={styles.editContainer}>
            {!isEditMode && (
              <ThemedView style={styles.editButton}>
                <Entypo name="edit" size={10} color={Colors.white} />
              </ThemedView>
            )}
            <ThemedText style={styles.editText}>
              {!isEditMode ? 'Edit' : 'Done'}
            </ThemedText>
          </TouchableOpacity>
        )}

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
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.textPrimary,
    borderRadius: 12,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  editContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'flex-start',
  },
  editText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    gap: 15,
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
