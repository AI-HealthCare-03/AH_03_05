import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radii, spacing, typography } from '../theme';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={styles.text}>{toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  pill: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.s18,
    paddingVertical: spacing.s10,
    borderRadius: radii.pill,
  },
  text: {
    color: colors.white,
    fontSize: typography.fz13,
    fontWeight: typography.fw5,
  },
});
