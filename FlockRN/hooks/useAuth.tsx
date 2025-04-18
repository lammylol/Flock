import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  FirebaseAuthTypes,
  signOut,
  getAuth,
} from '@react-native-firebase/auth'; // Using react-native-firebase auth
import { userService } from '@/services/userService';
import { UserProfileResponse } from '@/types/firebase';

export default function useAuth() {
  // State for storing the user
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );

  // State for tracking whether the user is authenticated
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listener for auth state changes
    const unsubscribe = onAuthStateChanged(
      getAuth(),
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (firebaseUser) {
          // Fetch the user profile if authenticated
          const userProfile = await userService.getUser(firebaseUser.uid);
          setUserProfile(userProfile);
          setUser(firebaseUser);
          setUserIsAuthenticated(true);
        } else {
          // Reset user state if not authenticated
          setUser(null);
          setUserProfile(null);
          setUserIsAuthenticated(false);
        }
      },
    );

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, userProfile, userIsAuthenticated, signOut: handleSignOut };
}
