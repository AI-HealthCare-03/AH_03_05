import React from 'react';
import { View, ViewStyle } from 'react-native';
import Icon from './Icon';
import { radii } from '../theme';

interface IconCircleProps {
  size: number;
  icon: string;
  iconSize?: number;
  color: string;
  backgroundColor: string;
  borderRadius?: number;
  borderColor?: string;
  style?: ViewStyle;
}

export function IconCircle({
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
}

export default IconCircle;
