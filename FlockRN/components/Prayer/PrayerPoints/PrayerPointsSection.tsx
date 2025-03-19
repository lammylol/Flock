import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from 'constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@/types/firebase';
import { ThemedView } from '@/components/ThemedView';
import PrayerPointCard from './PrayerPointCard';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  isEditable: boolean;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  ieEditable,
}) => {
  return (
    prayerPoints && (
      <ThemedView
        style={[
          styles.prayerPointsContainer,
          { borderColor: Colors.secondary },
        ]}
      >
        <ThemedText
          lightColor={Colors.light.textSecondary}
          darkColor={Colors.dark.textPrimary}
          style={styles.prayerPointsText}
        >
          Prayer Points
        </ThemedText>
        {prayerPoints.map((prayerPoint: PrayerPoint) => (
          <PrayerPointCard
            key={prayerPoint.id}
            title={prayerPoint.title}
            content={prayerPoint.content}
          />
        ))}
      </ThemedView>
    )
  );
};

const styles = StyleSheet.create({
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
});
