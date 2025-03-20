import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import PrayerPointCard from './PrayerPointCard';
import { Entypo } from '@expo/vector-icons';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  editable?: boolean;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  editable = false,
}) => {
  const [isEditMode, setEditMode] = useState(false);

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    prayerPoints && (
      <ThemedView
        style={[
          styles.prayerPointsContainer,
          { borderColor: Colors.secondary },
        ]}
      >
        <View style={styles.titleHeader}>
          <ThemedText style={styles.prayerPointsText}>Prayer Points</ThemedText>
          {editable && (
            <>
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.editContainer}
              >
                <ThemedView style={styles.editButton}>
                  <Entypo name="edit" size={10} color={Colors.white} />
                </ThemedView>
                <ThemedText style={styles.editText}> Edit </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
        {prayerPoints.map((prayerPoint: PrayerPoint) => (
          <PrayerPointCard
            key={prayerPoint.id}
            title={prayerPoint.title}
            content={prayerPoint.content}
            isEditMode={isEditMode}
          />
        ))}
      </ThemedView>
    )
  );
};

const styles = StyleSheet.create({
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.textPrimary,
    borderRadius: 12,
    fontWeight: 'bold',
    gap: 10,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  editContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  editText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerPointsContainer: {
    borderRadius: 15,
    borderWidth: 1,
    flex: 0,
    gap: 15,
    padding: 25,
  },
  prayerPointsText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  titleHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default PrayerPointSection;
