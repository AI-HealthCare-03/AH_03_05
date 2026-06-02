import React, { useState } from 'react';
import { TextInput, ViewStyle } from 'react-native';
import Card from './Card';
import Button from './Button';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

/**
 * 포커스 상태에 따라 테두리가 강조되는 검색 입력 필드.
 * 오른쪽에 선택적 액션 버튼을 붙일 수 있습니다.
 *
 * @example
 * <SearchBar value={query} onChangeText={setQuery} />
 * <SearchBar value={q} onChangeText={setQ} onSubmit={doSearch} action={{ label: '검색', onPress: doSearch }} />
 */
interface SearchBarProps {
  /** 입력 값 */
  value: string;
  /** 입력 변경 핸들러 */
  onChangeText: (text: string) => void;
  /** 플레이스홀더 텍스트 — 기본값 `'검색'` */
  placeholder?: string;
  /** 키보드 완료/검색 버튼 핸들러 */
  onSubmit?: () => void;
  /** 자동 포커스 여부 */
  autoFocus?: boolean;
  /** 오른쪽 액션 버튼 (선택) */
  action?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  style?: ViewStyle;
}

export const SearchBar = React.memo(function SearchBar({
  value,
  onChangeText,
  placeholder = '검색',
  onSubmit,
  autoFocus,
  action,
  style,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Card
      noPadding
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.s8,
          borderColor: focused ? colors.accent : colors.hairline,
          borderWidth: focused ? 1.5 : 0.5,
          height: 44,
          paddingHorizontal: spacing.s12,
        },
        style,
      ]}
    >
      <Icon name="search" size={16} color={focused ? colors.accent : colors.muted} />
      <TextInput
        style={
          { flex: 1, fontSize: typography.fz14, color: colors.ink, outlineStyle: 'none' } as any
        }
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType={onSubmit ? 'search' : 'done'}
        autoFocus={autoFocus}
      />
      {action && (
        <Button variant="primary" size="sm" loading={action.loading} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </Card>
  );
});

export default SearchBar;
