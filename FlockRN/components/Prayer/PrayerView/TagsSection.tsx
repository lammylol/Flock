import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrayerTag } from '@/types/firebase';

const allTags: PrayerTag[] = [
  'Current',
  'Family',
  'Health',
  'Praise',
  'Career',
  'Prayer Request',
  'Friends',
];

const TagsList = () => {
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>([
    'Current',
    'Family',
    'Health',
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleTag = (tag: PrayerTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags:</Text>
      <TouchableOpacity
        style={styles.tagsContainer}
        onPress={() => setModalVisible(true)}
      >
        {selectedTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <Feather name="edit-2" size={14} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editing Tags</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={allTags}
              keyExtractor={(item) => item}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tag,
                    selectedTags.includes(item) && styles.selectedTag,
                  ]}
                  onPress={() => toggleTag(item)}
                >
                  <Text style={styles.tagText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  doneText: {
    color: '#9C8B77',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#9C8B77',
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
    backgroundColor: '#EDE8DA',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedTag: {
    backgroundColor: '#925EFF',
  },
  tag: {
    backgroundColor: '#E5E5E5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontWeight: '600',
  },
  tagsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default TagsList;
