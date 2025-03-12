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
      <Text style={styles.label}>Tags:</Text>
      {!expanded ? (
        <TouchableOpacity style={styles.tagsContainer} onPress={toggleExpand}>
          {sortedTags.map((tag) => renderTag(tag))}
          <TouchableOpacity style={styles.editButton} onPress={toggleExpand}>
            <Feather name="edit-2" size={14} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={styles.containerExpanded}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editing Tags</Text>
              <TouchableOpacity onPress={saveTags}>
                <Text style={styles.doneText}>Done</Text>
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
  doneText: { color: Colors.brown2, fontSize: 16, fontWeight: '600' },
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.brown2,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  modalContent: {
    backgroundColor: Colors.brown1,
    borderRadius: 12,
    padding: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { color: Colors.brown2, fontSize: 16, fontWeight: '600' },
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
});

export default TagsList;
