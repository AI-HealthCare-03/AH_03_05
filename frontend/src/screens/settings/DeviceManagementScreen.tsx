import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp, defaultUser } from '../../context/AppContext';
import { authApi } from '../../api';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'DeviceManagement'>;

export function DeviceManagementScreen({ navigation }: { navigation: NavProp }) {
  const { user, setUser, flash } = useApp();
  const [loading, setLoading] = useState(false);

  const revokeAll = async () => {
    setLoading(true);
    try {
      await authApi.revokeAllDevices().catch(() => {});
      const rawFlags = await AsyncStorage.getItem('medipt_profile_flags').catch(() => null);
      const profileFlags: Record<string, boolean> = rawFlags ? JSON.parse(rawFlags) : {};
      profileFlags[user.email] = user.profileComplete;
      await AsyncStorage.setItem('medipt_profile_flags', JSON.stringify(profileFlags));
      await AsyncStorage.removeItem('medipt_user');
      setUser({ ...defaultUser });
      // loggedIn=false 전환 시 AppNavigator가 자동으로 Auth로 스왑
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="로그인 기기 관리"
      back
      onBack={() =>
        navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')
      }
      scrollable
    >
      <View style={{ marginBottom: spacing.s20 }}>
        <Text style={{ fontSize: typography.fz14, color: colors.muted, lineHeight: typography.lh22 }}>
          현재 기기를 포함한 모든 기기에서 로그아웃합니다.{'\n'}로그아웃 후 다시 로그인이 필요합니다.
        </Text>
      </View>
      <Button variant="danger" size="md" loading={loading} onPress={revokeAll} fullWidth>
        전체 기기 로그아웃
      </Button>
    </ScreenLayout>
  );
}

export default DeviceManagementScreen;
