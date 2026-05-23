import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { drugsApi, extractApiError } from '../../api';
import type { DrugDetail } from '../../api';

// Session-scoped cache — persists across back/forward navigations without a network hit
const cache = new Map<number, { data: DrugDetail; date: string }>();

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function DrugDetailScreen({ navigation, route }: any) {
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

  const sections: { label: string; value?: string }[] = [
    { label: '효능·효과', value: drug.efficacy },
    { label: '용법·용량', value: drug.usage_method },
    { label: '주의사항', value: drug.caution },
    { label: '부작용', value: drug.side_effect },
  ];

  return (
    <ScreenLayout title={drug.drug_name} back onBack={() => navigation.goBack()} scrollable>
      {usingCache && lastFetched && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface2, borderRadius: radii.md, padding: 10, marginBottom: 14 }}>
          <Icon name="info" size={13} color={colors.muted} />
          <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
            네트워크 오류 — 마지막 조회: {lastFetched}
          </Text>
        </View>
      )}

      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: spacing.s12 }}>
            <Text style={{ fontSize: typography.fz18, fontWeight: typography.fw7, color: colors.ink, marginBottom: 6 }}>
              {drug.drug_name}
            </Text>
            <Text style={{ fontSize: typography.fz13, color: drug.manufacturer ? colors.muted : colors.muted2, fontStyle: drug.manufacturer ? 'normal' : 'italic' }}>
              {drug.manufacturer ?? '제조사 정보 없음'}
            </Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pill" size={22} color={colors.accent700} />
          </View>
        </View>
      </Card>

      {sections.filter(sec => !!sec.value).map(sec => (
        <Card key={sec.label} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s12 }}>
            <Icon name="link" size={13} color={colors.ink2} />
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>{sec.label}</Text>
          </View>
          <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 }}>{sec.value}</Text>
        </Card>
      ))}
    </ScreenLayout>
  );
}

export default DrugDetailScreen;
