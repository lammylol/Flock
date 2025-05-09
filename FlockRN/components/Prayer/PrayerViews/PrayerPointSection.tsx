// PrayerPointSection.tsx
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import { Entypo } from '@expo/vector-icons';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import EditablePrayerCard from './PrayerCard';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  isSectionEditable?: boolean;
  isPrayerCardsEditable?: boolean;
  onChange?: (prayerPoints: PrayerPoint[]) => void;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  isSectionEditable,
  isPrayerCardsEditable,
  onChange,
}) => {
  const [isEditMode, setEditMode] = useState(false);
  const [updatedPrayerPoints, setUpdatedPrayerPoints] = useState(prayerPoints);
  const borderColor = useThemeColor({}, 'borderPrimary');
  const textColor = useThemeColor({}, 'textSecondary');

  useMemo(() => {
    setUpdatedPrayerPoints(prayerPoints);
  }, [prayerPoints]);

  const handleEdit = () => {
    setEditMode((isEditMode) => !isEditMode);
    onChange?.(updatedPrayerPoints);
  };

  const handleDelete = (id: string) => {
    const prayerPointsFiltered = updatedPrayerPoints.filter(
      (prayerPoint) => prayerPoint.id !== id,
    );
    setUpdatedPrayerPoints(prayerPointsFiltered);
    onChange?.(prayerPointsFiltered);
  };

  const groupedPrayerPoints = updatedPrayerPoints.reduce<
    Record<string, PrayerPoint[]>
  >((acc, prayerPoint) => {
    const topic = '';
    // Array.isArray(prayerPoint.linkedTopics)
    // ? `#${prayerPoint.linkedTopics.find((t) => t.id === prayerPoint.id)?.title ?? ''}`
    // : '';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(prayerPoint);
    return acc;
  }, {});

  return prayerPoints.length > 0 ? (
    <ThemedView style={[styles.prayerPointsContainer, { borderColor }]}>
      <View style={styles.titleHeader}>
        <ThemedText style={styles.prayerPointsText}>Prayer Points</ThemedText>
        {isSectionEditable && (
          <TouchableOpacity onPress={handleEdit} style={styles.editContainer}>
            {!isEditMode && (
              <ThemedView style={styles.editButton}>
                <Entypo name="edit" size={10} color={Colors.white} />
              </ThemedView>
            )}
            <ThemedText style={styles.editText}>
              {!isEditMode ? 'Edit' : 'Done'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {Object.entries(groupedPrayerPoints).map(
        ([topic, points], groupIndex) => (
          <View key={topic} style={styles.innerContainer}>
            {topic && <Text style={styles.topicHeader}>{topic}</Text>}
            {groupIndex >= 0 && topic && (
              <View style={[styles.divider, { backgroundColor: textColor }]} />
            )}
            {points.map((prayerPoint: PrayerPoint, index) => (
              <EditablePrayerCard
                key={prayerPoint.id}
                prayer={prayerPoint}
                editable={isPrayerCardsEditable}
                onDelete={() => handleDelete(prayerPoint.id)}
                onChange={(updatedPrayerPoint) => {
                  const updatedData = updatedPrayerPoints.map((point) =>
                    point.id === prayerPoint.id ? updatedPrayerPoint : point,
                  );
                  setUpdatedPrayerPoints(updatedData);
                  onChange?.(updatedData);
                }}
                maxLines={3}
                index={index}
                showDate={isPrayerCardsEditable ? false : true}
              />
            ))}
            {topic && <View style={styles.spacer} />}
          </View>
        ),
      )}
    </ThemedView>
  ) : (
    <ThemedView
      style={[styles.prayerPointsContainer, { borderColor: Colors.secondary }]}
    >
      <View style={styles.titleHeader}>
        <ThemedText style={styles.prayerPointsText}>Prayer Points</ThemedText>
      </View>
      <ContentUnavailable
        errorTitle="No Prayer Points"
        errorMessage="There are currently no prayer points available."
        textAlign="flex-start"
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  divider: {
    backgroundColor: Colors.light.textPrimary,
    height: 1,
    marginVertical: 0,
    width: '100%',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.textPrimary,
    borderRadius: 12,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  editContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  editText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  innerContainer: {
    gap: 10,
  },
  prayerPointsContainer: {
    borderRadius: 15,
    borderWidth: 1.5,
    gap: 15,
    padding: 25,
    width: '100%',
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
  topicHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  spacer: {
    height: 3,
    width: '100%',
  },
});

export default PrayerPointSection;
