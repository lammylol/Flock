import { EditMode } from '@/types/ComponentProps';
import { Privacy } from '@/types/PrayerSubtypes';
import { useReducer } from 'react';

export interface UseFormStateProps {
  editMode: EditMode;
}

export interface FormState {
  isEditMode: boolean;
  isDataLoading: boolean;
  isSubmissionLoading: boolean;
  privacy: Privacy;
}

// TODO: we can refactor this to use a reducer
const useFormState = ({ editMode }: UseFormStateProps) => {
  const initialState = {
    isEditMode: editMode === EditMode.EDIT,
    isDataLoading: false,
    isSubmissionLoading: false,
    privacy: 'private' as 'public' | 'private',
  } as FormState;

  type Action =
    | { type: 'SET_EDIT_MODE'; payload: boolean }
    | { type: 'SET_DATA_LOADING'; payload: boolean }
    | { type: 'SET_SUBMISSION_LOADING'; payload: boolean }
    | { type: 'SET_PRIVACY'; payload: 'public' | 'private' };

  const reducer = (state: typeof initialState, action: Action) => {
    switch (action.type) {
      case 'SET_EDIT_MODE':
        return { ...state, isEditMode: action.payload };
      case 'SET_DATA_LOADING':
        return { ...state, isLoading: action.payload };
      case 'SET_SUBMISSION_LOADING':
        return { ...state, isSubmissionLoading: action.payload };
      case 'SET_PRIVACY':
        return { ...state, privacy: action.payload };
      default:
        return state;
    }
  };

  const [formState, dispatch] = useReducer(reducer, initialState);

  return {
    formState,
    setIsEditMode: (isEditMode: boolean) =>
      dispatch({ type: 'SET_EDIT_MODE', payload: isEditMode }),
    setIsDataLoading: (isLoading: boolean) =>
      dispatch({ type: 'SET_DATA_LOADING', payload: isLoading }),
    setIsSubmissionLoading: (isLoading: boolean) =>
      dispatch({ type: 'SET_SUBMISSION_LOADING', payload: isLoading }),
    setPrivacy: (privacy: 'public' | 'private') =>
      dispatch({ type: 'SET_PRIVACY', payload: privacy }),
  };
};
export default useFormState;
