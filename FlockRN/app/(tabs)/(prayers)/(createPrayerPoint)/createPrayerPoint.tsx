import { useEffect, useState } from 'react';
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
import { CreatePrayerPointDTO, Prayer, PrayerPoint, PrayerType, UpdatePrayerPointDTO } from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrayerPointMetadataScreen() {
  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    title?: string;
    privacy?: string;
    tags?: string;
    mode?: string;
  }>();

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const { updateCollection } = usePrayerCollection();

  // Parse tags if they exist in params
  const initialTags = params.tags ? JSON.parse(params.tags) as PrayerType[] : [];

  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private',
  );
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const [updatedPrayer, setUpdatedPrayer] = useState<PrayerPoint>({
    id: params.id || '',
    title: params.title || '',
    content: params.content || '',
    tags: initialTags,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    privacy: (params?.privacy as 'public' | 'private') || 'private',
  });

  // Load prayer point data from AsyncStorage if in edit mode
  useEffect(() => {
    const loadEditData = async () => {
      try {
        // Try to get edit data from AsyncStorage
        const storedData = await AsyncStorage.getItem('editPrayerPoint');
        
        if (storedData) {
          const editData = JSON.parse(storedData);
          
          // Set edit mode based on stored data
          const isEdit = editData.mode === 'edit';
          setIsEditMode(isEdit);
          
          if (isEdit && editData.id) {
            try {
              // Initialize form with stored data first
              setUpdatedPrayer({
                id: editData.id,
                title: editData.title || '',
                content: editData.content || '',
                tags: editData.tags || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                authorName: '',
                authorId: '',
                privacy: editData.privacy || 'private',
              });
              setPrivacy(editData.privacy || 'private');
              
              // Also fetch the complete data from the API
              const prayerPoint = await prayerService.getPrayerPoint(editData.id);
              
              if (prayerPoint) {
                setUpdatedPrayer(prevPrayer => ({
                  ...prayerPoint,
                  // Preserve any user edits that may have happened
                  title: prevPrayer.title || prayerPoint.title,
                  content: prevPrayer.content || prayerPoint.content,
                  tags: prevPrayer.tags.length > 0 ? prevPrayer.tags : (prayerPoint.tags || []),
                }));
              }
              
              // Clear the stored data after loading
              await AsyncStorage.removeItem('editPrayerPoint');
            } catch (error) {
              console.error('Error loading prayer point for editing:', error);
              Alert.alert('Error', 'Failed to load prayer point data.');
            }
          }
        }
      } catch (error) {
        console.error('Error retrieving stored prayer point data:', error);
      }
    };

    loadEditData();
  }, []);

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
      if (isEditMode && updatedPrayer.id) {
        // Update existing prayer point
        const updateData: UpdatePrayerPointDTO = {
          title: updatedPrayer.title.trim(),
          content: updatedPrayer.content,
          privacy: privacy,
          tags: updatedPrayer.tags,
        };

        await prayerService.editPrayerPoint(updatedPrayer.id, updateData);
        
        // Update the prayer point in the collection context
        const updatedPrayerPoint = {
          ...updatedPrayer,
          ...updateData,
          updatedAt: new Date(),
        };
        updateCollection(updatedPrayerPoint as PrayerPoint, 'prayerPoint');

        Alert.alert('Success', 'Prayer Point updated successfully');
      } else {
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
      }

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
        <PrayerContent
          editMode={isEditMode ? 'edit' : 'create'}
          prayerOrPrayerPoint={'prayerPoint'}
          prayerId={isEditMode ? updatedPrayer.id : undefined}
          backgroundColor={colorScheme}
          onChange={(updatedPrayerData) =>
            handlePrayerUpdate(updatedPrayerData)
          }
        ></PrayerContent>

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
  lockIcon: {
    fontSize: 16,
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