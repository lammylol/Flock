import { useEffect, useMemo } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { PrayerPoint } from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { EntityType } from '@/types/PrayerSubtypes';
import PrayerPointLinking from '@/components/Prayer/PrayerViews/PrayerPointLinking';
import { EditMode } from '@/types/ComponentProps';
import { usePrayerPointHandler } from '@/hooks/prayerScreens/usePrayerPointHandler';
import { usePrayerLinking } from '@/hooks/prayerScreens/usePrayerLinking';
import useFormState from '@/hooks/useFormState';

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
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const { id, editMode } = processedParams;

  // All things are editable, but nothing is sent to firebase until the user clicks "Create" or "Update".
  // That is handled in handleSubmit.

  // This hook handles the prayer point creation and update logic
  // and manages the state of the prayer point being created or edited.
  const { formState, setIsLoading, setPrivacy } = useFormState({
    editMode: editMode,
  });

  const {
    updatedPrayerPoint,
    handlePrayerPointUpdate,
    createPrayerPoint,
    updatePrayerPoint,
    loadPrayerPoint,
    similarPrayers,
  } = usePrayerPointHandler({
    id: id,
    privacy: formState.privacy,
    editMode: editMode,
  });

  // setup editor state and load prayer point data
  useEffect(() => {
    if (formState.isEditMode) loadPrayerPoint();
  }, [loadPrayerPoint, formState.isEditMode]);

  // This hook handles separate logic for linking prayer points and topics.
  const { handlePrayerLinkingOnChange, linkAndSyncPrayerPoint } =
    usePrayerLinking(updatedPrayerPoint);

  const handleSubmit = async () => {
    setPrivacy('private');
    setIsLoading(true);

    try {
      const linkedPrayerPoint = await linkAndSyncPrayerPoint();
      if (linkedPrayerPoint) handlePrayerPointUpdate(linkedPrayerPoint);
      if (formState.isEditMode && updatedPrayerPoint.id) {
        await updatePrayerPoint();
      } else {
        await createPrayerPoint();
      }

      router.replace('/(tabs)/(prayers)');
      router.dismissAll();
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      Alert.alert('Something went wrong', 'Please try again.');
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
              onChange={handlePrayerLinkingOnChange}
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
