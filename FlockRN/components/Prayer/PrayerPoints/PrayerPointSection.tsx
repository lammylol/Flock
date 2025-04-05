// PrayerPointSection.tsx - Updated component with revised layout
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { PrayerPoint } from '@/types/firebase';

// Define available prayer point types
export type PrayerPointType = 'request' | 'praise' | 'repentance';

interface PrayerPointSectionProps {
  prayerPoints: PrayerPoint[];
  onChange: (updatedPrayerPoints: PrayerPoint[]) => void;
}

const PrayerPointSection: React.FC<PrayerPointSectionProps> = ({
  prayerPoints,
  onChange,
}) => {
  // Toggle a type for a specific prayer point
  const toggleType = (pointIndex: number, type: PrayerPointType) => {
    const updatedPoints = [...prayerPoints];
    const point = { ...updatedPoints[pointIndex] };
    
    // Initialize types array if it doesn't exist
    if (!point.types) {
      point.types = [];
    }
    
    // Toggle the type (add if not present, remove if present)
    if (point.types.includes(type)) {
      point.types = point.types.filter(t => t !== type);
    } else {
      point.types = [...point.types, type];
    }
    
    updatedPoints[pointIndex] = point;
    onChange(updatedPoints);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Prayer Points</ThemedText>
      
      {prayerPoints.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          No prayer points detected. AI will analyze your prayer content automatically.
        </ThemedText>
      ) : (
        <View style={styles.pointsContainer}>
          {prayerPoints.map((point, index) => (
            <View key={point.id || index} style={styles.pointItem}>
              {/* Title is first */}
              <ThemedText style={styles.pointTitle}>
                {point.title || 'Untitled'}
              </ThemedText>
              
              {/* Content follows the title */}
              <ThemedText style={styles.pointContent}>
                {point.content}
              </ThemedText>
              
              {/* Type bubbles are at the bottom */}
              <View style={styles.typeContainer}>
                <TypeBubble 
                  label="Request" 
                  isSelected={point.types?.includes('request')} 
                  onPress={() => toggleType(index, 'request')}
                />
                <TypeBubble 
                  label="Praise" 
                  isSelected={point.types?.includes('praise')} 
                  onPress={() => toggleType(index, 'praise')}
                />
                <TypeBubble 
                  label="Repentance" 
                  isSelected={point.types?.includes('repentance')} 
                  onPress={() => toggleType(index, 'repentance')}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface TypeBubbleProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const TypeBubble: React.FC<TypeBubbleProps> = ({ label, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.typeBubble,
        isSelected ? styles.selectedBubble : styles.unselectedBubble,
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.typeBubbleText,
          isSelected ? styles.selectedBubbleText : styles.unselectedBubbleText,
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  pointsContainer: {
    gap: 16,
  },
  pointItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    gap: 10, // Add spacing between elements
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  pointContent: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 10, // Add bottom margin to separate from tags
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the bubbles horizontally
    gap: 10, // Increased spacing between bubbles
    marginTop: 4, // Add a bit of space at the top
  },
  typeBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1.5, // Add outline to bubbles
    minWidth: 90, // Set minimum width for consistent sizing
    alignItems: 'center', // Center text in bubble
  },
  selectedBubble: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple, // Matching border color when selected
  },
  unselectedBubble: {
    backgroundColor: 'transparent', // Clear background when not selected
    borderColor: Colors.purple, // Consistent border color for app
  },
  selectedBubbleText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  unselectedBubbleText: {
    color: Colors.purple, // Use purple text to match app style when unselected
    fontSize: 16,
  },
});

export default PrayerPointSection;