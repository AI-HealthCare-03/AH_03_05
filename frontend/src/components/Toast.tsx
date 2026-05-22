import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, typography } from '../theme';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    // wrapper: position absolute, spans full screen width
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
    zIndex: 100,
  },
  pill: {
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  text: {
    color: colors.white,
    fontSize: typography.fz13,
    fontWeight: typography.fw5,
  },
});
