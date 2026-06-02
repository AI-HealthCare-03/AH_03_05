import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Icon from '../../components/Icon';
import Banner from '../../components/Banner';
import IconCircle from '../../components/IconCircle';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { drugsApi, extractApiError } from '../../api';
import type { DrugDetail } from '../../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'DrugDetail'>;

// Session-scoped cache — persists across back/forward navigations without a network hit
const cache = new Map<number, { data: DrugDetail; date: string }>();

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function DrugDetailScreen({ navigation, route }: Props) {
  const drugId: number | undefined = route?.params?.drugId;
  const cached = drugId != null ? cache.get(drugId) : undefined;

  const [drug, setDrug] = useState<DrugDetail | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached);
  const [usingCache, setUsingCache] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(cached?.date ?? null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (drugId == null) {
      setLoading(false);
      setFetchError('약품 ID가 없어요.');
      return;
    }
    drugsApi.getDrug(drugId)
      .then(data => {
        const date = todayStr();
        cache.set(drugId, { data, date });
        setDrug(data);
        setLastFetched(date);
        setUsingCache(false);
        setFetchError('');
      })
      .catch(e => {
        if (cached) {
          setDrug(cached.data);
          setLastFetched(cached.date);
          setUsingCache(true);
        } else {
          setFetchError(extractApiError(e));
        }
      })
      .finally(() => setLoading(false));
  }, [drugId]);

  if (loading && !drug) {
    return (
      <ScreenLayout title="약품 상세" back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (fetchError && !drug) {
    return (
      <ScreenLayout title="약품 상세" back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.s20 }}>
          <Text style={{ fontSize: typography.fz14, color: colors.muted }}>{fetchError}</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!drug) return null;

  const sections: { label: string; icon: string; iconColor: string; value?: string }[] = [
    { label: '효능·효과', icon: 'heart',        iconColor: colors.success,  value: drug.efficacy },
    { label: '용법·용량', icon: 'clock',         iconColor: colors.accent,   value: drug.usage_method },
    { label: '주의사항', icon: 'alert',          iconColor: colors.warning,  value: drug.caution },
    { label: '부작용',   icon: 'alert-circle',   iconColor: colors.danger,   value: drug.side_effect },
  ].filter(sec => !!sec.value);

  return (
    <ScreenLayout title={drug.drug_name} back onBack={() => navigation.goBack()} scrollable scrollPadding={false} contentStyle={{ padding: spacing.s20 }}>
      {usingCache && (
        <Banner variant="warning" body="네트워크 오류 — 캐시 데이터 표시 중" style={{ marginBottom: spacing.s14 }} />
      )}

      <Card shadow>
        {/* 약품명 + 일반명 + 제조사 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.s20 }}>
          <View style={{ flex: 1, marginRight: spacing.s12 }}>
            <Text style={{ fontSize: typography.fz18, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s4 }}>
              {drug.drug_name}
            </Text>
            {drug.ingredient_name ? (
              <Text style={{ fontSize: typography.fz13, color: colors.accent700, marginBottom: spacing.s4 }}>{drug.ingredient_name}</Text>
            ) : null}
            <Text style={{ fontSize: typography.fz13, color: drug.manufacturer ? colors.muted : colors.muted2, fontStyle: drug.manufacturer ? 'normal' : 'italic' }}>
              {drug.manufacturer ?? '제조사 정보 없음'}
            </Text>
          </View>
          <IconCircle size={48} icon="pill" iconSize={22} color={colors.accent700} backgroundColor={colors.accent100} />
        </View>

        {/* 효능·용법·주의사항·부작용 */}
        {sections.map((sec, i) => (
          <View key={sec.label} style={[{ paddingTop: spacing.s16 }, i === 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6, marginBottom: spacing.s8 }}>
              <Icon name={sec.icon} size={13} color={sec.iconColor} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }}>{sec.label}</Text>
            </View>
            <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20, marginBottom: spacing.s16 }}>{sec.value}</Text>
          </View>
        ))}

        {/* 식약처 출처 + 캐시 조회 시각 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.s12, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
            <Icon name="shield" size={12} color={colors.muted2} />
            <Text style={{ fontSize: typography.fz11, color: colors.muted2 }}>식품의약품안전처 데이터</Text>
          </View>
          {lastFetched && (
            <Text style={{ fontSize: typography.fz11, color: colors.muted2 }}>조회: {lastFetched}</Text>
          )}
        </View>
      </Card>
    </ScreenLayout>
  );
}

export default DrugDetailScreen;
