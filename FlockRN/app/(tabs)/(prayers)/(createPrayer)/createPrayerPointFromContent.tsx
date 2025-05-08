import PrayerPointEditor from '@/components/Prayer/PrayerEdit/PrayerPointEditor';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';
import { PrayerPoint } from '@/types/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { set } from 'lodash';

const PrayerPointMetadataFromPrayerScreen = () => {
  const params = useLocalSearchParams() as {
    index: string;
  };

  const {
    prayer,
    setPrayer,
    prayerPoints,
    updatePrayerPoints,
    linkedPrayerPairs,
    setLinkedPrayerPairs,
    addLinkedPrayerPairs,
  } = usePrayerMetadataContext();

  const index = parseInt(params.index, 10);
  const prayerPoint = prayerPoints[index] as Partial<PrayerPoint>;

  const router = useRouter();

  const handleSubmitLocal = (
    prayerPoint: PrayerPoint,
    linkedPrayerPair?: LinkedPrayerPointPair,
  ) => {
    if (linkedPrayerPair) {
      addLinkedPrayerPairs(linkedPrayerPair);
    }

    const updatedPoint = prayerPoint as PrayerPoint;
    console.log('Updated prayer points:', updatedPoint);
    updatePrayerPoints(index, updatedPoint);
    router.back(); // or pass data to parent
    // alternatively use a context or shared state to collect results
  };

  return (
    <PrayerPointEditor
      editMode={EditMode.EDIT}
      shouldPersist={false}
      initialContent={prayerPoint as Partial<PrayerPoint>}
      onSubmitLocal={handleSubmitLocal}
    />
  );
};

export default PrayerPointMetadataFromPrayerScreen;
