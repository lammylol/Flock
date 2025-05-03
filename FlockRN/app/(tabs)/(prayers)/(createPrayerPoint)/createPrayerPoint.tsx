import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import {
  CreatePrayerPointDTO,
  PrayerPoint,
  PrayerTopic,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import PrayerPointLinking from '@/components/Prayer/PrayerViews/PrayerPointLinking';
import OpenAiService from '@/services/ai/openAIService';
import { EditMode } from '@/types/ComponentProps';

export default function PrayerPointMetadataScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    editMode?: EditMode;
  }>();

  const processedParams = useMemo(() => {
    return {
      id: params.id ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
    };
  }, [params.editMode, params.id]);

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const { userPrayerPoints, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;
  const openAiService = OpenAiService.getInstance();
  const [similarPrayers, setSimilarPrayers] = useState<
    (Partial<PrayerPoint> | Partial<PrayerTopic>)[]
  >([]);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: processedParams.id || '',
    title: '',
    content: '',
    prayerType: PrayerType.Request,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    status: 'open',
    isOrigin: true,
    privacy: 'private',
    recipientName: 'unknown',
    recipientId: 'unknown',
    prayerId: '',
    entityType: EntityType.PrayerPoint,
  });

  const loadPrayerPoint = useCallback(async () => {
    // First, try to find the prayer point in context
    const contextPrayerPoint = userPrayerPoints.find(
      (p) => p.id === processedParams.id,
    );

    if (contextPrayerPoint) {
      console.log('Found prayer point in context: ', contextPrayerPoint.id);

      // Set initial data from context
      setUpdatedPrayerPoint({
        ...contextPrayerPoint,
      });
      return;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayerPoint(
        processedParams.id,
      );
      if (fetchedPrayer) {
        console.log('Fetched prayer from API');
        setUpdatedPrayerPoint({
          ...fetchedPrayer,
        });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [processedParams.id, userPrayerPoints]);

  const setupEditMode = useCallback(async () => {
    // Check if we're in edit mode from URL params
    if (processedParams.editMode === EditMode.EDIT && processedParams.id) {
      setIsEditMode(true);
      loadPrayerPoint();
    } else {
      console.log('⭐ Create mode detected');
      setIsEditMode(false);
    }
  }, [loadPrayerPoint, processedParams.editMode, processedParams.id]);

  const handlePrayerPointUpdate = (updatedPrayerPointData: PrayerPoint) => {
    setUpdatedPrayerPoint((prevPrayerPoint) => ({
      ...prevPrayerPoint,
      ...updatedPrayerPointData,
      status: updatedPrayerPointData.status as PrayerPoint['status'], // Ensure status matches the expected type
    }));
  };

  const handleFindSimilarPrayers = useCallback(async () => {
    const input =
      `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
    const embedding = await openAiService.getVectorEmbeddings(input);

    if (!user?.uid) {
      return;
    }

    try {
      const sourcePrayerId = isEditMode ? updatedPrayerPoint.id : undefined;

      const similarPrayers = await prayerService.findRelatedPrayers(
        embedding,
        user?.uid,
        sourcePrayerId,
      );
      setSimilarPrayers(similarPrayers);
    } catch (error) {
      console.error('Error finding similar prayers:', error);
    }
  }, [
    updatedPrayerPoint.title,
    updatedPrayerPoint.content,
    updatedPrayerPoint.id,
    openAiService,
    user.uid,
    isEditMode,
  ]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (
        updatedPrayerPoint.title.trim() ||
        updatedPrayerPoint.content.trim()
      ) {
        handleFindSimilarPrayers();
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [
    updatedPrayerPoint.title,
    updatedPrayerPoint.content,
    handleFindSimilarPrayers,
  ]);

  const handleSubmit = async () => {
    if (!updatedPrayerPoint.title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your prayer.');
      return;
    }

    setPrivacy('private');
    setIsLoading(true);

    try {
      if (isEditMode && updatedPrayerPoint.id) {
        console.log('⭐ Submitting in EDIT mode');
        // Update existing prayer point
        const updateData: UpdatePrayerPointDTO = {
          title: updatedPrayerPoint.title.trim(),
          content: updatedPrayerPoint.content,
          privacy: privacy,
          tags: updatedPrayerPoint.tags,
          prayerType: updatedPrayerPoint.prayerType,
          updatedAt: new Date(),
          status: updatedPrayerPoint.status,
        };

        await prayerService.updatePrayerPoint(
          updatedPrayerPoint.id,
          updateData,
        );

        // Update the prayer point in the collection context
        const updatedPrayerPointFinal = {
          ...updatedPrayerPoint,
          ...updateData,
          updatedAt: new Date(),
        };
        updateCollection(updatedPrayerPointFinal as PrayerPoint, 'prayerPoint');

        Alert.alert('Success', 'Prayer Point updated successfully');
      } else {
        console.log('⭐ Submitting in CREATE mode');
        let embeddingInput = updatedPrayerPoint.embedding || [];
        if (embeddingInput.length === 0) {
          // If no similar prayer points, generate a new embedding
          const input =
            `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
          embeddingInput = await openAiService.getVectorEmbeddings(input);
        }

        if (!user?.uid) {
          return;
        }

        // 2. Construct prayer point data
        const prayerPointData: CreatePrayerPointDTO = {
          title: updatedPrayerPoint.title.trim(),
          content: updatedPrayerPoint.content.trim(),
          privacy: updatedPrayerPoint.privacy ?? 'private',
          prayerType: updatedPrayerPoint.prayerType,
          tags: updatedPrayerPoint.tags,
          authorId: user.uid,
          authorName: user.displayName || 'unknown',
          status: 'open',
          recipientName: 'unknown',
          recipientId: 'unknown',
          createdAt: new Date(),
          isOrigin: true,
          ...(embeddingInput?.length ? { embedding: embeddingInput } : {}), // Only include if it exists
        };

        // 3. Save prayer point to backend
        await prayerService.createPrayerPoint(prayerPointData);
        Alert.alert('Success', 'Prayer Point created successfully.');
      }

      router.replace('/(tabs)/(prayers)');
      router.dismissAll(); // Resets navigation stack
    } catch (error) {
      console.error(
        `⭐ Error ${isEditMode ? 'updating' : 'creating'} prayer:`,
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

  useMemo(() => {
    setupEditMode();
  }, [setupEditMode]);

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
          title: isEditMode ? 'Edit Prayer Point' : 'Add Prayer Point',
          headerTitleStyle: styles.headerTitleStyle,
        }}
      />
      <ThemedScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.upperContainer}>
          <PrayerContent
            editMode={isEditMode ? EditMode.EDIT : EditMode.CREATE}
            prayerOrPrayerPoint={EntityType.PrayerPoint}
            backgroundColor={colorScheme}
            onChange={(updatedPrayerPointData) => {
              handlePrayerPointUpdate(updatedPrayerPointData as PrayerPoint);
            }}
            prayer={updatedPrayerPoint}
          />

          {similarPrayers.length > 0 && (
            <PrayerPointLinking
              editMode={EditMode.CREATE}
              similarPrayers={similarPrayers}
              prayerPoint={updatedPrayerPoint}
            />
          )}

          <View style={styles.section}>
            <View style={styles.privacySelector}>
              <ThemedText style={styles.label}>Privacy</ThemedText>
              <View style={styles.privacyValueContainer}>
                <ThemedText style={styles.privacyValue}>
                  {privacy === 'private' ? 'Private' : 'Public'}
                </ThemedText>
              </View>
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
                ? 'Update Prayer Point'
                : 'Create Prayer Point'}
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
    left: 0,
    paddingVertical: 16,
    right: 0,
    marginBottom: 20,
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
  },
  section: {
    backgroundColor: Colors.grey1,
    borderRadius: 12,
    padding: 16,
  },
  upperContainer: {
    flexGrow: 1,
    gap: 10,
  },
});
