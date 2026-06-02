import React from 'react';
import { View, Text } from 'react-native';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

/**
 * 카드 내 섹션 제목 행. 아이콘 + 레이블 + 선택적 우측 액션으로 구성됩니다.
 * `label`이 문자열이면 자동으로 스타일이 적용되고, ReactNode를 그대로 전달할 수도 있습니다.
 *
 * @example
 * <SectionHeader icon="link" label="처방 약품 (3종)" />
 * <SectionHeader icon="wand" iconColor={colors.accent700} label="복약 가이드" />
 * <SectionHeader label="오늘 복약 현황" action={<Badge variant="success">완료</Badge>} mb={spacing.s14} />
 */
interface SectionHeaderProps {
  icon?: string;
  /** 기본값 `colors.ink2` */
  iconColor?: string;
  /** 문자열이면 자동 스타일 적용, ReactNode는 그대로 렌더링 */
  label: React.ReactNode;
  action?: React.ReactNode;
  /** 하단 여백 — 기본값 `spacing.s12` */
  mb?: number;
}

export const SectionHeader = React.memo(function SectionHeader({
  icon,
  iconColor = colors.ink2,
  label,
  action,
  mb = spacing.s12,
}: SectionHeaderProps) {
  const labelNode =
    typeof label === 'string' ? (
      <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }}>
        {label}
      </Text>
    ) : (
      label
    );

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: action ? 'space-between' : 'flex-start',
        alignItems: 'center',
        marginBottom: mb,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
        {icon && <Icon name={icon} size={14} color={iconColor} />}
        {labelNode}
      </View>
      {action}
    </View>
  );
});

export default SectionHeader;
