import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import PrayerPointCard from './PrayerPointCard';
import { Entypo } from '@expo/vector-icons'; // Ensure this import is correct and matches your project setup
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  onChange?: (prayerPoints: PrayerPoint[]) => void;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  onChange,
}) => {
  const [isEditMode, setEditMode] = useState(false);
  const [data, setData] = useState(prayerPoints);

  useEffect(() => {
    setData(prayerPoints);
  }, [prayerPoints]); // Update data when prayerPoints change

  const handleEdit = () => {
    setEditMode((isEditMode) => !isEditMode);
    onChange?.(data);
  };

  const handleDelete = (id: string) => {
    const prayerPointsFiltered = prayerPoints.filter(
      (prayerPoint) => prayerPoint.id != id,
    );
    setData(prayerPointsFiltered);
    onChange?.(data);
  };

  // This function is called when the order of prayer points changes
  const handleDragEnd = ({ data }) => {
    setData(data);
  };

  return prayerPoints.length > 0 ? (
    <ThemedView
      style={[styles.prayerPointsContainer, { borderColor: Colors.secondary }]}
    >
      <View style={styles.titleHeader}>
        <ThemedText style={styles.prayerPointsText}>Prayer Points</ThemedText>
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
      </View>
      {isEditMode ? (
        // Edit mode: render prayer points as cards
        // Draggable mode: render prayer points with drag functionality
        <GestureHandlerRootView>
          <DraggableFlatList
            scrollEnabled={false}
            data={data}
            renderItem={({ item, drag }) => (
              <PrayerPointCard
                key={item.id}
                title={item.title}
                content={item.content}
                isEditMode={isEditMode}
                drag={drag}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
          />
        </GestureHandlerRootView>
      ) : (
        data.map((prayerPoint: PrayerPoint) => (
          <PrayerPointCard
            key={prayerPoint.id}
            title={prayerPoint.title}
            content={prayerPoint.content}
            isEditMode={isEditMode}
          />
        ))
      )}
    </ThemedView>
  ) : (
    // If no prayer points are available, show a content unavailable message
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
    gap: 5,
  },
  editText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerPointsContainer: {
    borderRadius: 15,
    borderWidth: 1,
    gap: 15,
    padding: 25,
    width: '100%', // Make it responsive to parent width
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