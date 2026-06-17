import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import type { RootStackParams } from './types';
import { navigationRef } from './navigationRef';
import AuthNavigator from './navigators/AuthNavigator';
import OnboardingNavigator from './navigators/OnboardingNavigator';
import MainNavigator from './navigators/TabNavigator';
import UploadModalScreen from '../screens/UploadModalScreen';
import MedicationAlarmScreen from '../screens/medication/MedicationAlarmScreen';
import { colors } from '../theme';
import Toast from '../components/Toast';
import { registerForPushNotificationsAsync } from '../utils/notifications';

const RootStack = createNativeStackNavigator<RootStackParams>();
const noHeader = { headerShown: false };

const prefixes = ['https://medipt.app', 'medipt://'];

// 로그아웃 상태에선 Auth 경로만 인식 — 보호 경로(/records 등) 딥링크는 매칭 실패 후
// Auth(로그인)로 안전 폴백한다. (트리에 없는 Main을 참조하면 링킹이 throw → 크래시)
const authLinking: LinkingOptions<any> = {
  prefixes,
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
    },
  },
};

const appLinking: LinkingOptions<any> = {
  prefixes,
  config: {
    screens: {
      Onboarding: {
        screens: {
          OnboardingStep: 'onboarding',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: '',
              OCRProcessing: 'ocr/processing',
              OCRResult: 'ocr/result',
              DrugCandidate: 'drug/candidate',
              DrugDosage: 'drug/dosage',
              DrugDetail: 'drug/:drugId',
              GuideLoading: 'guide/loading',
              GuideResult: 'guide/result',
            },
          },
          RecordsTab: {
            screens: {
              RecordList: 'records',
              RecordDetail: 'records/:recordId',
            },
          },
          GuideTab: {
            screens: {
              GuideResult: 'guide',
            },
          },
          ChatTab: {
            screens: {
              ChatList: 'chat',
              ChatSession: 'chat/:sessionId',
            },
          },
          SettingsTab: {
            screens: {
              Settings: 'settings',
              NotificationSettings: 'settings/notifications',
              HealthProfileEdit: 'settings/health-profile',
              Notifications: 'settings/notification-history',
              PasswordChange: 'settings/password',
              DeviceManagement: 'settings/devices',
              LegalDoc: 'settings/legal/:docKey',
              DeleteAccount: 'settings/delete-account',
              ConsentHistory: 'settings/consent',
              HealthProfileHistory: 'settings/health-profile-history',
            },
          },
        },
      },
      UploadModal: 'upload',
      MedicationAlarm: 'medication-alarm',
    },
  },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default function AppNavigator() {
  const { isReady, user } = useApp();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { type?: string; meal?: string };
      // MedicationAlarm은 로그인 상태에서만 트리에 마운트되므로, 미인증 시 navigate하면 no-op.
      // 로그인 상태에서만 진입을 시도한다.
      if (data?.type === 'medication' && user.loggedIn && navigationRef.isReady()) {
        navigationRef.navigate('MedicationAlarm', {
          meal: (data.meal ?? 'morning') as 'morning' | 'lunch' | 'dinner',
        });
      }
    });
    return () => sub.remove();
  }, [user.loggedIn]);

  // 로그인 상태가 되면 디바이스 푸시 토큰을 백엔드에 등록 (네이티브 실기기 전용)
  useEffect(() => {
    if (user.loggedIn) {
      void registerForPushNotificationsAsync();
    }
  }, [user.loggedIn]);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  // 인증 게이트는 loggedIn으로만 — 미인증이면 Auth만 트리에 존재해 URL 딥링크로도
  // 보호 화면에 도달할 수 없다. 로그인 후 첫 화면(Onboarding/Main)은 initialRouteName으로 결정.
  // (온보딩 '건너뛰기'는 profileComplete=false인 채 Main 진입이 필요하므로 게이트로 쓰지 않음)
  const initialRoute: keyof RootStackParams = user.profileComplete ? 'Main' : 'Onboarding';
  const linking = user.loggedIn ? appLinking : authLinking;

  return (
    <View style={styles.root}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <RootStack.Navigator
          key={user.loggedIn ? 'authed' : 'guest'}
          screenOptions={noHeader}
          initialRouteName={initialRoute}
        >
          {!user.loggedIn ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
              <RootStack.Screen name="Main" component={MainNavigator} />
              <RootStack.Screen
                name="UploadModal"
                component={UploadModalScreen}
                options={{ presentation: 'transparentModal' }}
              />
              <RootStack.Screen name="MedicationAlarm" component={MedicationAlarmScreen} />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
      <Toast />
    </View>
  );
}
