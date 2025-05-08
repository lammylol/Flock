// PrayerCreationContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useReducer,
} from 'react';
import { Prayer, PrayerPoint, UpdatePrayerDTO } from '@/types/firebase';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';
import { usePrayerCollection } from './PrayerCollectionContext';
import { EntityType } from '@/types/PrayerSubtypes';
import { reducer, initialState } from './PrayerMetadataReducer';
import { Alert } from 'react-native';

interface PrayerMetadataContextType {
  prayer: Prayer | null;
  setPrayer: (p: Prayer) => void;
  prayerPoints: PrayerPoint[];
  setPrayerPoints: (pp: PrayerPoint[]) => void;
  linkedPrayerPairs: LinkedPrayerPointPair[];
  setLinkedPrayerPairs: (data: LinkedPrayerPointPair[]) => void;
  addLinkedPrayerPairs: (data: LinkedPrayerPointPair) => void;
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  loadPrayer: (id: string) => Promise<void>;
  updatePrayer: (data: Prayer) => Promise<void>;
  createPrayer: (data: Prayer) => Promise<string>; // returns id
  deletePrayer: (
    id: string,
    onSuccess: () => void,
    onFailure?: () => void,
  ) => Promise<void>;
  handlePrayerUpdate: (data: Partial<Prayer>) => void;
  updatePrayerPoints: (index: number, point: PrayerPoint) => void;
  reset: () => void;
}

const PrayerMetadataContext = createContext<
  PrayerMetadataContextType | undefined
>(undefined);

export const PrayerMetadataContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { userPrayers, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;
  const [prayer, setPrayer] = useState<Prayer>({
    id: '',
    title: '',
    content: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: 'unknown',
    authorId: 'unknown',
    privacy: 'private',
    prayerPoints: [],
    entityType: EntityType.Prayer,
  });

  const handlePrayerUpdate = (data: Partial<Prayer>) => {
    dispatch({
      type: 'UPDATE_PRAYER',
      payload: data,
    });
  };

  const loadPrayer = async (id: string) => {
    const contextPrayer = userPrayers.find((p) => p.id === id);
    if (contextPrayer) {
      dispatch({ type: 'SET_PRAYER', payload: { ...contextPrayer } });
      return;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayer(id);
      if (fetchedPrayer) {
        dispatch({ type: 'SET_PRAYER', payload: { ...fetchedPrayer } });
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
    }
  };

  // requires parameter to be passed in to avoid possible useState delay.
  const createPrayer = async (data: Prayer): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');

    const prayerData = {
      content: data.content,
      privacy: data.privacy,
      tags: [],
      authorId: auth.currentUser!.uid,
      authorName: auth.currentUser!.displayName ?? 'Unknown',
    };

    const docRefId = await prayerService.createPrayer(prayerData);
    console.log('Success', 'Prayer created successfully.');
    return docRefId;
  };

  // requires parameter to be passed in to avoid possible useState delay.
  const updatePrayer = async (data: Prayer) => {
    const updateData: UpdatePrayerDTO = {
      content: data.content,
      privacy: prayer?.privacy,
    };
    await prayerService.updatePrayer(data.id, updateData);

    updateCollection({ ...prayer, ...updateData } as Prayer, 'prayer');
    console.log('Success', 'Prayer updated successfully');
  };

  const deletePrayer = async (
    id: string,
    onSuccess: () => void,
    onFailure?: () => void,
  ) => {
    const userId = auth.currentUser?.uid;
    if (!id || !userId) {
      Alert.alert('Error', 'Cannot delete prayer');
      onFailure?.();
      return;
    }

    try {
      await prayerService.deletePrayer(id, userId);
      onSuccess();
      reset(); // reset context
    } catch (error) {
      console.error('Error deleting prayer:', error);
      Alert.alert('Error', 'Failed to delete prayer. Please try again.');
      onFailure?.();
    }
  };

  const setPrayerPoints = (pp: PrayerPoint[]) => {
    dispatch({ type: 'SET_PRAYER_POINTS', payload: pp });
  };

  const setLinkedPrayerPairs = (data: LinkedPrayerPointPair[]) => {
    dispatch({ type: 'SET_LINKED_PAIRS', payload: data });
  };

  const addLinkedPrayerPairs = (data: LinkedPrayerPointPair) => {
    dispatch({ type: 'ADD_LINKED_PAIR', payload: data });
  };

  const setEditMode = (mode: EditMode) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: mode });
  };

  const updatePrayerPoints = (index: number, point: PrayerPoint) => {
    dispatch({
      type: 'UPDATE_PRAYER_POINT_AT_INDEX',
      payload: { index, point },
    });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <PrayerMetadataContext.Provider
      value={{
        prayer: state.prayer,
        prayerPoints: state.prayerPoints,
        linkedPrayerPairs: state.linkedPrayerPairs,
        editMode: state.editMode,
        loadPrayer,
        updatePrayer,
        createPrayer,
        deletePrayer,
        handlePrayerUpdate,
        reset,
        setPrayer,
        setPrayerPoints,
        setLinkedPrayerPairs,
        setEditMode,
        addLinkedPrayerPairs,
        updatePrayerPoints,
      }}
    >
      {children}
    </PrayerMetadataContext.Provider>
  );
};

// Hook to use context
export const usePrayerMetadataContext = (): PrayerMetadataContextType => {
  const context = useContext(PrayerMetadataContext);
  if (!context) {
    throw new Error(
      'usePrayerCreation must be used within a PrayerCreationProvider',
    );
  }
  return context;
};
