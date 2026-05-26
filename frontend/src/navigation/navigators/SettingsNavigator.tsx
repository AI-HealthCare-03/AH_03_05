import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../types';
import SettingsScreen from '../../screens/settings/SettingsScreen';
import { NotificationSettingsScreen } from '../../screens/settings/NotificationSettingsScreen';
import { HealthProfileEditScreen } from '../../screens/settings/HealthProfileEditScreen';
import { NotificationsScreen } from '../../screens/settings/NotificationsScreen';
import { PasswordChangeScreen } from '../../screens/settings/PasswordChangeScreen';
import { DeviceManagementScreen } from '../../screens/settings/DeviceManagementScreen';
import { LegalDocScreen } from '../../screens/settings/LegalDocScreen';
import { DeleteAccountScreen } from '../../screens/settings/DeleteAccountScreen';
import { ConsentHistoryScreen } from '../../screens/settings/ConsentHistoryScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParams>();
const noHeader = { headerShown: false };

export default function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={noHeader}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <SettingsStack.Screen name="HealthProfileEdit" component={HealthProfileEditScreen} />
      <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
      <SettingsStack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      <SettingsStack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
      <SettingsStack.Screen name="LegalDoc" component={LegalDocScreen} />
      <SettingsStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <SettingsStack.Screen name="ConsentHistory" component={ConsentHistoryScreen} />
    </SettingsStack.Navigator>
  );
}
