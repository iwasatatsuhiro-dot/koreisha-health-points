import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { pushApi } from '@/src/services/api/endpoints';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      // Expo Go / development without EAS project: return a mock device token
      return `mock-token-${Platform.OS}-${Date.now()}`;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch {
    return null;
  }
}

export function usePushRegistration(kkpId: string | null | undefined) {
  const registered = useRef(false);
  useEffect(() => {
    if (!kkpId || registered.current) return;
    registered.current = true;
    (async () => {
      const token = await registerForPushAsync();
      if (token) {
        try {
          await pushApi.registerToken(kkpId, token);
        } catch {
          // Silent failure — token will be retried on next app launch
        }
      }
    })();
  }, [kkpId]);
}
