// PrayerPointSection.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import PrayerPointCard from './PrayerPointCard';
import { Entypo } from '@expo/vector-icons';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColor } from '@/hooks/useThemeColor';
import EditablePrayerPointCard from './PrayerPointCard';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  isEditable: boolean;
  onChange?: (prayerPoints: PrayerPoint[]) => void;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  isEditable,
  onChange,
}) => {
  const [isEditMode, setEditMode] = useState(false);
  const [data, setData] = useState(prayerPoints);
  const borderColor = useThemeColor({}, 'borderPrimary');

  useEffect(() => {
    setData(prayerPoints);
  }, [prayerPoints]);

  const handleEdit = () => {
    setEditMode((isEditMode) => !isEditMode);
    onChange?.(data);
  };

  const handleDelete = (id: string) => {
    const prayerPointsFiltered = data.filter(
      (prayerPoint) => prayerPoint.id !== id,
    );
    setData(prayerPointsFiltered);
    onChange?.(prayerPointsFiltered);
  };

  const handleDragEnd = ({ data }) => {
    setData(data);
    onChange?.(data);
  };

  return prayerPoints.length > 0 ? (
    <ThemedView style={[styles.prayerPointsContainer, { borderColor }]}>
      <View style={styles.titleHeader}>
        <ThemedText style={styles.prayerPointsText}>Prayer Points</ThemedText>
        {isEditable && (
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
      {isEditMode ? (
        <GestureHandlerRootView>
          <DraggableFlatList
            scrollEnabled={false}
            data={data}
            renderItem={({ item, drag }) => (
              <EditablePrayerPointCard
                key={item.id}
                prayerPoint={item}
                isEditMode={isEditMode}
                drag={drag}
                onDelete={() => handleDelete(item.id)}
                onChange={(updatedPrayerPoint) => {
                  const updatedData = data.map((point) =>
                    point.id === item.id ? updatedPrayerPoint : point,
                  );
                  setData(updatedData);
                  onChange?.(updatedData);
                }}
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
            prayerPoint={prayerPoint}
            isEditMode={isEditMode}
          />
        ))
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
});

export default PrayerPointSection;
