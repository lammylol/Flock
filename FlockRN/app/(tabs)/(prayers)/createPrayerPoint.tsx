import PrayerPointEditor from '@/components/Prayer/PrayerEdit/PrayerPointEditor';
import { EditMode } from '@/types/ComponentProps';
import { useMemo } from 'react';

import { useLocalSearchParams } from 'expo-router';
import { PrayerMetadataContextProvider } from '@/context/PrayerMetadataContext';

const PrayerPointMetadataStandaloneScreen = () => {
  const params = useLocalSearchParams<{
    id?: string;
    editMode?: EditMode;
  }>();

  const processedParams = useMemo(() => {
    return {
      id: params.id ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
    };
  }, [params.editMode, params.id]);

  const { id, editMode } = processedParams;

  return (
    <PrayerMetadataContextProvider>
      <PrayerPointEditor id={id} editMode={editMode} shouldPersist={true} />
    </PrayerMetadataContextProvider>
  );
};

export default PrayerPointMetadataStandaloneScreen;
