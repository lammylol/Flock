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
    if (prayers) {
      setUserPrayers(prayers);
      setFilteredUserPrayers(prayers);
    }
  }, [user]);

  const loadPrayerPoints = useCallback(async () => {
    const prayerPoints = await fetchPrayersPoints(user);
    if (prayerPoints) {
      setUserPrayerPoints(prayerPoints);
      setFilteredUserPrayerPoints(prayerPoints);
    }
  }, [user]);

  const loadAll = useCallback(() => {
    loadPrayers();
    loadPrayerPoints();
  }, [user]);

  useFocusEffect(loadAll);

  const searchPrayers = useCallback(
    (text: string, selectedTab: TabType) => {
      const searchText = text.trim();
      // Right now we filter prayers, in the future we need to actually search
      // TODO: Implement proper search functionality
      console.log(searchText, selectedTab);
      if (selectedTab === 'prayerPoints') {
        const filteredPrayerPoints = userPrayerPoints.filter((prayerPoint) =>
          prayerPoint.title?.toLowerCase().includes(searchText.toLowerCase()),
        );
        console.log(
          'filteredPrayerPoints',
          filteredPrayerPoints.length,
          userPrayerPoints.length,
        );
        setFilteredUserPrayerPoints(filteredPrayerPoints);
      } else {
        const filteredPrayers = userPrayers.filter((prayer) =>
          prayer.title?.toLowerCase().includes(searchText.toLowerCase()),
        );
        console.log(
          'filteredPrayers',
          filteredPrayers.length,
          userPrayers.length,
        );
        setFilteredUserPrayers(filteredPrayers);
      }
    },
    [userPrayerPoints, userPrayers, selectedTab],
  );

  return (
    <ThemedScrollView style={styles.header} onRefresh={loadAll}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Prayers</ThemedText>
      </ThemedView>
      <ThemedView>
        <SearchBar
          placeholder={`Search ${selectedTab === 'prayerPoints' ? 'Prayer Points' : 'Prayers'}`}
          onSearch={(text: string) => searchPrayers(text, selectedTab)}
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
  );
}

const fetchPrayers = async (user: User | null) => {
  try {
    if (!user) return;
    const prayers = await prayerService.getUserPrayers(user.uid);
    return prayers;
  } catch (error) {
    console.error('Error fetching prayers:', error);
  }
};

const fetchPrayersPoints = async (user: User | null) => {
  try {
    if (!user) return;
    const prayers = await prayerService.getUserPrayerPoints(user.uid);
    return prayers;
  } catch (error) {
    console.error('Error fetching prayers:', error);
  }
};

const styles = StyleSheet.create({
  header: {
    padding: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
