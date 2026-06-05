import React from 'react';
import { View, Text, Platform, StatusBar } from 'react-native';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography } from '../theme';

export default function OfflineBanner() {
  const { isOffline } = useApp();

  if (!isOffline) return null;

  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: topOffset,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: colors.ink2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s6,
        paddingVertical: spacing.s8,
        paddingHorizontal: spacing.s16,
      }}
    >
      <Icon name="alert" size={14} color={colors.white} />
      <Text
        style={{
          color: colors.white,
          fontSize: typography.fz13,
          fontWeight: typography.fw5,
        }}
      >
        인터넷 연결이 없습니다
      </Text>
    </View>
  );
}
