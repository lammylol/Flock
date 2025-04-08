import { useState } from 'react';
import { TouchableOpacity, Alert, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { CreatePrayerPointDTO, Prayer, PrayerPoint } from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function PrayerPointMetadataScreen() {
  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    title?: string;
    privacy?: string;
    tags?: string;
    mode?: string;
  }>();

  // Determine if we're in edit mode
  const isEditMode = params.mode === 'edit';

  // TODO implement privacy setting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [privacy, _setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private',
  );
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const [updatedPrayer, setUpdatedPrayer] = useState<PrayerPoint>({
    id: '',
    title: '',
    content: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
  });

  const handlePrayerUpdate = (updatedPrayerData: Prayer | PrayerPoint) => {
    setUpdatedPrayer((prevPrayer) => ({
      ...prevPrayer,
      ...updatedPrayerData,
      status: updatedPrayerData.status as PrayerPoint['status'], // Ensure status matches the expected type
    }));
  };

  const handleSubmit = async () => {
    if (!updatedPrayer.title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setIsLoading(true);
    try {
      // Create new prayer point
      const prayerData: CreatePrayerPointDTO = {
        title: updatedPrayer.title.trim(),
        content: updatedPrayer.content,
        privacy: updatedPrayer.privacy ?? 'private',
        tags: updatedPrayer.tags,
        authorId: auth.currentUser.uid || 'unknown',
        authorName: auth.currentUser.displayName || 'unknown',
        status: 'open',
        recipientName: 'unknown',
        recipientId: 'unknown',
        createdAt: new Date(),
      };

      await prayerService.createPrayerPoint(prayerData);

      Alert.alert('Success', 'Prayer Point created successfully');
      router.replace('/(tabs)/(prayers)');
      router.dismissAll(); // resets 'createPrayer' stack.
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} prayer:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'create'} prayer. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedScrollView contentContainerStyle={styles.scrollContent}>
      <PrayerContent
        editMode={'create'}
        prayerOrPrayerPoint={'prayerPoint'}
        backgroundColor={colorScheme}
        onChange={(updatedPrayerData) => handlePrayerUpdate(updatedPrayerData)}
      ></PrayerContent>

      <View style={styles.section}>
        <View style={styles.privacySelector}>
          <ThemedText style={styles.label}>Privacy</ThemedText>
          <View style={styles.privacyValueContainer}>
            <ThemedText style={styles.privacyValue}>
              {privacy === 'private' ? 'Private' : 'Public'}
            </ThemedText>
            {privacy === 'private' && (
              <ThemedText style={styles.lockIcon}>🔒</ThemedText>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Prayer'
              : 'Create Prayer'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    bottom: 20,
    justifyContent: 'center',
    left: 20,
    paddingVertical: 16,
    position: 'absolute',
    right: 20,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  lockIcon: {
    fontSize: 16,
  },
  privacySelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyValue: {
    fontSize: 16,
    marginRight: 4,
  },
  privacyValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scrollContent: {
    backgroundColor: Colors.light.background,
    flexGrow: 1,
    gap: 10,
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
});
