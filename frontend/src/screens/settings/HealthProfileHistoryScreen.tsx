import React from 'react';
import ScreenLayout from '../../components/ScreenLayout';
import EmptyState from '../../components/EmptyState';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'HealthProfileHistory'>;

export function HealthProfileHistoryScreen({ navigation }: { navigation: NavProp }) {
  return (
    <ScreenLayout
      title="건강 프로필 변경 이력"
      back
      onBack={() =>
        navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')
      }
      scrollable
    >
      <EmptyState
        icon="list"
        title="변경 이력이 없습니다"
        message="건강 프로필을 수정하면 이곳에 기록이 표시됩니다."
      />
    </ScreenLayout>
  );
}

export default HealthProfileHistoryScreen;
