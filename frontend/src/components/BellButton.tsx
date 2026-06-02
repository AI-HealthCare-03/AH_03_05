import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import { colors, radii, shadows, spacing } from '../theme';

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
          <Text style={{ fontSize: 8, color: colors.white, fontWeight: '700', lineHeight: 12 }}>
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
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.card,
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
