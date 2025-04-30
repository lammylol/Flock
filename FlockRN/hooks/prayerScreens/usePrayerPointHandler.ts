// hooks/usePrayerPointHandler.ts
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';
import OpenAiService from '@/services/ai/openAIService';
import {
  CreatePrayerPointDTO,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

export function usePrayerPointHandler(processedParams: {
  id: string;
  editMode: EditMode;
}) {
  const openAiService = OpenAiService.getInstance();
  const { userPrayerPoints, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;

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
    privacy: 'private',
    recipientName: 'unknown',
    recipientId: 'unknown',
    prayerId: '',
    entityType: EntityType.PrayerPoint,
  });

  const [similarPrayers, setSimilarPrayers] = useState<Partial<PrayerPoint>[]>(
    [],
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const { id, editMode } = processedParams;

  const handlePrayerPointUpdate = (data: Partial<PrayerPoint>) => {
    setUpdatedPrayerPoint((prev) => ({ ...prev, ...data }));
  };

  const loadPrayerPoint = useCallback(async () => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === id);
    if (contextPrayerPoint) {
      setUpdatedPrayerPoint({ ...contextPrayerPoint });
      return;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayerPoint(
        processedParams.id,
      );
      if (fetchedPrayer) {
        setUpdatedPrayerPoint({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [id, processedParams.id, userPrayerPoints]);

  const setupEditMode = useCallback(() => {
    if (editMode === EditMode.EDIT && id) {
      setIsEditMode(true);
      loadPrayerPoint();
    } else {
      setIsEditMode(false);
    }
  }, [editMode, id, loadPrayerPoint]);

  const handleFindSimilarPrayers = useCallback(async () => {
    const input =
      `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
    const embedding = await openAiService.getVectorEmbeddings(input);
    if (!user?.uid) return;

    try {
      const sourcePrayerId = isEditMode ? updatedPrayerPoint.id : undefined;
      const similar = await prayerService.findRelatedPrayers(
        embedding,
        user.uid,
        sourcePrayerId,
      );
      setSimilarPrayers(similar);
    } catch (error) {
      console.error('Error finding similar prayers:', error);
    }
  }, [
    updatedPrayerPoint.title,
    updatedPrayerPoint.content,
    updatedPrayerPoint.id,
    isEditMode,
    openAiService,
    user?.uid,
  ]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (
        updatedPrayerPoint.title.trim() ||
        updatedPrayerPoint.content.trim()
      ) {
        handleFindSimilarPrayers();
      }
    }, 1000);
    return () => clearTimeout(debounce);
  }, [
    updatedPrayerPoint.title,
    updatedPrayerPoint.content,
    handleFindSimilarPrayers,
  ]);

  const handleCreatePrayerPoint = async () => {
    let embeddingInput = (updatedPrayerPoint.embedding as number[]) || [];

    if (embeddingInput.length === 0) {
      const input =
        `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
      embeddingInput = await openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) return;

    const prayerPointData: CreatePrayerPointDTO = {
      title: updatedPrayerPoint.title.trim(),
      content: updatedPrayerPoint.content.trim(),
      privacy,
      prayerType: updatedPrayerPoint.prayerType,
      tags: updatedPrayerPoint.tags,
      authorId: user.uid,
      authorName: user.displayName || 'unknown',
      status: 'open',
      recipientName: 'unknown',
      recipientId: 'unknown',
      embedding: embeddingInput,
    };

    await prayerService.createPrayerPoint(prayerPointData);
    Alert.alert('Success', 'Prayer Point created successfully.');
  };

  const handleSubmit = async () => {
    if (!updatedPrayerPoint.title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for your prayer.');
      return;
    }

    setPrivacy('private');
    setIsLoading(true);

    try {
      if (isEditMode && updatedPrayerPoint.id) {
        const updateData: UpdatePrayerPointDTO = {
          title: updatedPrayerPoint.title.trim(),
          content: updatedPrayerPoint.content,
          privacy,
          tags: updatedPrayerPoint.tags,
          prayerType: updatedPrayerPoint.prayerType,
          status: updatedPrayerPoint.status,
        };

        await prayerService.updatePrayerPoint(
          updatedPrayerPoint.id,
          updateData,
        );

        updateCollection(
          { ...updatedPrayerPoint, ...updateData } as PrayerPoint,
          'prayerPoint',
        );

        Alert.alert('Success', 'Prayer Point updated successfully');
      } else {
        await handleCreatePrayerPoint();
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

  return {
    updatedPrayerPoint,
    handlePrayerPointUpdate,
    handleSubmit,
    setupEditMode,
    isEditMode,
    similarPrayers,
    setPrivacy,
    privacy,
    isLoading,
  };
}
