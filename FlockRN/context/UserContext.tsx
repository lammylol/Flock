import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  userOptInFlagAsyncStorageKey,
  defaultUserOptInFlagState,
  UserOptInFlagsType,
  UserOptInFlags,
} from '@/types/UserFlags';

interface UserContextType {
  userOptInFlags: UserOptInFlagsType;
  updateUserOptInFlagState: (
    key: UserOptInFlags,
    value: boolean,
  ) => Promise<void>;
  toggleUserOptInFlagState: (key: UserOptInFlags) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userOptInFlags, setUserOptInFlags] = useState<UserOptInFlagsType>(
    defaultUserOptInFlagState,
  );

  useEffect(() => {
    const fetchUserOptInFlagState = async () => {
      try {
        const storedFlags = await AsyncStorage.getItem(
          userOptInFlagAsyncStorageKey,
        );
        if (storedFlags) {
          setUserOptInFlags(JSON.parse(storedFlags));
        } else {
          // Default feature flags if no stored flags are found
          setUserOptInFlags(defaultUserOptInFlagState);
        }
      } catch (error) {
        console.error('Error loading feature flags:', error);
      }
    };

    fetchUserOptInFlagState();
  }, []);

  const updateUserOptInFlagState = async (
    key: UserOptInFlags,
    value: boolean,
  ) => {
    try {
      if (userOptInFlags) {
        const updatedFlags = { ...userOptInFlags, [key]: value };
        await AsyncStorage.setItem(
          userOptInFlagAsyncStorageKey,
          JSON.stringify(updatedFlags),
        );
        setUserOptInFlags(updatedFlags);
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
    }
  };

  const toggleUserOptInFlagState = async (key: UserOptInFlags) => {
    if (userOptInFlags) {
      const newValue = !userOptInFlags[key];
      await AsyncStorage.setItem(key, newValue.toString());
      const updatedFlags = { ...userOptInFlags, [key]: newValue };
      setUserOptInFlags(updatedFlags);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userOptInFlags,
        updateUserOptInFlagState,
        toggleUserOptInFlagState,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
