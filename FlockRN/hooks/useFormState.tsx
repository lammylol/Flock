import { EditMode } from '@/types/ComponentProps';
import { Privacy } from '@/types/PrayerSubtypes';
import { useReducer, useState } from 'react';

export interface UseFormStateProps {
  editMode: EditMode;
}

export interface FormState {
  isEditMode: boolean;
  privacy: Privacy;
}

// TODO: we can refactor this to use a reducer
const useFormState = ({ editMode }: UseFormStateProps) => {
  const initialState = {
    isEditMode: editMode === EditMode.EDIT,
    privacy: 'private' as 'public' | 'private',
  } as FormState;

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmissionLoading, setIsSubmissionLoading] = useState(false);

  type Action =
    | { type: 'SET_EDIT_MODE'; payload: boolean }
    | { type: 'SET_PRIVACY'; payload: 'public' | 'private' };

  const reducer = (state: typeof initialState, action: Action) => {
    switch (action.type) {
      case 'SET_EDIT_MODE':
        return { ...state, isEditMode: action.payload };
      case 'SET_PRIVACY':
        return { ...state, privacy: action.payload };
      default:
        return state;
    }
  };

  const [formState, dispatch] = useReducer(reducer, initialState);

  return {
    formState,
    isDataLoading,
    isDeleting,
    isSubmissionLoading,
    setIsEditMode: (isEditMode: boolean) =>
      dispatch({ type: 'SET_EDIT_MODE', payload: isEditMode }),
    setPrivacy: (privacy: 'public' | 'private') =>
      dispatch({ type: 'SET_PRIVACY', payload: privacy }),
    setIsDataLoading,
    setIsDeleting,
    setIsSubmissionLoading,
  };
};
export default useFormState;
