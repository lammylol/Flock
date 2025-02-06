// Purpose: Create a context for user authentication. This context will be used to provide user
// authentication information to the entire application.

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

// Context Type for AuthContext
interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
}

// Create a context
export const AuthContext = createContext<AuthContextType | null>(null);

// Define provider props - ensures proper usage of AuthProvider.
interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export context for use in useAuthContext
export { AuthProvider };
