import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useCallback, useState } from 'react';
import { prayerService } from '@/services/prayer/prayerService';

import { useFocusEffect } from '@react-navigation/native';

import PrayerCard from '@/components/Prayer/PrayerView/PrayerCard';
import { Tabs } from '@/components/Tab';
import SearchBar from '@/components/ui/SearchBar';
import { User } from 'firebase/auth';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    'prayerPoints' | 'userPrayers'
  >('userPrayers');

  useFocusEffect(() => {
    const loadPrayers = async () => {
      const prayers = await fetchPrayers(user);
      if (prayers) {
        setUserPrayers(prayers);
      }
    };
    loadPrayers();
  });

  const handleRefreshPrayers = async () => {
    const prayers = await fetchPrayers(user);
    if (prayers) {
      setUserPrayers(prayers);
    }
  };

  const searchPrayers = useCallback((text: string) => {
    if (!text) {
      return setUserPrayers(userPrayers);
    }
    // Right now we filter prayers, in the future we need to actually search
    // TODO: Implement search functionality
    console.log('Searching for:', text);
    const filteredPrayers = userPrayers.filter((prayer) =>
      prayer.title.toLowerCase().includes(text.toLowerCase()),
    );
    setUserPrayers(filteredPrayers);
  }, []);

  return (
    <ThemedScrollView style={styles.header} onRefresh={handleRefreshPrayers}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Prayers</ThemedText>
      </ThemedView>
      <ThemedView>
        <SearchBar placeholder="Search" onSearch={searchPrayers} />
        <Tabs
          tabs={[`Prayer Requests (${userPrayers.length})`, `Prayers (${0})`]}
          selectedIndex={selectedTab === 'prayerPoints' ? 0 : 1}
          onChange={(index) =>
            setSelectedTab(index === 0 ? 'prayerPoints' : 'userPrayers')
          }
        />
        {selectedTab === 'prayerPoints' && (
          <ThemedScrollView>
            {userPrayers.map((prayer: Prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </ThemedScrollView>
        )}
        {selectedTab === 'userPrayers' && (
          <ThemedScrollView>
            {userPrayers.map((prayer: Prayer) => (
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

const styles = StyleSheet.create({
  header: {
    padding: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
