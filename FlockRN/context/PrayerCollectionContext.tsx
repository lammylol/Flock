import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  AnyPrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
} from '@/types/firebase';
import { prayerService } from '@/services/prayer/prayerService';
import useAuth from '@/hooks/useAuth';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';

interface PrayerCollectionContextType {
  userPrayers: Prayer[];
  userPrayerPoints: PrayerPoint[];
  userPrayerTopics: PrayerTopic[];
  filteredUserPrayers: Prayer[];
  filteredUserPrayerPoints: PrayerPoint[];
  filteredUserPrayerTopics: PrayerTopic[];
  loadAll: () => void;
  searchPrayers: (text: string) => void;
  updateCollection: (updatedPrayer: AnyPrayerEntity, type: string) => void;
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
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const [userPrayerPoints, setUserPrayerPoints] = useState<PrayerPoint[]>([]);
  const [userPrayerTopics, setUserPrayerTopics] = useState<PrayerTopic[]>([]);
  const [filteredUserPrayers, setFilteredUserPrayers] = useState<Prayer[]>([]);
  const [filteredUserPrayerPoints, setFilteredUserPrayerPoints] = useState<
    PrayerPoint[]
  >([]);
  const [filteredUserPrayerTopics, setFilteredUserPrayerTopics] = useState<
    PrayerTopic[]
  >([]);

  const loadPrayers = useCallback(async () => {
    if (!user) return;
    const prayers = await prayerService.getUserPrayers(user.uid);
    setUserPrayers(prayers);
    setFilteredUserPrayers(prayers);
  }, [user]);

  const loadPrayerPoints = useCallback(async () => {
    if (!user) return;
    const prayerPoints = await prayerPointService.getUserPrayerPoints(user.uid);
    setUserPrayerPoints(prayerPoints);
    setFilteredUserPrayerPoints(prayerPoints);
  }, [user]);

  const loadPrayerTopics = useCallback(async () => {
    if (!user) return;
    const prayerTopics = await prayerTopicService.getUserPrayerTopics(user.uid);
    setUserPrayerTopics(prayerTopics);
    setFilteredUserPrayerTopics(prayerTopics);
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

  const updatePrayerTopics = (updatedPrayerTopic: PrayerTopic) => {
    setUserPrayerTopics((prevPrayerTopics) =>
      prevPrayerTopics.map((prayerTopic) =>
        prayerTopic.id === updatedPrayerTopic.id
          ? updatedPrayerTopic
          : prayerTopic,
      ),
    );
  };

  const updateCollection = useCallback(
    (updatedPrayer: AnyPrayerEntity, type: string) => {
      if (type === 'prayerPoint') {
        updatePrayerPoints(updatedPrayer as PrayerPoint);
      } else if (type === 'prayerTopic') {
        updatePrayerTopics(updatedPrayer as PrayerTopic);
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
    } else if (type === 'prayerTopic') {
      setUserPrayerTopics((prevTopics) =>
        prevTopics.filter((topic) => topic.id !== id),
      );
      setFilteredUserPrayerTopics((prevTopics) =>
        prevTopics.filter((topic) => topic.id !== id),
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
    loadPrayerTopics();
  }, [loadPrayers, loadPrayerPoints, loadPrayerTopics]);

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
      setFilteredUserPrayerTopics(
        userPrayerTopics.filter((prayerTopic) =>
          prayerTopic.title?.toLowerCase().includes(searchText),
        ),
      );
    },
    [userPrayers, userPrayerPoints, userPrayerTopics],
  );

  return (
    <PrayerCollectionContext.Provider
      value={{
        userPrayers,
        userPrayerPoints,
        userPrayerTopics,
        filteredUserPrayers,
        filteredUserPrayerPoints,
        filteredUserPrayerTopics,
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
