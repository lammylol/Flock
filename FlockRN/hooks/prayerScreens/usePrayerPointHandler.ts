// hooks/usePrayerPointHandler.ts
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';
import OpenAiService from '@/services/ai/openAIService';
import {
  CreatePrayerPointDTO,
  PartialLinkedPrayerEntity,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import { EntityType, PrayerType, Privacy } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { deleteField } from 'firebase/firestore';
import { prayerPointService } from '@/services/prayer/prayerPointService';

export interface UsePrayerPointHandlerProps {
  id: string;
  privacy?: Privacy;
  editMode: EditMode;
}
export function usePrayerPointHandler({
  id,
  privacy = 'private',
  editMode,
}: UsePrayerPointHandlerProps) {
  const openAiService = OpenAiService.getInstance();
  const { userPrayerPoints, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;

  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: id || '',
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

  const handlePrayerPointUpdate = (data: Partial<PrayerPoint>) => {
    const newUpdated = { ...updatedPrayerPoint, ...data };
    setUpdatedPrayerPoint(newUpdated);
  };

  const loadPrayerPoint = useCallback(async () => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === id);
    if (contextPrayerPoint) {
      setUpdatedPrayerPoint({ ...contextPrayerPoint });
      return;
    }
    try {
      const fetchedPrayer = await prayerPointService.getPrayerPoint(id);
      if (fetchedPrayer) {
        setUpdatedPrayerPoint({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [id, userPrayerPoints]);

  const handleFindSimilarPrayers = useCallback(async () => {
    const input =
      `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
    const embedding = await openAiService.getVectorEmbeddings(input);
    if (!user?.uid) return;

    try {
      const sourcePrayerId =
        editMode === EditMode.EDIT ? updatedPrayerPoint.id : undefined;
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
    openAiService,
    user.uid,
    editMode,
  ]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (
        updatedPrayerPoint.title?.trim() ||
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
    let embeddingInput =
      (updatedPrayerPoint.embedding as number[]) || undefined;

    if (embeddingInput.length === 0 && !updatedPrayerPoint.linkedTopic) {
      const input =
        `${updatedPrayerPoint.title} ${updatedPrayerPoint.content}`.trim();
      embeddingInput = await openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) return;

    const prayerPointData: CreatePrayerPointDTO = {
      title: updatedPrayerPoint.title?.trim(),
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
      linkedTopic: updatedPrayerPoint.linkedTopic || undefined,
    };

    await prayerPointService.createPrayerPoint(prayerPointData);
    Alert.alert('Success', 'Prayer Point created successfully.');
  };

  const updatePrayerPoint = async () => {
    const updateData: UpdatePrayerPointDTO = {
      title: updatedPrayerPoint.title?.trim(),
      content: updatedPrayerPoint.content,
      privacy,
      tags: updatedPrayerPoint.tags,
      prayerType: updatedPrayerPoint.prayerType,
      status: updatedPrayerPoint.status,
      ...(updatedPrayerPoint.linkedTopic?.length
        ? { linkedPrayerPoints: updatedPrayerPoint.linkedTopic }
        : {}),
      embedding:
        updatedPrayerPoint.embedding === undefined
          ? deleteField()
          : updatedPrayerPoint.embedding,
      linkedTopic: updatedPrayerPoint.linkedTopic || undefined,
    };

    await prayerPointService.updatePrayerPoint(
      updatedPrayerPoint.id,
      updateData,
    );

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
    similarPrayers,
    loadPrayerPoint,
  };
}
