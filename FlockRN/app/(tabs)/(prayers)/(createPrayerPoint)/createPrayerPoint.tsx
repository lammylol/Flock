import { useEffect, useState, useMemo, useRef } from 'react';
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
import { PrayerOrPrayerPointType } from '@/types/PrayerSubtypes';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

export default function PrayerPointMetadataScreen() {
  // Define the ref at the component level
  const processedParamsRef = useRef({
    id: '',
    mode: '',
  });

  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    title?: string;
    privacy?: string;
    tags?: string;
    mode?: string;
  }>();

  console.log("⭐ RECEIVED PARAMS:", JSON.stringify(params));

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const { userPrayerPoints, updateCollection } = usePrayerCollection();

  // Parse tags if they exist in params - using useMemo to prevent recreation on every render
  const initialTags = useMemo(() => {
    console.log("⭐ Processing tags param:", params.tags);
    return params.tags ? JSON.parse(params.tags) as PrayerType[] : [];
  }, [params.tags]);

  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private',
  );
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: params.id || '',
    title: params.title || '',
    content: params.content || '',
    type: 'request',
    tags: initialTags,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    status: 'open',
    privacy: (params?.privacy as 'public' | 'private') || 'private',
  });

  useEffect(() => {
    const setupEditMode = async () => {
      // Skip if we've already processed these exact params
      if (processedParamsRef.current.id === params.id &&
        processedParamsRef.current.mode === params.mode) {
        return;
      }

      console.log("⭐ Setting up edit mode check");
      console.log("⭐ Mode:", params.mode);
      console.log("⭐ ID:", params.id);

      // Update our tracking ref
      processedParamsRef.current = {
        id: params.id || '',
        mode: params.mode || '',
      };

      // Check if we're in edit mode from URL params
      if (params.mode === 'edit' && params.id) {
        console.log('⭐ Edit mode detected from URL params');
        setIsEditMode(true);

        // First, try to find the prayer point in context
        const contextPrayerPoint = userPrayerPoints.find(p => p.id === params.id);

        if (contextPrayerPoint) {
          console.log('⭐ Found prayer point in context:', JSON.stringify({
            id: contextPrayerPoint.id,
            title: contextPrayerPoint.title,
            content: contextPrayerPoint.content?.substring(0, 20) + '...'
          }));

          // Set initial data from context
          setUpdatedPrayerPoint({
            ...contextPrayerPoint,
            // Override with any params passed in URL if they exist
            title: params.title || contextPrayerPoint.title,
            content: params.content || contextPrayerPoint.content,
            tags: initialTags.length > 0 ? initialTags : (contextPrayerPoint.tags || []),
            privacy: (params.privacy as 'public' | 'private') || contextPrayerPoint.privacy || 'private',
          });
          setPrivacy((params.privacy as 'public' | 'private') || contextPrayerPoint.privacy || 'private');
        } else {
          console.log('⭐ Prayer point not found in context. Fetching from API...');

          try {
            const fetchedPrayer = await prayerService.getPrayerPoint(params.id);
            if (fetchedPrayer) {
              console.log('⭐ Fetched prayer from API');
              setUpdatedPrayerPoint({
                ...fetchedPrayer,
                // Override with any params passed in URL if they exist
                title: params.title || fetchedPrayer.title,
                content: params.content || fetchedPrayer.content,
                tags: initialTags.length > 0 ? initialTags : (fetchedPrayer.tags || []),
                privacy: (params.privacy as 'public' | 'private') || fetchedPrayer.privacy || 'private',
              });
              setPrivacy((params.privacy as 'public' | 'private') || fetchedPrayer.privacy || 'private');
            }
          } catch (error) {
            console.error('⭐ Error fetching prayer point:', error);
          }
        }
      } else {
        console.log('⭐ Create mode detected');
        setIsEditMode(false);
        // Initialize with URL params if they exist
        if (params.title || params.content || initialTags.length > 0 || params.privacy) {
          setUpdatedPrayerPoint(prev => ({
            ...prev,
            title: params.title || prev.title,
            content: params.content || prev.content,
            tags: initialTags.length > 0 ? initialTags : prev.tags,
            privacy: (params.privacy as 'public' | 'private') || prev.privacy,
          }));
          if (params.privacy) {
            setPrivacy(params.privacy as 'public' | 'private');
          }
        }
      }
    };

    setupEditMode();
  }, [params, userPrayerPoints, initialTags]);

  useEffect(() => {
    // This effect runs after isEditMode changes
    console.log("⭐ isEditMode updated:", isEditMode);
  }, [isEditMode]);

  const handlePrayerUpdate = (updatedPrayerPointData: PrayerPoint) => {
    console.log('⭐ Prayer update received:', JSON.stringify({
      title: updatedPrayerPointData.title,
      content: updatedPrayerPointData.content?.substring(0, 20) + '...',
      tags: updatedPrayerPointData.tags
    }));

    setUpdatedPrayerPoint((prevPrayerPoint) => ({
      ...prevPrayerPoint,
      ...updatedPrayerPointData,
      status: updatedPrayerPointData.status as PrayerPoint['status'], // Ensure status matches the expected type
    }));
  };

  const handleSubmit = async () => {
    if (!updatedPrayerPoint.title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && updatedPrayerPoint.id) {
        console.log("⭐ Submitting in EDIT mode");
        // Update existing prayer point
        const updateData: UpdatePrayerPointDTO = {
          title: updatedPrayerPoint.title.trim(),
          content: updatedPrayerPoint.content,
          privacy: privacy,
          tags: updatedPrayerPoint.tags,
        };

        await prayerService.editPrayerPoint(updatedPrayerPoint.id, updateData);

        // Update the prayer point in the collection context
        const updatedPrayerPointFinal = {
          ...updatedPrayerPoint,
          ...updateData,
          updatedAt: new Date(),
        };
        updateCollection(updatedPrayerPointFinal as PrayerPoint, 'prayerPoint');

        Alert.alert('Success', 'Prayer Point updated successfully');
      } else {
        console.log("⭐ Submitting in CREATE mode");
        // Create new prayer point
        const prayerPointData: CreatePrayerPointDTO = {
          title: updatedPrayerPoint.title.trim(),
          content: updatedPrayerPoint.content,
          privacy: updatedPrayerPoint.privacy ?? 'private',
          type: updatedPrayerPoint.type,
          tags: updatedPrayerPoint.tags,
          authorId: auth.currentUser.uid || 'unknown',
          authorName: auth.currentUser.displayName || 'unknown',
          status: 'open',
          recipientName: 'unknown',
          recipientId: 'unknown',
          createdAt: new Date(),
        };

        await prayerService.createPrayerPoint(prayerPointData);
        Alert.alert('Success', 'Prayer Point created successfully');
      }

      router.replace('/(tabs)/(prayers)');
      router.dismissAll(); // resets 'createPrayer' stack.
    } catch (error) {
      console.error(
        `⭐ Error ${isEditMode ? 'updating' : 'creating'} prayer:`,
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
          prayerOrPrayerPoint={PrayerOrPrayerPointType.PrayerPoint}
          prayerId={isEditMode ? updatedPrayerPoint.id : undefined}
          backgroundColor={colorScheme}
          onChange={(updatedPrayerPointData) => handlePrayerUpdate(updatedPrayerPointData)}
          initialTitle={updatedPrayerPoint.title}
          initialContent={updatedPrayerPoint.content}
          initialTags={updatedPrayerPoint.tags}
        />

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