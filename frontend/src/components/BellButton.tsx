// src/components/BellButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import NotificationDrawer from './NotificationDrawer';
import { colors } from '../theme';

export default function BellButton() {
  const { notifications } = useApp();
  const [open, setOpen] = useState(false);
  const unread = notifications?.some((n: any) => n.unread);
  const unreadCount = notifications?.filter((n: any) => n.unread).length || 0;

  return (
    <>
      <NotificationDrawer visible={open} onClose={() => setOpen(false)} />
      <TouchableOpacity style={styles.bellBtn} onPress={() => setOpen(true)}>
        <Icon name="bell" size={18} color={colors.ink2} />
        {unread && (
          <View style={styles.bellBadge}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700', lineHeight: 12 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = {
  bellBtn: {
    position: 'absolute' as any,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bellBadge: {
    position: 'absolute' as any,
    top: 5,
    right: 5,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingHorizontal: 2,
  },
};
