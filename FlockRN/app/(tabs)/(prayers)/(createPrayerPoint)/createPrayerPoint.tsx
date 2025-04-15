import { useState } from 'react';
import {
  TouchableOpacity,
  Alert,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { CreatePrayerPointDTO, PrayerPoint } from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { PrayerOrPrayerPointType } from '@/types/PrayerSubtypes';
import OpenAiService from '@/services/ai/openAIService';

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
  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: '',
    title: '',
    content: '',
    type: 'request',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    status: 'open',
  });
  const openAiService = OpenAiService.getInstance();

  const handlePrayerPointUpdate = (updatedPrayerPointData: PrayerPoint) => {
    setUpdatedPrayerPoint((prevPrayerPoint) => ({
      ...prevPrayerPoint,
      ...updatedPrayerPointData,
      status: updatedPrayerPointData.status as PrayerPoint['status'], // Ensure status matches the expected type
    }));
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;

    if (!updatedPrayerPoint.title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your prayer.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Not Logged In', 'You must be logged in to create a prayer.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate vector embedding for semantic linkage
      const input =
        `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
      const embedding = await openAiService.getVectorEmbeddings(input);

      // 2. Construct prayer point data
      const prayerPointData: CreatePrayerPointDTO = {
        title: updatedPrayerPoint.title.trim(),
        content: updatedPrayerPoint.content.trim(),
        privacy: updatedPrayerPoint.privacy ?? 'private',
        type: updatedPrayerPoint.type,
        tags: updatedPrayerPoint.tags,
        authorId: user.uid,
        authorName: user.displayName || 'unknown',
        status: 'open',
        recipientName: 'unknown',
        recipientId: 'unknown',
        createdAt: new Date(),
        embedding,
      };

      // 3. Save prayer point to backend
      await prayerService.createPrayerPoint(prayerPointData);

      Alert.alert('Success', 'Prayer Point created successfully.');
      router.replace('/(tabs)/(prayers)');
      router.dismissAll(); // Resets navigation stack
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} prayer:`,
        error,
      );
      Alert.alert(
        'Something went wrong',
        `Failed to ${isEditMode ? 'update' : 'create'} prayer. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedKeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust if needed
    >
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderButton onPress={router.back} label="Cancel" />
          ),
          title: 'Add Prayer Point',
          headerTitleStyle: styles.headerTitleStyle,
        }}
      />
      <ThemedScrollView contentContainerStyle={styles.scrollContent}>
        <PrayerContent
          editMode={'create'}
          prayerOrPrayerPoint={PrayerOrPrayerPointType.PrayerPoint}
          backgroundColor={colorScheme}
          onChange={(updatedPrayerData) => {
            if ('type' in updatedPrayerData) {
              handlePrayerPointUpdate(updatedPrayerData);
            }
          }}
        />

        <View style={styles.section}>
          <View style={styles.privacySelector}>
            <ThemedText style={styles.label}>Privacy</ThemedText>
            <View style={styles.privacyValueContainer}>
              <ThemedText style={styles.privacyValue}>
                {privacy === 'private' ? 'Private' : 'Public'}
              </ThemedText>
              {/* {privacy === 'private' && (
                <ThemedText style={styles.lockIcon}>🔒</ThemedText>
              )} */}
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
    </ThemedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    bottom: 20,
    justifyContent: 'center',
    left: 0,
    paddingVertical: 16,
    position: 'absolute',
    right: 0,
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
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '500',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  privacySelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyValue: {
    color: Colors.link,
    fontSize: 18,
    fontWeight: '400',
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
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.grey1,
    borderRadius: 12,
    padding: 16,
  },
});
