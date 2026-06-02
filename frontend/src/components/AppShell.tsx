import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Sidebar from './Sidebar';
import { colors } from '../theme';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function AppShell({ children, scrollable = false }: Props) {
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    // Mobile: just render children (tab bar handles navigation)
    return <View style={s.mobileRoot}>{children}</View>;
  }

  // Desktop: sidebar + content
  return (
    <View style={s.desktopRoot}>
      <Sidebar />
      <View style={s.desktopContent}>
        {scrollable ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
            {children}
          </ScrollView>
        ) : (
          <View style={s.contentInner}>{children}</View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  mobileRoot: { flex: 1 },
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.canvas,
  },
  desktopContent: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  contentInner: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center' as const,
  },
  scrollContent: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
});
