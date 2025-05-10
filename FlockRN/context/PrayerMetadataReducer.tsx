import { LinkedPrayerPointPair, EditMode } from '@/types/ComponentProps';
import {
  PartialLinkedPrayerEntity,
  Prayer,
  PrayerPoint,
} from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';

// types/PrayerMetadataReducer.ts
type PrayerMetadataAction =
  | { type: 'SET_PRAYER'; payload: Prayer }
  | { type: 'UPDATE_PRAYER'; payload: Partial<Prayer> }
  | { type: 'SET_PRAYER_POINTS'; payload: PrayerPoint[] }
  | { type: 'UPDATE_PRAYER_POINT'; payload: PrayerPoint }
  | { type: 'SET_LINKED_PAIRS'; payload: LinkedPrayerPointPair[] }
  | { type: 'ADD_LINKED_PAIR'; payload: LinkedPrayerPointPair }
  | { type: 'SET_SIMILAR_PRAYERS'; payload: PartialLinkedPrayerEntity[] }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'RESET' };

interface PrayerMetadataState {
  prayer: Prayer;
  prayerPoints: PrayerPoint[];
  linkedPrayerPairs: LinkedPrayerPointPair[];
  editMode: EditMode;
  similarPrayers: PartialLinkedPrayerEntity[];
}

const initialState: PrayerMetadataState = {
  prayer: {
    id: '', // only temporary
    content: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: 'unknown',
    authorId: 'unknown',
    privacy: 'private',
    prayerPoints: [],
    entityType: EntityType.Prayer,
  },
  prayerPoints: [],
  linkedPrayerPairs: [],
  editMode: EditMode.EDIT,
  similarPrayers: [],
};

function reducer(
  state: PrayerMetadataState,
  action: PrayerMetadataAction,
): PrayerMetadataState {
  switch (action.type) {
    case 'SET_PRAYER':
      return { ...state, prayer: action.payload };
    case 'UPDATE_PRAYER':
      return {
        ...state,
        prayer: {
          ...state.prayer,
          ...action.payload,
          prayerPoints:
            action.payload.prayerPoints ?? state.prayer.prayerPoints,
        },
      };
    case 'SET_PRAYER_POINTS':
      return { ...state, prayerPoints: action.payload };
    case 'UPDATE_PRAYER_POINT': {
      console.log('Updating prayer point:', action.payload);
      return {
        ...state,
        prayerPoints: state.prayerPoints.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p,
        ),
      };
    }
    case 'SET_LINKED_PAIRS':
      return { ...state, linkedPrayerPairs: action.payload };
    case 'ADD_LINKED_PAIR':
      const newPair = action.payload;
      return {
        ...state,
        linkedPrayerPairs: [
          ...state.linkedPrayerPairs.filter(
            (pair) => pair.prayerPoint.id !== newPair.prayerPoint.id,
          ),
          newPair,
        ],
      };
    case 'SET_SIMILAR_PRAYERS':
      const similarPrayers = action.payload;
      return {
        ...state,
        prayerPoints: state.prayerPoints.map((point) => {
          // Find the similar prayers based on the id of the prayer point
          const matches = similarPrayers.filter((p) => p.id === point.id);

          // Return a new prayer point with similarPrayers added in the ui field
          return {
            ...point,
            ui: {
              similarPrayers: matches, // Add the matched prayers to the ui field
            },
          };
        }),
      };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export { reducer, initialState, PrayerMetadataAction, PrayerMetadataState };
