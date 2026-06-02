import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import type { BadgeVariant } from '../../components/Badge';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'HealthProfileHistory'>;

type ActionType = '추가' | '수정' | '삭제';

interface HistoryItem {
  id: number;
  date: string;
  field: string;
  action: ActionType;
  detail: string;
}

const ACTION_VARIANT: Record<ActionType, BadgeVariant> = {
  추가: 'success',
  수정: 'accent',
  삭제: 'danger',
};

// TODO: [BE 대기] GET /health-profile/history 미구현 — 구현 완료 후 mock 제거
const MOCK_HISTORY: HistoryItem[] = [
  { id: 5, date: '2026.05.10', field: '기저질환', action: '추가', detail: '고혈압' },
  { id: 4, date: '2026.05.05', field: '성별', action: '수정', detail: '남성 → 여성' },
  { id: 3, date: '2026.04.28', field: '알레르기', action: '추가', detail: '페니실린' },
  { id: 2, date: '2026.04.15', field: '연령대', action: '수정', detail: '30대 → 40대' },
  { id: 1, date: '2026.03.20', field: '현재 복용약(처방 외)', action: '추가', detail: '아스피린' },
];

function formatLabel(item: HistoryItem): string {
  return `${item.field} ${item.action}: ${item.detail}`;
}

export function HealthProfileHistoryScreen({ navigation }: { navigation: NavProp }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: [BE 대기] GET /health-profile/history 연결 필요
    // healthProfileApi.getHistory().then(res => setHistory(res.items)).catch(() => {}).finally(() => setLoading(false));
    const timer = setTimeout(() => {
      setHistory(MOCK_HISTORY);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenLayout
      title="건강 프로필 변경 이력"
      back
      onBack={() =>
        navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')
      }
      scrollable
    >
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.s32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : history.length === 0 ? (
        <Card
          shadow
          style={{ alignItems: 'center', paddingVertical: spacing.s56, gap: spacing.s12 }}
        >
          <Icon name="list" size={36} color={colors.muted2} />
          <Text
            style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}
          >
            변경 이력이 없습니다
          </Text>
          <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: 'center' }}>
            건강 프로필을 수정하면 이곳에 기록이 표시됩니다.
          </Text>
        </Card>
      ) : (
        <Card shadow noPadding style={{ overflow: 'hidden' }}>
          {history.map((item, i) => (
            <View
              key={item.id}
              style={[
                { paddingHorizontal: spacing.s20, paddingVertical: spacing.s16 },
                i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.s8,
                  marginBottom: 4,
                }}
              >
                <Badge variant={ACTION_VARIANT[item.action]}>{item.action}</Badge>
                <Text
                  style={{
                    fontSize: typography.fz13,
                    fontWeight: typography.fw6,
                    color: colors.ink,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {formatLabel(item)}
                </Text>
              </View>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{item.date}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScreenLayout>
  );
}

export default HealthProfileHistoryScreen;
