import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import PopUpModal from '@/components/PopUpModal';
import { PrayerPoint, PrayerTopic } from '@/types/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { getEntityType } from '@/types/typeGuards';
import PrayerCard from './PrayerCard';
import { ThemedView } from '@/components/ThemedView';

interface LinkPrayerModalProps {
  visible: boolean;
  onClose: () => void;
  originPrayer: PrayerPoint | PrayerTopic;
  newPrayerPoint: PrayerPoint;
  onAddTopic: (title: string) => void;
}

const LinkPrayerModal: React.FC<LinkPrayerModalProps> = ({
  visible,
  onClose,
  originPrayer,
  newPrayerPoint,
  onAddTopic,
}) => {
  const [topicTitle, setTopicTitle] = useState('');
  const originEntityType = getEntityType(originPrayer);
  const isOriginAPrayerPoint = originEntityType === 'prayerPoint';

  const handleAddTopic = () => {
    if (!topicTitle.trim()) {
      Alert.alert('Error', 'You must enter a topic name.');
      return;
    }

    if (topicTitle.trim().length > 50) {
      Alert.alert('Error', 'You must keep the topic name below 50 characters.');
      return;
    }

    if (topicTitle.trim()) {
      onAddTopic(topicTitle);
      setTopicTitle('');
      onClose();
    }
  };

  // Define UI text based on isPrayerPoint
  const title = isOriginAPrayerPoint
    ? 'Link these prayer points together under a new #topic.'
    : 'Link Prayer to Existing Topic';
  const description = isOriginAPrayerPoint
    ? 'You will be able to add other prayer points to this #topic in the future.'
    : 'You are linking a prayer point to an existing topic.';
  const inputPlaceholder = isOriginAPrayerPoint
    ? 'Enter #topic name'
    : 'Prayer Title';
  const saveText = isOriginAPrayerPoint ? 'Add Topic' : 'Add to Topic';
  const inputValue = isOriginAPrayerPoint ? topicTitle : originPrayer.title;
  const onChangeText = isOriginAPrayerPoint ? setTopicTitle : () => { };
  const primaryTextColor = useThemeColor({}, 'textPrimary');
  const secondaryTextColor = useThemeColor({}, 'textSecondary');

  return (
    <PopUpModal
      visible={visible}
      onClose={onClose}
      onAction={handleAddTopic}
      actionTitle={saveText}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerContainer}>
          <Text style={{ ...styles.header, color: primaryTextColor }}>
            {title}
          </Text>
          <Text style={{ ...styles.subHeader, color: secondaryTextColor }}>
            {description}
          </Text>
        </ThemedView>
        <ThemedView>
          <TextInput
            style={styles.input}
            placeholder={inputPlaceholder}
            value={inputValue}
            onChangeText={onChangeText}
            editable={isOriginAPrayerPoint} // <-- important so originPrayer title isn't editable
          />
          <Text style={{ ...styles.maxLength, color: primaryTextColor }}>
            50 characters maximum
          </Text>
        </ThemedView>
        <PrayerCard prayer={newPrayerPoint}></PrayerCard>
        <PrayerCard prayer={originPrayer}></PrayerCard>
      </ThemedView>
    </PopUpModal>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 18,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  headerContainer: {
    marginTop: 10,
    gap: 10,
  },
  maxLength: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
    marginLeft: 3,
  },
});

export default LinkPrayerModal;
