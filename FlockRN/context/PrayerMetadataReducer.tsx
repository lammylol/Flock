import { LinkedPrayerPointPair, EditMode } from '@/types/ComponentProps';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';

// types/PrayerMetadataReducer.ts
type PrayerMetadataAction =
  | { type: 'SET_PRAYER'; payload: Prayer }
  | { type: 'UPDATE_PRAYER'; payload: Partial<Prayer> }
  | { type: 'SET_PRAYER_POINTS'; payload: PrayerPoint[] }
  | {
    type: 'UPDATE_PRAYER_POINT_AT_INDEX';
    payload: { index: number; point: PrayerPoint };
  }
  | { type: 'SET_LINKED_PAIRS'; payload: LinkedPrayerPointPair[] }
  | { type: 'ADD_LINKED_PAIR'; payload: LinkedPrayerPointPair }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'RESET' };

interface PrayerMetadataState {
  prayer: Prayer;
  prayerPoints: PrayerPoint[];
  linkedPrayerPairs: LinkedPrayerPointPair[];
  editMode: EditMode;
}

const initialState: PrayerMetadataState = {
  prayer: {
    id: '',
    title: '',
    content: '',
    tags: [],
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
};

function reducer(
  state: PrayerMetadataState,
  action: PrayerMetadataAction,
): PrayerMetadataState {
  switch (action.type) {
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
    case 'UPDATE_PRAYER_POINT_AT_INDEX': {
      const updatedPoints = [...state.prayerPoints];
      updatedPoints[action.payload.index] = action.payload.point;
      console.log(
        'Updated prayer points at index:',
        action.payload.index,
        action.payload.point,
      );
      return {
        ...state,
        prayerPoints: updatedPoints,
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
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export { reducer, initialState, PrayerMetadataAction, PrayerMetadataState };
