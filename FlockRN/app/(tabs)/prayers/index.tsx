import { StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import { Prayer } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';
import { prayerService } from '@/services/prayer/prayerService';

import { useFocusEffect } from '@react-navigation/native';

import PrayerCard from '@/components/Prayer/PrayerView/PrayerCard';
import { Tabs } from '@/components/Tab';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState<
    'prayerPoints' | 'userPrayers'
  >('userPrayers');

  useFocusEffect(() => {
    const fetchPrayers = async () => {
      try {
        if (!user) return;
        const prayers = await prayerService.getUserPrayers(user.uid);
        setUserPrayers(prayers);
      } catch (error) {
        console.error('Error fetching prayers:', error);
      }
    };
    fetchPrayers();
  });
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Prayers</ThemedText>
      </ThemedView>
      <ThemedView>
        <TextInput
          style={styles.input}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Tabs
          tabs={[`Prayer Requests (${userPrayers.length})`, `Prayers (${0})`]}
          selectedIndex={selectedTab === 'prayerPoints' ? 0 : 1}
          onChange={(index) =>
            setSelectedTab(index === 0 ? 'prayerPoints' : 'userPrayers')
          }
          indicatorColor="#1976d2"
          textColor="#000"
        />
        {selectedTab === 'prayerPoints' && (
          <ScrollView>
            {userPrayers.map((prayer: Prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </ScrollView>
        )}
        {selectedTab === 'userPrayers' && (
          <ScrollView>
            {userPrayers.map((prayer: Prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </ScrollView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 25,
    borderWidth: 1,
    height: 40,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
