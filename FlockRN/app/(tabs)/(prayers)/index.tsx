import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer, PrayerPoint } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useCallback, useState } from 'react';
import { prayerService } from '@/services/prayer/prayerService';

import { useFocusEffect } from '@react-navigation/native';

import PrayerCard from '@/components/Prayer/PrayerView/PrayerCard';
import { Tabs } from '@/components/Tab';
import SearchBar from '@/components/ui/SearchBar';
import { User } from 'firebase/auth';
import { FloatingAddPrayerButton } from '@/components/Prayer/PrayerView/FloatingAddPrayerButton';

type TabType = 'prayerPoints' | 'userPrayers';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const [userPrayerPoints, setUserPrayerPoints] = useState<PrayerPoint[]>([]);

  const [filteredUserPrayers, setFilteredUserPrayers] = useState<Prayer[]>([]);
  const [filteredUserPrayerPoints, setFilteredUserPrayerPoints] = useState<
    PrayerPoint[]
  >([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('userPrayers');

  const loadPrayers = useCallback(async () => {
    const prayers = await fetchPrayers(user);
    setUserPrayers(prayers);
    setFilteredUserPrayers(prayers);
  }, [user]);

  const loadPrayerPoints = useCallback(async () => {
    const prayerPoints = await fetchPrayersPoints(user);
    setUserPrayerPoints(prayerPoints);
    setFilteredUserPrayerPoints(prayerPoints);
  }, [user]);

  const loadAll = useCallback(() => {
    loadPrayers();
    loadPrayerPoints();
  }, [loadPrayers, loadPrayerPoints]);

  useFocusEffect(loadAll);

  const filterPrayers = useCallback(
    (text: string) => {
      if (userPrayers.length === 0) return;
      const filteredValues = userPrayers.filter((prayer) =>
        prayer.title?.toLowerCase().includes(text),
      );
      setFilteredUserPrayers(filteredValues);
    },
    [userPrayers],
  );

  const filterPrayerPoints = useCallback(
    (text: string) => {
      if (userPrayerPoints.length === 0) return;
      const filteredValues = userPrayerPoints.filter((prayerPoint) =>
        prayerPoint.title?.toLowerCase().includes(text),
      );
      setFilteredUserPrayerPoints(filteredValues);
    },
    [userPrayerPoints],
  );

  const searchPrayers = useCallback(
    (text: string) => {
      const searchText = text.trim().toLowerCase();
      filterPrayers(searchText);
      filterPrayerPoints(searchText);
    },
    [filterPrayerPoints, filterPrayers],
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView style={styles.scrollView} onRefresh={loadAll}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">My Prayers</ThemedText>
        </ThemedView>
        <ThemedView>
          <SearchBar
            placeholder={`Search ${selectedTab === 'prayerPoints' ? 'Prayer Points' : 'Prayers'}`}
            onSearch={searchPrayers}
          />
          <Tabs
            tabs={[
              `Prayer Requests (${userPrayerPoints.length})`,
              `Prayers (${userPrayers.length})`,
            ]}
            selectedIndex={selectedTab === 'prayerPoints' ? 0 : 1}
            onChange={(index) =>
              setSelectedTab(index === 0 ? 'prayerPoints' : 'userPrayers')
            }
          />
          {selectedTab === 'prayerPoints' && (
            <ThemedScrollView>
              {filteredUserPrayerPoints.map((prayerPoint: PrayerPoint) => (
                <PrayerCard key={prayerPoint.id} prayer={prayerPoint} />
              ))}
            </ThemedScrollView>
          )}
          {selectedTab === 'userPrayers' && (
            <ThemedScrollView>
              {filteredUserPrayers.map((prayer: Prayer) => (
                <PrayerCard key={prayer.id} prayer={prayer} />
              ))}
            </ThemedScrollView>
          )}
        </ThemedView>
      </ThemedScrollView>
      <FloatingAddPrayerButton />
    </ThemedView>
  );
}

const fetchPrayers = async (user: User | null) => {
  try {
    if (!user) return [];
    const prayers = await prayerService.getUserPrayers(user.uid);
    return prayers;
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return [];
  }
};

const fetchPrayersPoints = async (user: User | null) => {
  try {
    if (!user) return [];
    const prayersPoints = await prayerService.getUserPrayerPoints(user.uid);
    return prayersPoints;
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return [];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    padding: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    position: 'relative'
  }
});
