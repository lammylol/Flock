// hooks/usePrayerPointHandler.ts
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';
import OpenAiService from '@/services/ai/openAIService';
import {
  CreatePrayerPointDTO,
  LinkedPrayerEntity,
  PartialLinkedPrayerEntity,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

export function usePrayerPointHandler(params: {
  id: string;
  editMode: EditMode;
}) {
  const openAiService = OpenAiService.getInstance();
  const { userPrayerPoints, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;

  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: params.id || '',
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

  const [similarPrayers, setSimilarPrayers] = useState<
    PartialLinkedPrayerEntity[]
  >([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');

  const handlePrayerPointUpdate = (data: Partial<PrayerPoint>) => {
    setUpdatedPrayerPoint((prev) => ({ ...prev, ...data }));
  };

  const loadPrayerPoint = useCallback(async () => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === params.id);
    if (contextPrayerPoint) {
      setUpdatedPrayerPoint({ ...contextPrayerPoint });
      return;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayerPoint(params.id);
      if (fetchedPrayer) {
        setUpdatedPrayerPoint({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [params.id, userPrayerPoints]);

  const setupEditMode = useCallback(() => {
    if (params.editMode === EditMode.EDIT && params.id) {
      setIsEditMode(true);
      loadPrayerPoint();
    } else {
      setIsEditMode(false);
    }
  }, [params.editMode, params.id, loadPrayerPoint]);

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

  const createPrayerPoint = async () => {
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
      linkedTopic: updatedPrayerPoint.linkedTopic || [],
    };

    await prayerService.createPrayerPoint(prayerPointData);
    Alert.alert('Success', 'Prayer Point created successfully.');
  };

  const updatePrayerPoint = async () => {
    const updateData: UpdatePrayerPointDTO = {
      title: updatedPrayerPoint.title.trim(),
      content: updatedPrayerPoint.content,
      privacy,
      tags: updatedPrayerPoint.tags,
      prayerType: updatedPrayerPoint.prayerType,
      status: updatedPrayerPoint.status,
      ...(updatedPrayerPoint.linkedTopic?.length
        ? { linkedPrayerPoints: updatedPrayerPoint.linkedTopic }
        : {}),
    };

    await prayerService.updatePrayerPoint(updatedPrayerPoint.id, updateData);

    updateCollection(
      { ...updatedPrayerPoint, ...updateData } as PrayerPoint,
      'prayerPoint',
    );

    Alert.alert('Success', 'Prayer Point updated successfully');
  };

  return {
    updatedPrayerPoint,
    setUpdatedPrayerPoint,
    handlePrayerPointUpdate,
    createPrayerPoint,
    updatePrayerPoint,
    setupEditMode,
    isEditMode,
    similarPrayers,
    setPrivacy,
    privacy,
    isLoading,
    setIsLoading,
  };
}
