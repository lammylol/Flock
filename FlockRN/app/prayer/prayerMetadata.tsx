import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { prayerService } from '@/services/prayer/prayerService';
import { analyzePrayerContent } from '../../services/ai/openAIService';
import { auth } from '../../firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CreatePrayerDTO, PrayerTag } from '@/types/firebase';

const PRAYER_TAGS: PrayerTag[] = ['Family', 'Friends', 'Finances', 'Career', 'Health'];

export default function PrayerMetadataScreen() {
  const { content } = useLocalSearchParams<{ content: string }>();
  const [title, setTitle] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAIFill = async () => {
    if (!content) {
      Alert.alert('Error', 'No prayer content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzePrayerContent(content);
      setTitle(analysis.title);
      setSelectedTags(analysis.tags);
    } catch (error) {
      console.error('Error using AI fill:', error);
      Alert.alert('Error', 'Failed to analyze prayer. Please try again or fill manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTag = (tag: PrayerTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreatePrayer = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setIsLoading(true);
    try {
      const prayerData = {
        title: title.trim(),
        content: content,
        privacy: privacy,
        tags: selectedTags,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        status: 'Current' as const,
        isPinned: false,
      } as CreatePrayerDTO;

      await prayerService.createPrayer(prayerData);
      Alert.alert('Success', 'Prayer created successfully');
      router.push('/prayer');
    } catch (error) {
      console.error('Error creating prayer:', error);
      Alert.alert('Error', 'Failed to create prayer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <TextInput
          style={[styles.input, styles.titleInput]}
          placeholder="Prayer Title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TouchableOpacity
          style={[styles.aiButton, isAnalyzing && styles.aiButtonDisabled]}
          onPress={handleAIFill}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.aiButtonText}>AI Fill</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.previewContainer}>
        <ThemedText style={styles.label}>Prayer Content:</ThemedText>
        <ThemedText style={styles.previewText}>{content}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.tagsContainer}>
        <ThemedText style={styles.label}>Tags:</ThemedText>
        <ThemedView style={styles.tagButtons}>
          {PRAYER_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                selectedTags.includes(tag) && styles.tagButtonSelected,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <ThemedText
                style={[
                  styles.tagButtonText,
                  selectedTags.includes(tag) && styles.tagButtonTextSelected,
                ]}
              >
                {tag}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.pickerContainer}>
        <ThemedText style={styles.label}>Privacy:</ThemedText>
        <Picker
          selectedValue={privacy}
          onValueChange={(value: 'public' | 'private') => setPrivacy(value)}
          style={styles.picker}
        >
          <Picker.Item label="Private" value="private" />
          <Picker.Item label="Public" value="public" />
        </Picker>
      </ThemedView>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreatePrayer}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading ? 'Creating...' : 'Create Prayer'}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  titleInput: {
    flex: 1,
    marginBottom: 0,
  },
  aiButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  aiButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    padding: 12,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagButtonText: {
    fontSize: 14,
  },
  tagButtonTextSelected: {
    color: '#fff',
  },
});