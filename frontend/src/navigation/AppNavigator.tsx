// AppNavigator.tsx
// Replaces hash-based router from app.jsx.
// Structure:
//   Root Stack
//     ├── Auth Stack (Login, Signup, ForgotPassword)
//     ├── Onboarding Stack
//     ├── Main Tab Navigator
//     │     ├── Home Stack (Home → OCR flow → Guide flow)
//     │     ├── Records Stack (RecordList → RecordDetail → DrugDosage)
//     │     ├── Chat Stack (ChatList → ChatSession)
//     │     └── Settings Stack (Settings → sub-screens)
//     └── Notifications (modal)

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Sidebar from '../components/Sidebar';

import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { colors, spacing, radii } from '../theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

// Auth — all three screens live in LoginScreen.tsx
import LoginScreen, { SignupScreen, ForgotPasswordScreen } from '../screens/auth/LoginScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Home
import HomeScreen from '../screens/home/HomeScreen';

// OCR — all four screens live in OCRProcessingScreen.tsx
import OCRProcessingScreen, {
  OCRResultScreen,
  DrugSearchScreen,
  DrugDosageScreen,
} from '../screens/ocr/OCRProcessingScreen';

// Records — both screens live in RecordListScreen.tsx
import RecordListScreen, { RecordDetailScreen } from '../screens/records/RecordListScreen';

// Guide — both screens live in GuideLoadingScreen.tsx
import GuideLoadingScreen, { GuideResultScreen } from '../screens/guide/GuideLoadingScreen';

// Chat — both screens live in ChatListScreen.tsx
import ChatListScreen, { ChatSessionScreen } from '../screens/chat/ChatListScreen';

// Settings — all sub-screens live in SettingsScreen.tsx
import SettingsScreen, {
  NotificationSettingsScreen,
  ProfileEditScreen,
  PersonalInfoScreen,
  NotificationsScreen,
  PasswordChangeScreen,
  DeviceManagementScreen,
  LegalDocScreen,
  DeleteAccountScreen,
  ConsentHistoryScreen,
} from '../screens/settings/SettingsScreen';

// ─── Navigator types ──────────────────────────────────────────────────────────

export type AuthStackParams = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParams = {
  OnboardingStep: { step?: number };
};

export type HomeStackParams = {
  Home: undefined;
  OCRProcessing: undefined;
  OCRResult: undefined;
  DrugSearch: undefined;
  DrugDosage: undefined;
  GuideLoading: undefined;
  GuideResult: undefined;
};

export type RecordsStackParams = {
  RecordList: undefined;
  RecordDetail: { recordId: string };
  DrugDosage: undefined;
};

export type ChatStackParams = {
  ChatList: undefined;
  ChatSession: { chatId: string };
};

export type SettingsStackParams = {
  Settings: undefined;
  NotificationSettings: undefined;
  ProfileEdit: undefined;
  PersonalInfo: undefined;
  Notifications: undefined;
  PasswordChange: undefined;
  DeviceManagement: undefined;
  LegalDoc: { docKey: 'tos' | 'privacy' | 'sensitive' };
  DeleteAccount: undefined;
  ConsentHistory: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const GuideStack = createNativeStackNavigator();

function GuideNavigator() {
  return (
    <GuideStack.Navigator screenOptions={noHeader}>
      <GuideStack.Screen name="GuideLoading" component={GuideLoadingScreen} />
      <GuideStack.Screen name="GuideResult" component={GuideResultScreen} />
    </GuideStack.Navigator>
  );
}

// ─── Stacks ───────────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParams>();
const AuthStack = createNativeStackNavigator<AuthStackParams>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParams>();
const HomeStack = createNativeStackNavigator<HomeStackParams>();
const RecordsStack = createNativeStackNavigator<RecordsStackParams>();
const ChatStack = createNativeStackNavigator<ChatStackParams>();
const SettingsStack = createNativeStackNavigator<SettingsStackParams>();
const Tab = createBottomTabNavigator();

const noHeader = { headerShown: false };

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={noHeader}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={noHeader}>
      <OnboardingStack.Screen name="OnboardingStep" component={OnboardingScreen} initialParams={{ step: 1 }} />
    </OnboardingStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={noHeader}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="OCRProcessing" component={OCRProcessingScreen} />
      <HomeStack.Screen name="OCRResult" component={OCRResultScreen} />
      <HomeStack.Screen name="DrugSearch" component={DrugSearchScreen} />
      <HomeStack.Screen name="DrugDosage" component={DrugDosageScreen} />
      <HomeStack.Screen name="GuideLoading" component={GuideLoadingScreen} />
      <HomeStack.Screen name="GuideResult" component={GuideResultScreen} />
    </HomeStack.Navigator>
  );
}

function RecordsNavigator() {
  return (
    <RecordsStack.Navigator screenOptions={noHeader}>
      <RecordsStack.Screen name="RecordList" component={RecordListScreen} />
      <RecordsStack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <RecordsStack.Screen name="DrugDosage" component={DrugDosageScreen} />
    </RecordsStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={noHeader}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatSession" component={ChatSessionScreen} />
    </ChatStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={noHeader}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <SettingsStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <SettingsStack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
      <SettingsStack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      <SettingsStack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
      <SettingsStack.Screen name="LegalDoc" component={LegalDocScreen} />
      <SettingsStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <SettingsStack.Screen name="ConsentHistory" component={ConsentHistoryScreen} />
    </SettingsStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View>
      <Icon
        name={name}
        size={22}
        color={focused ? colors.accent : colors.muted}
      />
    </View>
  );
}

function TabNavigator() {
  const { isDesktop } = useBreakpoint();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop ? { display: 'none' } : {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsNavigator}
        options={{
          title: '기록',
          tabBarIcon: ({ focused }) => <TabIcon name="doc" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GuideTab"
        component={GuideNavigator}
        options={{
          title: '가이드',
          tabBarIcon: ({ focused }) => <TabIcon name="wand" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          title: '상담',
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: '마이',
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { isDesktop } = useBreakpoint();
  const { notifications } = useApp();
  const unread = notifications.some(n => n.unread);

  if (!isDesktop) {
    return <TabNavigator />;
  }

  return (
    <View style={nav.desktopShell}>
      <Sidebar />
      <View style={nav.desktopContent}>
        <TabNavigator />
      </View>
    </View>
  );
}

const nav = StyleSheet.create({
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.canvas,
  },
  desktopContent: {
    flex: 1,
    overflow: 'hidden' as const,
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user } = useApp();

  const initialRoute: keyof RootStackParams =
    !user.loggedIn ? 'Auth' :
    !user.profileComplete ? 'Onboarding' :
    'Main';

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={noHeader} initialRouteName={initialRoute}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
