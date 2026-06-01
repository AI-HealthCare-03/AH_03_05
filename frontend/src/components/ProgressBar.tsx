import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface ProgressBarProps {
  progress: number | string;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color = colors.accent, trackColor = colors.hairline, height = 6, style }: ProgressBarProps) {
  const width = typeof progress === 'number' ? `${progress}%` : progress;
  return (
    <View style={[{ height, backgroundColor: trackColor, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <View style={{ width: width as any, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export default ProgressBar;
