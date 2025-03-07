/* This file sets the screen that a user sees when clicking into a prayer.*/
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Prayer } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
// import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
// import ToggleSwitch from '@/components/toggleSwitch';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);

  useEffect(() => {
    const fetchPrayer = async () => {
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
    };

    fetchPrayer();
  }, [id]);

  // const prayer = usePrayerStore((state) => state.prayers[id]); // Fetch from global store

return (
  <View style={styles.container}>
    {prayer && (
      <Text>{prayer.content}</Text>
      /* <View className="flex-1 bg-gray-50">
        <PrayerContent title={prayer.title} content={prayer.content} />
        <View className="px-4">
          <TagsSection
            tags={prayertags}
            onTagPress={(tag) => console.log('Tag pressed:', tag.label)}
          />
        </View>

        <View className="mt-6">
          <SettingsRow
            title="Privacy"
            rightElement={
              <View className="flex-row items-center">
                <Text className="text-gray-600 mr-2">Private</Text>
                <Text className="text-gray-400">􀎡</Text>
              </View>
            }
            onPress={() => setIsPrivate(!isPrivate)}
          />

          <SettingsRow
            title="􀉉 Enable Reminders"
            rightElement={
              <ToggleSwitch
                isEnabled={remindersEnabled}
                onToggle={() => setRemindersEnabled(!remindersEnabled)}
              />
            }
          />
        </View>
      </View> */
    )}
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  headerText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginLeft: 8,
  },
  horizontalContainer: {
    flex: 0,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  recordingCard: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
  },
  upperSection: {
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
  },
});

export default PrayerView;
