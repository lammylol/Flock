// Purpose: Create a context for user authentication. This context will be used to provide user
// authentication information to the entire application.

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  FirebaseAuthTypes,
  onAuthStateChanged,
  signOut,
} from '@react-native-firebase/auth';
import { UserProfileResponse } from '@/types/firebase';
import { auth } from '@/firebase/firebaseConfig';
import { userService } from '@/services/userService';

// Context type
interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfileResponse | null;
  userIsAuthenticated: boolean;
  isAuthLoading: boolean;
  signOutUser: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await userService.getUser(user.uid);
        setUser(user);
        setUserProfile(profile);
        setUserIsAuthenticated(true);
      } else {
        setUser(null);
        setUserProfile(null);
        setUserIsAuthenticated(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        userIsAuthenticated,
        isAuthLoading,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export context for use in useAuthContext
export { AuthContext };
