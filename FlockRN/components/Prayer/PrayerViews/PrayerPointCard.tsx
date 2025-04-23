import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { EmojiIconBackground } from '@/components/ui/EmojiIconBackground';
import { Entypo } from '@expo/vector-icons';
import { prayerTagDisplayNames, prayerTags } from '@/types/Tag';
import { PrayerPoint } from '@/types/firebase';

interface EditablePrayerPointProps {
  prayerPoint: PrayerPoint;
  isEditMode: boolean;
  onDelete?: () => void;
  onChange?: (updated: PrayerPoint) => void;
}

const EditablePrayerPointCard: React.FC<EditablePrayerPointProps> = ({
  prayerPoint,
  isEditMode,
  onDelete,
  onChange,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const [editableTitle, setEditableTitle] = useState(prayerPoint.title);
  const [editableContent, setEditableContent] = useState(prayerPoint.content);
  const [editableType, setEditableType] = useState(prayerPoint.type);

  useEffect(() => {
    if (onChange) {
      onChange({
        ...prayerPoint,
        title: editableTitle,
        content: editableContent,
        type: editableType,
      });
    }
  }, [editableTitle, editableContent, editableType]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.headerContainer}>
        <EmojiIconBackground type={editableType} />
        <View style={styles.titleContainer}>
          {isEditMode ? (
            <TextInput
              value={editableTitle}
              onChangeText={setEditableTitle}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors[colorScheme].textSecondary}
            />
          ) : (
            <ThemedText style={styles.titleText}>{editableTitle}</ThemedText>
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
                        tag === editableType
                          ? Colors.tagColors.typeColors[tag]
                          : Colors.tagColors.defaultTag,
                    },
                  ]}
                  onPress={() => setEditableType(tag)}
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
              {(prayerTagDisplayNames[editableType]?.charAt(0).toUpperCase() ??
                '') + (prayerTagDisplayNames[editableType]?.slice(1) ?? '')}
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
          value={editableContent}
          onChangeText={setEditableContent}
          style={styles.contentInput}
          placeholder="Write your prayer..."
          placeholderTextColor={Colors[colorScheme].textSecondary}
          multiline
        />
      ) : (
        <ThemedText style={styles.contentText}>{editableContent}</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 10,
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
