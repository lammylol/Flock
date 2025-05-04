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

  // requires parameter to be passed in to avoid possible useState delay.
  const createPrayerPoint = async (data: PrayerPoint): Promise<string> => {
    let embeddingInput = (data.embedding as number[]) || undefined;

    // only generate embedding if not already present (in cases where
    // user edits and creates before embeddings are generated).
    // Do not generate if new prayer point is linked to a topic.
    if (!embeddingInput && !data.linkedTopic) {
      const input = `${data.title} ${data.content}`.trim();
      embeddingInput = await openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) throw new Error('User not authenticated');

    const prayerPointData: CreatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content.trim(),
      privacy: data.privacy || privacy,
      prayerType: data.prayerType,
      tags: data.tags,
      authorId: user.uid,
      authorName: user.displayName || 'unknown',
      status: data.status || 'open',
      recipientName: data.recipientName || 'unknown',
      recipientId: data.recipientId || 'unknown',
      ...(data.embedding && { embedding: data.embedding }),
      ...(data.linkedTopic && { linkedTopic: data.linkedTopic }),
    };

    const docRefId =
      await prayerPointService.createPrayerPoint(prayerPointData);
    Alert.alert('Success', 'Prayer Point created successfully.');
    return docRefId;
  };

  // requires parameter to be passed in to avoid possible useState delay.
  const updatePrayerPoint = async (data: PrayerPoint) => {
    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content,
      privacy: data.privacy || privacy,
      tags: data.tags,
      prayerType: data.prayerType,
      status: data.status,
      embedding: data.embedding == null ? deleteField() : data.embedding,
      linkedTopic: data.linkedTopic == null ? deleteField() : data.linkedTopic,
    };
    await prayerPointService.updatePrayerPoint(data.id, updateData);

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
