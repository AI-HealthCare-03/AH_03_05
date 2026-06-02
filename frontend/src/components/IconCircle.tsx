import React from 'react';
import { View, ViewStyle } from 'react-native';
import Icon from './Icon';
import { radii } from '../theme';

/**
 * 원형 아이콘 컨테이너. 고정 크기의 원(또는 둥근 사각형) 안에 아이콘을 중앙 배치합니다.
 *
 * @example
 * <IconCircle size={44} icon="user" color={colors.ink2} backgroundColor={colors.surface2} />
 * <IconCircle size={52} icon="doc" iconSize={26} color={colors.accent} backgroundColor={colors.accent50} borderRadius={radii.lg} />
 */
interface IconCircleProps {
  size: number;
  icon: string;
  /** 미지정 시 size × 0.42 자동 계산 */
  iconSize?: number;
  color: string;
  backgroundColor: string;
  /** 기본값 `radii.pill` (완전 원형) */
  borderRadius?: number;
  /** 지정 시 1px 테두리 표시 */
  borderColor?: string;
  style?: ViewStyle;
}

export const IconCircle = React.memo(function IconCircle({
  size,
  icon,
  iconSize,
  color,
  backgroundColor,
  borderRadius = radii.pill,
  borderColor,
  style,
}: IconCircleProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        borderColor ? { borderWidth: 1, borderColor } : undefined,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.42)} color={color} />
    </View>
  );
});

export default IconCircle;
