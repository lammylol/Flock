// Created At: 2021-09-12 11:00:00
// This is the useAuth hook that will be used to authenticate users.

import { useEffect, useState } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { userService } from '@/services/userService';
import { UserProfileResponse } from '@/types/firebase';

export default function useAuth() {
  // State for storing the user
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );

  // State for tracking whether the user is authenticated
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userProfile = await userService.getUser(user.uid);
        setUserProfile(userProfile);
        setUser(user);
        setUserIsAuthenticated(true);
      } else {
        setUser(null);
        setUserIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, userIsAuthenticated, signOut };
}
