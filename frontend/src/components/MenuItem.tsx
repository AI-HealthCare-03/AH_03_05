import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

/**
 * 설정/메뉴 목록의 단일 행. 아이콘 + 레이블 + 선택적 chevron으로 구성됩니다.
 *
 * @example
 * <MenuItem icon="bell" label="알림 설정" onPress={() => navigation.navigate('NotificationSettings')} />
 * <MenuItem icon="logout" label="로그아웃" iconColor={colors.ink2} chevron={false} onPress={handleLogout} />
 */
interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  /** 기본값 `true` */
  chevron?: boolean;
  /** 기본값 `colors.accent700` */
  iconColor?: string;
  /** 기본값 `colors.ink` */
  labelColor?: string;
  /** 상단 구분선 — 기본값 `false` */
  separator?: boolean;
}

export const MenuItem = React.memo(function MenuItem({
  icon,
  label,
  onPress,
  chevron = true,
  iconColor = colors.accent700,
  labelColor = colors.ink,
  separator = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.s20,
          paddingVertical: spacing.s16,
          gap: 14,
        },
        separator && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
      ]}
      onPress={onPress}
    >
      <Icon name={icon} size={16} color={iconColor} />
      <Text
        style={{
          flex: 1,
          fontSize: typography.fz14,
          fontWeight: typography.fw5,
          color: labelColor,
        }}
      >
        {label}
      </Text>
      {chevron && <Icon name="chevron-right" size={14} color={colors.muted2} />}
    </TouchableOpacity>
  );
});

export default MenuItem;
