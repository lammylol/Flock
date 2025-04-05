import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  userOptInFlagAsyncStorageKey,
  defaultUserOptInFlagState,
  UserOptInFlagsType,
  UserOptInFlags,
  UserIntroFlowType,
  defaultUserIntroFlowState,
  userIntroFlowAsyncStorageKey,
  UserIntroFlow,
} from '@/types/UserFlags';

interface UserContextType {
  userOptInFlags: UserOptInFlagsType;
  updateUserOptInFlagState: (
    key: UserOptInFlags,
    value: boolean,
  ) => Promise<void>;
  toggleUserOptInFlagState: (key: UserOptInFlags) => Promise<void>;
  userIntroFlowFlags: UserIntroFlowType;
  updateUserIntroFlowFlagState: (
    key: UserIntroFlow,
    value: boolean,
  ) => Promise<void>;
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
  const [userIntroFlowFlags, setUserIntroFlowFlags] =
    useState<UserIntroFlowType>(defaultUserIntroFlowState);

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
    const fetchUserIntroFlowFlagState = async () => {
      try {
        const storedFlags = await AsyncStorage.getItem(
          userIntroFlowAsyncStorageKey,
        );
        if (storedFlags) {
          setUserIntroFlowFlags(JSON.parse(storedFlags));
        } else {
          // Default feature flags if no stored flags are found
          setUserIntroFlowFlags(defaultUserIntroFlowState);
        }
      } catch (error) {
        console.error('Error loading feature flags:', error);
      }
    };

    fetchUserOptInFlagState();
    fetchUserIntroFlowFlagState();
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

      // Update the flag in the local state
      const updatedFlags = { ...userOptInFlags, [key]: newValue };
      setUserOptInFlags(updatedFlags);

      try {
        // Store the entire flags object in AsyncStorage under the userOptInFlagAsyncStorageKey
        await AsyncStorage.setItem(
          userOptInFlagAsyncStorageKey,
          JSON.stringify(updatedFlags),
        );
      } catch (error) {
        console.error('Error saving flags to AsyncStorage:', error);
      }
    }
  };

  const updateUserIntroFlowFlagState = async (
    key: UserIntroFlow,
    value: boolean,
  ) => {
    try {
      if (userIntroFlowFlags) {
        const updatedFlags = { ...userIntroFlowFlags, [key]: value };
        await AsyncStorage.setItem(
          userIntroFlowAsyncStorageKey,
          JSON.stringify(updatedFlags),
        );
        setUserIntroFlowFlags(updatedFlags);
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userOptInFlags,
        updateUserOptInFlagState,
        toggleUserOptInFlagState,
        userIntroFlowFlags,
        updateUserIntroFlowFlagState,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
