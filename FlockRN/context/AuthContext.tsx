// Purpose: Create a context for user authentication. This context will be used to provide user
// authentication information to the entire application.

import React, { createContext, useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import { User } from '@firebase/auth';

// Context Type for AuthContext
interface AuthContextType {
  user: User | null;
  userIsAuthenticated: boolean;
  isAuthLoading: boolean;
}

// Create a context
const AuthContext = createContext<AuthContextType | null>(null);

// Define provider props - ensures proper usage of AuthProvider.
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { user, userIsAuthenticated } = useAuth();

  useEffect(() => {
    // Update isAuthLoading after the authentication process has completed
    setIsAuthLoading(false);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userIsAuthenticated, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export context for use in useAuthContext
export { AuthContext };
