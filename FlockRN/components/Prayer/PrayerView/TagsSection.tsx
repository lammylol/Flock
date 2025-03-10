import { useEffect, useState } from 'react';
import { tagDisplayNames } from '@/types/Tag';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CreatePrayerDTO, PrayerTag } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import { allTags } from '@/types/Tag';

interface TagsListProps {
  prayerId: string;
  tags: PrayerTag[]; // Destructure the prop properly as an array of PrayerTag
}

const TagsList = ({ prayerId, tags }: TagsListProps) => {
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>(tags);
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleTag = (tag: PrayerTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getTagColor = (tag: string) => {
    return (
      Colors.tagColors.selectedColors[
      tag as keyof typeof Colors.tagColors.selectedColors
      ] || Colors.tagColors.defaultTag
    );
  };

  const getTagName = (tag: string) => {
    return tagDisplayNames[tag] || tag;
  };

  const saveTags = async () => {
    const prayerData = {
      tags: selectedTags,
    } as CreatePrayerDTO;

    toggleExpand();

    try {
      await prayerService.updatePrayer(prayerId, prayerData);
    } catch {
      console.log('error' + Error);
    }
  };

  useEffect(() => {
    setSelectedTags(tags);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags:</Text>
      {!expanded && (
        <View>
          <TouchableOpacity
            style={styles.tagsContainer}
            onPress={() => toggleExpand()}
          >
            {selectedTags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selectedTags.includes(tag)
                      ? getTagColor(tag)
                      : Colors.tagColors.defaultTag,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText,
                  ]}
                >
                  {getTagName(tag)}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => toggleExpand()}
            >
              <Feather name="edit-2" size={14} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <View style={styles.containerExpanded}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editing Tags</Text>
              <TouchableOpacity onPress={saveTags}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {allTags.map((tag) => (
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
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={
                      (styles.tagText,
                        selectedTags.includes(tag) && styles.selectedTagText)
                    }
                  >
                    {getTagName(tag)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const specificColors = {
  primary: '#EDE8DA',
  secondary: '#9C8B77',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  selected: '#925EFF',
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  containerExpanded: {
    marginHorizontal: -12,
  },
  doneText: {
    color: specificColors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: specificColors.secondary,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: specificColors.primary,
    borderRadius: 12,
    padding: 12,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: specificColors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedTagText: {
    color: specificColors.white,
  },
  tag: {
    backgroundColor: specificColors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontWeight: '500',
  },
  tagsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default TagsList;
