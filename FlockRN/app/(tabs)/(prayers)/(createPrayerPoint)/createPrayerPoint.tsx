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
  const { userPrayerPoints, updateCollection } = usePrayerCollection();

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
  
  useEffect(() => {
    const setupEditMode = async () => {
      // Check if we're in edit mode from URL params
      if (params.mode === 'edit' && params.id) {
        console.log('Edit mode detected from URL params');
        setIsEditMode(true);
        
        // First, try to find the prayer point in context
        const contextPrayerPoint = userPrayerPoints.find(p => p.id === params.id);
        
        if (contextPrayerPoint) {
          console.log('Found prayer point in context:', JSON.stringify({
            id: contextPrayerPoint.id,
            title: contextPrayerPoint.title,
            content: contextPrayerPoint.content?.substring(0, 20) + '...'
          }));
          
          // Set initial data from context
          setUpdatedPrayer({
            ...contextPrayerPoint,
            // Override with any params passed in URL if they exist
            title: params.title || contextPrayerPoint.title,
            content: params.content || contextPrayerPoint.content,
            tags: initialTags.length > 0 ? initialTags : (contextPrayerPoint.tags || []),
            privacy: (params.privacy as 'public' | 'private') || contextPrayerPoint.privacy || 'private',
          });
          setPrivacy((params.privacy as 'public' | 'private') || contextPrayerPoint.privacy || 'private');
        } else {
          console.log('Prayer point not found in context. Fetching from API...');
          
          try {
            const fetchedPrayer = await prayerService.getPrayerPoint(params.id);
            if (fetchedPrayer) {
              console.log('Fetched prayer from API');
              setUpdatedPrayer({
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
            console.error('Error fetching prayer point:', error);
          }
        }
      } else {
        console.log('Create mode detected');
        // Initialize with URL params if they exist
        if (params.title || params.content || initialTags.length > 0 || params.privacy) {
          setUpdatedPrayer(prev => ({
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
  }, [params, userPrayerPoints]);

  const handlePrayerUpdate = (updatedPrayerData: Prayer | PrayerPoint) => {
    console.log('Prayer update received:', JSON.stringify({
      title: updatedPrayerData.title,
      content: updatedPrayerData.content?.substring(0, 20) + '...',
      tags: updatedPrayerData.tags
    }));
    
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
          onChange={(updatedPrayerData) => handlePrayerUpdate(updatedPrayerData)}
          initialTitle={updatedPrayer.title}
          initialContent={updatedPrayer.content}
          initialTags={updatedPrayer.tags}
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