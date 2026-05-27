import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import Toast from './src/components/Toast';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Notifications.requestPermissionsAsync().catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'medication' && navigationRef.isReady()) {
        navigationRef.navigate('MedicationAlarm', { meal: data.meal });
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <AppProvider>
      <AppNavigator />
      <Toast />
    </AppProvider>
  );
}
