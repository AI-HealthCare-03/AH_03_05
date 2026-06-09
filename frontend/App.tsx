import React, { useEffect } from 'react';
import { Platform, Appearance, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import Toast from './src/components/Toast';
import OfflineBanner from './src/components/OfflineBanner';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>오류가 발생했습니다. 앱을 재시작해주세요.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

// 앱이 라이트 모드 전용 — 웹은 index.html meta color-scheme으로 처리
if (Platform.OS !== 'web') {
  Appearance.setColorScheme('light');
}

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
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <AppNavigator />
          <Toast />
          <OfflineBanner />
        </AppProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
