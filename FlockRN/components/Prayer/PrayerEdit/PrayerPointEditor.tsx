import { useEffect } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { FlatPrayerTopicDTO, PrayerPoint } from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { EntityType } from '@/types/PrayerSubtypes';
import PrayerPointLinking from '@/components/Prayer/PrayerViews/PrayerPointLinking';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import { usePrayerPointHandler } from '@/hooks/prayerScreens/usePrayerPointHandler';
import { usePrayerLinking } from '@/hooks/prayerScreens/usePrayerLinking';
import useFormState from '@/hooks/useFormState';
import { submitOperationsService } from '@/services/prayer/submitOperationsService';
import { useSimilarPrayers } from '@/hooks/prayerScreens/useSimilarPrayers';
import { auth } from '@/firebase/firebaseConfig';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

interface PrayerPointEditorProps {
  editMode: EditMode;
  id?: string;
  shouldPersist: boolean;
  initialContent?: Partial<PrayerPoint>;
  onSubmitLocal?: (
    prayerPoint: PrayerPoint,
    linkedPair: LinkedPrayerPointPair,
  ) => void;
}

export default function PrayerPointEditor(props: PrayerPointEditorProps) {
  const { editMode, id, shouldPersist, initialContent, onSubmitLocal } = props;
  const { updateCollection } = usePrayerCollection();

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated');
  }

  // State for edit mode
  const colorScheme = useThemeColor({}, 'backgroundSecondary');

  // All things are editable, but nothing is sent to firebase until the user clicks "Create" or "Update".
  // That is handled in handleSubmit.

  // This hook handles the prayer point creation and update logic
  // and manages the state of the prayer point being created or edited.
  const {
    formState,
    isSubmissionLoading,
    setIsDataLoading,
    setIsSubmissionLoading,
    setPrivacy,
  } = useFormState({
    editMode: editMode,
  });

  const {
    updatedPrayerPoint,
    handlePrayerPointUpdate,
    loadPrayerPoint,
    loadPrayerPointFromPassingContent,
  } = usePrayerPointHandler({
    id: id,
    privacy: formState.privacy,
  });

  const { similarPrayers, embedding } = useSimilarPrayers(
    updatedPrayerPoint,
    editMode,
  );

  // setup editor state and load prayer point data
  useEffect(() => {
    const setup = async () => {
      setIsDataLoading(true);
      if (initialContent) {
        loadPrayerPointFromPassingContent(initialContent);
      } else {
        loadPrayerPoint();
      }
      setIsDataLoading(false);
    };
    if (formState.isEditMode) setup();
  }, [
    loadPrayerPoint,
    formState.isEditMode,
    setIsDataLoading,
    loadPrayerPointFromPassingContent,
    initialContent,
  ]);

  // This hook handles separate logic for linking prayer points and topics.
  const { handlePrayerLinkingOnChange, originPrayer, prayerTopicDTO } =
    usePrayerLinking(updatedPrayerPoint);

  // const handlePrayerLinkingOnChangeAndPassTitle = (
  //   selectedPrayer: LinkedPrayerEntity,
  //   title?: string,
  // ) => {
  //   handlePrayerLinkingOnChange(selectedPrayer, title);
  //   onSubmitLocal?.(updatedPrayerPoint, {
  //     prayerPoint: updatedPrayerPoint,
  //     prayerPointEmbedding: embedding,
  //     originPrayer: selectedPrayer,
  //     topicTitle: title,
  //   } as LinkedPrayerPointPair);
  // };

  const handleSubmit = async () => {
    setPrivacy('private');
    setIsSubmissionLoading(true);
    if (!shouldPersist) {
      const linkedPair = {
        prayerPoint: updatedPrayerPoint,
        prayerPointEmbedding: embedding,
        originPrayer: originPrayer as PrayerPoint | null,
        topicTitle: prayerTopicDTO?.title ?? originPrayer?.title,
      };
      onSubmitLocal?.(updatedPrayerPoint, linkedPair as LinkedPrayerPointPair);
      setIsSubmissionLoading(false);
      return;
    }

    try {
      const newPrayerPoint =
        await submitOperationsService.submitPrayerPointWithEmbeddingsAndLinking(
          {
            formState,
            prayerPoint: updatedPrayerPoint,
            originPrayer: originPrayer as PrayerPoint | undefined,
            prayerTopicDTO: prayerTopicDTO as FlatPrayerTopicDTO | undefined,
            user,
            embedding,
          },
        );

      updateCollection(
        { ...updatedPrayerPoint, ...newPrayerPoint } as PrayerPoint,
        'prayerPoint',
      );
      Alert.alert('Success', 'Prayer point submitted successfully!');
      router.replace('/(tabs)/(prayers)');
      router.dismissAll();
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsSubmissionLoading(false);
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
          title: formState.isEditMode
            ? 'Edit Prayer Point'
            : 'Add Prayer Point',
          headerTitleStyle: styles.headerTitleStyle,
        }}
      />
      <ThemedScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.upperContainer}>
          <PrayerContent
            editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
            prayerOrPrayerPoint={EntityType.PrayerPoint}
            backgroundColor={colorScheme}
            onChange={(updatedPrayerPointData) => {
              handlePrayerPointUpdate(updatedPrayerPointData as PrayerPoint);
            }}
            prayer={updatedPrayerPoint}
          />

          {(similarPrayers.length > 0 || updatedPrayerPoint.linkedTopics) && (
            <PrayerPointLinking
              editMode={EditMode.CREATE}
              similarPrayers={similarPrayers}
              prayerPoint={updatedPrayerPoint}
              onChange={handlePrayerLinkingOnChange}
            />
          )}

          <View style={styles.section}>
            <View style={styles.privacySelector}>
              <ThemedText style={styles.label}>Privacy</ThemedText>
              <View style={styles.privacyValueContainer}>
                <ThemedText style={styles.privacyValue}>
                  {formState.privacy === 'private' ? 'Private' : 'Public'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmissionLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmissionLoading}
        >
          <ThemedText style={styles.buttonText}>
            {isSubmissionLoading
              ? `${formState.isEditMode ? 'Updating' : 'Creating'}...`
              : `${formState.isEditMode ? 'Update' : 'Create'} Prayer Point`}
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
