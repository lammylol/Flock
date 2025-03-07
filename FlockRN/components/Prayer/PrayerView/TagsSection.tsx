import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { PrayerTag } from "@/types/firebase";

const allTags: PrayerTag[] = [
  "Current", "Family", "Health", "Praise", "Career", "Prayer Request", "Friends"
];

const TagsList = () => {
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>(["Current", "Family", "Health"]);
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
      <TouchableOpacity style={styles.tagsContainer} onPress={() => setModalVisible(true)}>
        {selectedTags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
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
                  style={[styles.tag, selectedTags.includes(item) && styles.selectedTag]}
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E5E5E5",
  },
  selectedTag: {
    backgroundColor: "#925EFF",
  },
  tagText: {
    fontWeight: "600",
  },
  editButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#9C8B77",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#EDE8DA",
    padding: 16,
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  doneText: {
    color: "#9C8B77",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TagsList;