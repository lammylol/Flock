import { EditMode } from '@/types/ComponentProps';
import { useState } from 'react';

export interface UseFormStateProps {
  editMode: EditMode;
}
const useFormState = ({ editMode }: UseFormStateProps) => {
  const [isEditMode, setIsEditMode] = useState(editMode === EditMode.EDIT);
  const [isLoading, setIsLoading] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');

  return {
    isEditMode,
    setIsEditMode,
    isLoading,
    setIsLoading,
    privacy,
    setPrivacy,
  };
};
export default useFormState;
