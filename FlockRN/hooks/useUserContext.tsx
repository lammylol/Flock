import { UserContext } from '@/context/UserContext';
import { useContext } from 'react';

export default function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }

  return context;
}
