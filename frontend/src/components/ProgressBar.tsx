import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../theme';

/**
 * 수평 진행 표시 바.
 *
 * @example
 * <ProgressBar progress={75} />
 * <ProgressBar progress={adherence} color={colors.white} trackColor={colors.onAccent25} />
 */
interface ProgressBarProps {
  /** 숫자(0–100)이면 `%` 단위 적용, 문자열이면 그대로 사용 */
  progress: number | string;
  /** 기본값 `colors.accent` */
  color?: string;
  /** 기본값 `colors.hairline` */
  trackColor?: string;
  /** 기본값 `6` */
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color = colors.accent,
  trackColor = colors.hairline,
  height = 6,
  style,
}: ProgressBarProps) {
  const width = typeof progress === 'number' ? `${progress}%` : progress;
  return (
    <View
      style={[
        { height, backgroundColor: trackColor, borderRadius: height / 2, overflow: 'hidden' },
        style,
      ]}
    >
      <View
        style={{
          width: width as any,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
});

export default ProgressBar;
