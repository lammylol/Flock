import { PrayerPoint, PrayerTopic } from '@/types/firebase';
import { getEntityType } from '@/types/typeGuards';
import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';

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
  // const [originPrayer, setOriginPrayer] = useState('');
  // const [newPrayerPoint, setNewPrayerPoint] = useState('');
  const [topicTitle, setTopicTitle] = useState('');

  const entityType = useMemo(() => {
    return getEntityType(originPrayer);
  }, [originPrayer]);

  // Use the entityType to create the boolean checks
  const isPrayerPoint = entityType === 'prayerPoint';
  const isPrayerTopic = entityType === 'prayerTopic';

  const handleAddTopic = () => {
    if (topicTitle.trim()) {
      onAddTopic(topicTitle);
      setTopicTitle('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {isPrayerPoint && (
            <>
              <Text style={styles.header}>Add #Topic</Text>
              <TextInput
                style={styles.input}
                placeholder="Topic Title"
                value={topicTitle}
                onChangeText={setTopicTitle}
              />
              <Text style={styles.header}>
                Linking {newPrayerPoint.title} to {originPrayer.title}
              </Text>
            </>
          )}
          {isPrayerTopic && (
            <>
              <Text style={styles.header}>Link Prayer to Existing Topic</Text>
              <TextInput
                style={styles.input}
                placeholder="Prayer Title"
                value={originPrayer.title}
                onChangeText={setTopicTitle}
              />
              <Text style={styles.header}>
                Link {newPrayerPoint.title} to {originPrayer.title}
              </Text>
            </>
          )}
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title="Add Topic" onPress={handleAddTopic} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default LinkPrayerModal;
