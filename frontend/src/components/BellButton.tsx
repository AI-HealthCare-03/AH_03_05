import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import { colors, spacing } from '../theme';

export default function BellButton() {
  const { unreadCount, setNotifDrawerOpen } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.bellBtn, { top: insets.top + spacing.s8 }]}
      onPress={() => setNotifDrawerOpen(true)}
    >
      <Icon name="bell" size={18} color={colors.ink2} />
      {unreadCount > 0 && (
        <View style={styles.bellBadge}>
          <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700', lineHeight: 12 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = {
  bellBtn: {
    position: 'absolute' as const,
    top: spacing.s16,
    right: spacing.s16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...(Platform.OS !== 'web'
      ? { shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }
      : { boxShadow: '0px 2px 8px rgba(15,23,42,0.05)' } as any),
    elevation: 2,
  },
  bellBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 2,
  },
};
