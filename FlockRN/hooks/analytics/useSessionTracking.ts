import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

let sessionStart = 0;

export function useSessionTracking() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const startSession = () => {
    sessionStart = Date.now();
  };

  const endSession = useCallback(async () => {
    if (sessionStart) {
      const duration = Math.floor((Date.now() - sessionStart) / 1000); // seconds
      await logEvent(getAnalytics(), 'session_end', {
        duration_seconds: duration,
      });
    }
    sessionStart = 0;
  }, []);

  useEffect(() => {
    const onChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        startSession();
      }

      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        endSession();
      }

      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', onChange);

    startSession(); // app launched

    return () => {
      sub.remove();
      endSession(); // app closed
    };
  }, [endSession]);
}
