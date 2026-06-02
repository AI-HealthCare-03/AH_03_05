import React from 'react';
import { View, Text } from 'react-native';
import Icon from './Icon';
import Button from './Button';
import { colors, spacing, typography } from '../theme';

/**
 * 데이터 없음 / 오류 상태 표시 컴포넌트. 아이콘·제목·설명·액션 버튼으로 구성됩니다.
 *
 * @example
 * <EmptyState icon="doc" message="아직 업로드된 기록이 없어요." />
 * <EmptyState icon="alert" title="불러오지 못했어요" message={error} action={{ label: '다시 시도', onPress: retry }} />
 */
interface EmptyStateProps {
  /** 중앙에 표시할 아이콘 이름 */
  icon: string;
  /** 볼드 제목 (선택) */
  title?: string;
  /** 보조 설명 텍스트 (선택) */
  message?: string;
  /** 하단 액션 버튼 (선택) */
  action?: {
    /** 버튼 레이블 */
    label: string;
    onPress: () => void;
  };
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.s40 }}>
      <Icon name={icon} size={36} color={colors.muted2} />
      {title ? (
        <Text
          style={{
            fontSize: typography.fz15,
            fontWeight: typography.fw6,
            color: colors.ink,
            marginTop: spacing.s12,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text
          style={{
            fontSize: typography.fz13,
            color: colors.muted,
            marginTop: spacing.s4,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          variant="primary"
          size="sm"
          style={{ marginTop: spacing.s16 }}
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      ) : null}
    </View>
  );
});

export default EmptyState;
