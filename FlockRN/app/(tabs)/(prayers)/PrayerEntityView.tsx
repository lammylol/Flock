// components/Prayer/PrayerEntityView.tsx
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { auth } from '@/firebase/firebaseConfig';
import { AnyPrayerEntity, Prayer, PrayerPoint } from '@/types/firebase';

type Props = {
  entityId: string;
  entityType: EntityType;
  getEntityById: (id: string) => Promise<PrayerPoint | Prayer>;
  editRoute: string;
  updateCollection: (data: AnyPrayerEntity, type: EntityType) => void;
  removeFromCollection: (id: string, type: EntityType) => void;
};

const PrayerEntityView = ({
  entityId,
  entityType,
  getEntityById,
  editRoute,
  updateCollection,
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [entity, setEntity] = useState<Prayer | PrayerPoint | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  setIsDeleting(false); // temp

  const user = auth.currentUser;
  const isOwner = entity?.authorId === user?.uid;

  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');

  const fetchEntity = useCallback(async () => {
    try {
      const data = await getEntityById(entityId);
      if (data) {
        updateCollection(data, entityType);
        setEntity(data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load content. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [entityId, entityType, getEntityById, updateCollection]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntity();
  };

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [entity]);

  const handleEdit = () => {
    if (!entity) return;
    router.push({
      pathname: editRoute as string,
      params: {
        id: entity.id,
        editMode: EditMode.EDIT,
      },
    });
  };

  const formattedDate = entity?.createdAt
    ? new Date(
        entity.createdAt?.seconds
          ? entity.createdAt.seconds * 1000
          : entity.createdAt,
      ).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, 'background') },
      ]}
    >
      <ThemedScrollView
        style={styles.scrollView}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {error ? (
          <ContentUnavailable
            errorTitle="Content Unavailable"
            errorMessage={error}
          />
        ) : isDeleting ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ContentUnavailable
              errorTitle="Deleting"
              errorMessage={`Your ${entityType} is being deleted.`}
            />
          </>
        ) : entity ? (
          <>
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
              }}
            />
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created on: {formattedDate}
            </ThemedText>

            <PrayerContent
              editMode={EditMode.VIEW}
              prayer={entity ? (entity as Prayer | PrayerPoint) : undefined}
              prayerOrPrayerPoint={entityType}
              backgroundColor={backgroundColor}
            />

            <View style={styles.spacer} />
          </>
        ) : (
          <ActivityIndicator size="large" color={Colors.primary} />
        )}
      </ThemedScrollView>

      {/* {!error && entity && isOwner && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
        </TouchableOpacity>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  createdAtText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 0,
    paddingLeft: 20,
  },
  // deleteButton: {
  //   alignItems: 'center',
  //   backgroundColor: Colors.purple,
  //   borderRadius: 12,
  //   marginBottom: 20,
  //   marginHorizontal: 20,
  //   paddingVertical: 16,
  // },
  // deleteButtonText: {
  //   color: Colors.white,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
});

export default PrayerEntityView;
