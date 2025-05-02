import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { prayerService } from '@/services/prayer/prayerService';
import useAuthContext from '@/hooks/useAuthContext';

interface PrayerCollectionContextType {
  userPrayers: Prayer[];
  userPrayerPoints: PrayerPoint[];
  filteredUserPrayers: Prayer[];
  filteredUserPrayerPoints: PrayerPoint[];
  loadAll: () => void;
  searchPrayers: (text: string) => void;
  updateCollection: (updatedPrayer: Prayer | PrayerPoint, type: string) => void;
  removeFromCollection: (id: string, type: string) => void;
}

const PrayerCollectionContext = createContext<
  PrayerCollectionContextType | undefined
>(undefined);

export const PrayerCollectionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuthContext();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const [userPrayerPoints, setUserPrayerPoints] = useState<PrayerPoint[]>([]);
  const [filteredUserPrayers, setFilteredUserPrayers] = useState<Prayer[]>([]);
  const [filteredUserPrayerPoints, setFilteredUserPrayerPoints] = useState<
    PrayerPoint[]
  >([]);

  const loadPrayers = useCallback(async () => {
    if (!user) return;
    const prayers = await prayerService.getUserPrayers(user.uid);
    setUserPrayers(prayers);
    setFilteredUserPrayers(prayers);
  }, [user]);

  const loadPrayerPoints = useCallback(async () => {
    if (!user) return;
    const prayerPoints = await prayerService.getUserPrayerPoints(user.uid);
    setUserPrayerPoints(prayerPoints);
    setFilteredUserPrayerPoints(prayerPoints);
  }, [user]);

  // Function to update a specific prayer in the state
  const updatePrayer = (updatedPrayer: Prayer) => {
    setUserPrayers((prevPrayers) =>
      prevPrayers.map((prayer) =>
        prayer.id === updatedPrayer.id ? updatedPrayer : prayer,
      ),
    );
  };

  // Function to update a specific prayer point in the state
  const updatePrayerPoints = (updatedPrayerPoint: PrayerPoint) => {
    setUserPrayerPoints((prevPrayersPoints) =>
      prevPrayersPoints.map((prayerPoint) =>
        prayerPoint.id === updatedPrayerPoint.id
          ? updatedPrayerPoint
          : prayerPoint,
      ),
    );
  };

  const updateCollection = useCallback(
    (updatedPrayer: Prayer | PrayerPoint, type: string) => {
      if (type === 'prayerPoint') {
        updatePrayerPoints(updatedPrayer as PrayerPoint);
      } else {
        updatePrayer(updatedPrayer as Prayer);
      }
    },
    [],
  );

  const removeFromCollection = useCallback((id: string, type: string) => {
    if (type === 'prayerPoint') {
      setUserPrayerPoints((prevPoints) =>
        prevPoints.filter((point) => point.id !== id),
      );
      setFilteredUserPrayerPoints((prevPoints) =>
        prevPoints.filter((point) => point.id !== id),
      );
    } else {
      setUserPrayers((prevPrayers) =>
        prevPrayers.filter((prayer) => prayer.id !== id),
      );
      setFilteredUserPrayers((prevPrayers) =>
        prevPrayers.filter((prayer) => prayer.id !== id),
      );
    }
  }, []);

  const loadAll = useCallback(() => {
    loadPrayers();
    loadPrayerPoints();
  }, [loadPrayers, loadPrayerPoints]);

  const searchPrayers = useCallback(
    (text: string) => {
      const searchText = text.trim().toLowerCase();
      setFilteredUserPrayers(
        userPrayers.filter((prayer) =>
          prayer.title?.toLowerCase().includes(searchText),
        ),
      );
      setFilteredUserPrayerPoints(
        userPrayerPoints.filter((prayerPoint) =>
          prayerPoint.title?.toLowerCase().includes(searchText),
        ),
      );
    },
    [userPrayers, userPrayerPoints],
  );

  return (
    <PrayerCollectionContext.Provider
      value={{
        userPrayers,
        userPrayerPoints,
        filteredUserPrayers,
        filteredUserPrayerPoints,
        loadAll,
        searchPrayers,
        updateCollection,
        removeFromCollection,
      }}
    >
      {children}
    </PrayerCollectionContext.Provider>
  );
};

export const usePrayerCollection = (): PrayerCollectionContextType => {
  const context = useContext(PrayerCollectionContext);
  if (!context) {
    throw new Error(
      'usePrayerCollection must be used within a PrayerCollectionProvider',
    );
  }
  return context;
};
