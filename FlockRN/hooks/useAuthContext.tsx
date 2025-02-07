// Purpose: Create a custom hook to use the AuthContext.
// This hook will be used to access the user and set boundaries for use.

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default useAuthContext;
