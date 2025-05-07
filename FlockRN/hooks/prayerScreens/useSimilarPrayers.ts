import { useCallback, useEffect, useState } from 'react';
import OpenAiService from '@/services/ai/openAIService';
import { auth } from '@/firebase/firebaseConfig';
import { PartialLinkedPrayerEntity, PrayerPoint } from '@/types/firebase';
import { EditMode } from '@/types/ComponentProps';
import { prayerService } from '@/services/prayer/prayerService';

export function useSimilarPrayers(
  prayerPoint: PrayerPoint,
  editMode: EditMode,
) {
  const openAiService = OpenAiService.getInstance();
  const user = auth.currentUser;
  const [similarPrayers, setSimilarPrayers] = useState<
    PartialLinkedPrayerEntity[]
  >([]);
  const [embedding, setEmbedding] = useState<number[]>([]);

  // Debounced function
  const debouncedFindSimilarPrayers = useCallback(async () => {
    const input = `${prayerPoint.title} ${prayerPoint.content}`.trim();
    if (!input || !user?.uid) return;

    console.log('Fetching new embedding');
    const currentEmbedding = await openAiService.getVectorEmbeddings(input);
    // In the future, we can have a check to see if the context of prayer point has materially changed.
    // If it has, we can fetch a new embedding. If not, we can use the existing one.

    setEmbedding(currentEmbedding);

    const sourcePrayerId =
      editMode === EditMode.EDIT ? prayerPoint.id : undefined;

    try {
      if (currentEmbedding.length === 0) {
        console.error('Empty embedding array');
        return;
      }
      const similar = await prayerService.findRelatedPrayers(
        currentEmbedding,
        user.uid,
        sourcePrayerId,
      );
      setSimilarPrayers(similar);
    } catch (error) {
      console.error('Error finding similar prayers:', error);
    }
  }, [
    editMode,
    openAiService,
    prayerPoint.content,
    prayerPoint.id,
    prayerPoint.title,
    user.uid,
  ]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (prayerPoint.title?.trim() || prayerPoint.content?.trim()) {
        debouncedFindSimilarPrayers();
      }
    }, 1000); // Debounce delay

    // Cleanup timeout on component unmount or dependency change
    return () => clearTimeout(debounceTimeout);
  }, [prayerPoint.title, prayerPoint.content, debouncedFindSimilarPrayers]);

  return {
    similarPrayers,
    embedding,
  };
}
