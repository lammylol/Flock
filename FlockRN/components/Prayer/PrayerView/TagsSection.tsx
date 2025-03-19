import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tagDisplayNames, allTags } from '@/types/Tag';
import { CreatePrayerDTO, PrayerTag } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface TagsListProps {
  prayerId: string;
  tags: PrayerTag[];
}

const getTagColor = (tag: string) =>
  Colors.tagColors.selectedColors[
    tag as keyof typeof Colors.tagColors.selectedColors
  ] || Colors.tagColors.defaultTag;

const getTagName = (tag: string) => tagDisplayNames[tag] || tag;

// Provide opposite tags to be deselected to ensure mutual exclusivity.
// Current vs. Answered. Praise vs. Prayer Request.
const oppositeTags = (tag: PrayerTag): PrayerTag => {
  const tagMap: Partial<Record<PrayerTag, PrayerTag>> = {
    answered: 'current',
    current: 'answered',
    prayerRequest: 'praise',
    praise: 'prayerRequest',
  };
  return tagMap[tag] || tag;
};

const TagsList = ({ prayerId, tags }: TagsListProps) => {
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>(tags);
  const [expanded, setExpanded] = useState(false);
  const backgroundColor = useThemeColor(
    { light: Colors.brown1, dark: Colors.black },
    'background',
  );
  const textColor = useThemeColor({ light: Colors.brown2 }, 'textPrimary');
  const tagLabelText = useThemeColor(
    { light: Colors.light.textSecondary },
    'textPrimary',
  );

  useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  const sortedTags = useMemo(() => {
    return [...selectedTags].sort(
      (a, b) => allTags.indexOf(a) - allTags.indexOf(b),
    );
  }, [selectedTags]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const toggleTag = (tag: PrayerTag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else if (
        ['current', 'answered', 'prayerRequest', 'praise'].includes(tag)
      ) {
        return [...prev.filter((t) => t !== oppositeTags(tag)), tag];
      } else {
        return [...prev, tag];
      }
    });
  };

  const saveTags = async () => {
    toggleExpand();
    try {
      await prayerService.updatePrayer(prayerId, {
        tags: selectedTags,
      } as CreatePrayerDTO);
    } catch {
      console.error('Error updating tags');
    }
  };

  const renderTag = (tag: PrayerTag, isSelectable = false) => (
    <TouchableOpacity
      key={tag}
      style={[
        styles.tag,
        {
          backgroundColor: selectedTags.includes(tag)
            ? getTagColor(tag)
            : Colors.tagColors.defaultTag,
        },
      ]}
      onPress={isSelectable ? () => toggleTag(tag) : toggleExpand}
    >
      <Text
        style={[
          styles.tagText,
          selectedTags.includes(tag) && styles.selectedTagText,
        ]}
      >
        {getTagName(tag)}
      </Text>
    </TouchableOpacity>
  );

  const allTagsRendered = useMemo(
    () => allTags.map((tag) => renderTag(tag, true)),
    [selectedTags],
  );

  return (
    <View style={styles.container}>
      <ThemedText style={{ ...styles.tagsTitle, color: tagLabelText }}>
        Tags:
      </ThemedText>
      {!expanded ? (
        <TouchableOpacity style={styles.tagsContainer} onPress={toggleExpand}>
          {sortedTags.map((tag) => renderTag(tag))}
          <TouchableOpacity style={styles.editButton} onPress={toggleExpand}>
            <Feather name="edit-2" size={14} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={styles.containerExpanded}>
          <View
            style={[styles.modalContent, { backgroundColor: backgroundColor }]}
          >
            <View style={styles.modalHeader}>
              <Text style={{ ...styles.modalTitle, color: textColor }}>
                Editing Tags
              </Text>
              <TouchableOpacity onPress={saveTags}>
                <Text style={{ ...styles.modalTitle, color: textColor }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>{allTagsRendered}</View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  containerExpanded: { marginHorizontal: -12 },
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.brown2,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  modalContent: {
    borderRadius: 12,
    padding: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '500' },
  selectedTagText: { color: Colors.white, fontWeight: '400' },
  tag: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontWeight: '400' },
  tagsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 20,
  },
  tagsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});

export default TagsList;
