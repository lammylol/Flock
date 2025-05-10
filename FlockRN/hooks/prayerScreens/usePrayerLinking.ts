// hooks/prayerScreens/usePrayerLinking.ts
import { useState } from 'react';
import { LinkedPrayerEntity } from '@/types/firebase';

export function usePrayerLinking() {
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [originPrayer, setOriginPrayer] = useState<LinkedPrayerEntity | null>(
    null,
  );

  // This function is passed to the PrayerPointLinking component
  // and is called when the user selects a prayer point or topic to link to.
  // It updates the selected prayer and the prayer topic DTO.
  const handlePrayerLinkingOnChange = (
    selectedPrayer: LinkedPrayerEntity,
    title?: string,
  ) => {
    if (!selectedPrayer) {
      setOriginPrayer(null);
      setTopicTitle('');
    }
    setOriginPrayer(selectedPrayer);
    setTopicTitle(title ?? selectedPrayer?.title ?? '');
  };

  return {
    prayerTopicDTO: topicTitle,
    originPrayer,
    selectedPrayerToLinkTo: originPrayer,
    handlePrayerLinkingOnChange,
  };
}
