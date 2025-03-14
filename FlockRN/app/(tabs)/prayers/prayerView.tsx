/* This file sets the screen that a user sees when clicking into a prayer.*/
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Prayer } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import useAuth from '@/hooks/useAuth';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  
  const isOwner = prayer && user && prayer.authorId === user.uid;

  useEffect(() => {
    const fetchPrayer = async () => {
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
    };

    fetchPrayer();
  }, [id]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [TagsSection]); // Scroll to bottom whenever messages change

  const handleEdit = () => {
    if (!prayer) return;
    
    // Navigate to metadata screen with all the prayer data
    router.push({
      pathname: '/createPrayerFlow/prayerMetadata',
      params: { 
        id: prayer.id,
        content: prayer.content,
        title: prayer.title,
        privacy: prayer.privacy,
        tags: JSON.stringify(prayer.tags),
        mode: 'edit'
      },
    });
  };

  return (
    <ThemedScrollView style={styles.scrollView}>
      <ThemedView style={styles.mainBackground}>
        {prayer && (
          <ThemedView style={styles.container}>
            {isOwner && (
              <TouchableOpacity 
                onPress={handleEdit} 
                style={styles.editButton}
              >
                <ThemedText style={styles.editButtonText}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            <PrayerContent title={prayer.title} content={prayer.content} />
            <TagsSection prayerId={prayer.id} tags={prayer.tags} />
          </ThemedView>
        )}
      </ThemedView>
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    flex: 0,
    padding: 16,
  },
  mainBackground: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  editButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrayerView;