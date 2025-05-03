import { PrayerPoint, PrayerTopic } from '@/types/firebase';
import React from 'react';
import { Modal } from 'react-native';

interface LinkPrayerModalProps {
  visible: boolean;
  onClose: () => void;
  originPrayer: PrayerPoint | PrayerTopic;
  newPrayerPoint: PrayerPoint;
  onAddTopic: (title: string) => void;
}

const LinkPrayerModal: React.FC<LinkPrayerModalProps> = ({ visible }) => {
  return <Modal visible={visible} transparent animationType="slide"></Modal>;
};

export default LinkPrayerModal;
