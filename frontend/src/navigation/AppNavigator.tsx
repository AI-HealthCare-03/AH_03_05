import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { View } from 'react-native';
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

const RootStack = createNativeStackNavigator<RootStackParams>();
const noHeader = { headerShown: false };

const linking: LinkingOptions<any> = {
  prefixes: ['https://medipt.app', 'medipt://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
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
              DrugDosage: 'records/dosage',
              DrugDetail: 'records/drug/:drugId',
            },
          },
          GuideTab: {
            screens: {
              GuideResult: 'guide',
              GuideLoading: 'guide/guide-loading',
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

export default function AppNavigator() {
  const { isReady, user } = useApp();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { type?: string; meal?: string };
      if (data?.type === 'medication' && navigationRef.isReady()) {
        navigationRef.navigate('MedicationAlarm', {
          meal: (data.meal ?? 'morning') as 'morning' | 'lunch' | 'dinner',
        });
      }
    });
    return () => sub.remove();
  }, []);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  const initialRoute: keyof RootStackParams = !user.loggedIn ? "Auth" : !user.profileComplete ? "Onboarding" : "Main";

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator screenOptions={noHeader} initialRouteName={initialRoute}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen name="UploadModal" component={UploadModalScreen} options={{ presentation: 'transparentModal' }} />
        <RootStack.Screen name="MedicationAlarm" component={MedicationAlarmScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
