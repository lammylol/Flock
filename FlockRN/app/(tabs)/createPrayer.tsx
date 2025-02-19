import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { prayerService } from '../../services/prayer/prayerServices';
import { auth } from '../../firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CreatePrayerDTO } from '@/types/firebase';

export default function CreatePrayerScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePrayer = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
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
        content: content.trim(),
        privacy: privacy,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser!.displayName,
        status: 'Current' as const,
        isPinned: false,
      } as CreatePrayerDTO;

      await prayerService.createPrayer(prayerData);
      Alert.alert('Success', 'Prayer created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating prayer:', error);
      Alert.alert('Error', 'Failed to create prayer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Prayer Title"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Prayer Content"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <ThemedView style={styles.pickerContainer}>
        <ThemedText style={styles.label}>Privacy:</ThemedText>
        <Picker
          selectedValue={privacy}
          onValueChange={(value) => setPrivacy(value)}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  contentInput: {
    height: 150,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
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
});
