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
        } else if (__DEV__) {
          const dummy: DrugDetail = {
            drug_ref_id: drugId!,
            drug_name: '타이레놀정 500mg',
            ingredient_name: 'Acetaminophen (아세트아미노펜)',
            manufacturer: '한국얀센',
            efficacy: '발열, 두통, 치통, 근육통, 생리통, 관절통, 신경통 등의 해열 및 진통에 쓰입니다.',
            usage_method: '성인 및 15세 이상: 1회 1~2정, 1일 3~4회 필요 시 복용합니다. 복용 간격은 4~6시간 이상으로 유지하세요.',
            caution: '간 질환, 신장 질환 환자는 복용 전 의사 또는 약사와 상의하세요. 알코올과의 병용을 피하세요. 다른 해열진통제와 동시 복용하지 마세요.',
            side_effect: '드물게 피부 발진, 두드러기, 구역질이 나타날 수 있습니다. 이상 증상 발생 시 복용을 중단하고 의사와 상담하세요.',
          };
          cache.set(drugId!, { data: dummy, date: todayStr() });
          setDrug(dummy);
          setLastFetched(todayStr());
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
  ].filter(sec => !!sec.value);

  return (
    <ScreenLayout title={drug.drug_name} back onBack={() => navigation.goBack()} scrollable scrollPadding={false} contentStyle={{ padding: spacing.s20 }}>
      {usingCache && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warning50, borderRadius: radii.md, padding: 10, marginBottom: 14 }}>
          <Icon name="alert" size={13} color={colors.warning} />
          <Text style={{ fontSize: typography.fz12, color: colors.warningText }}>네트워크 오류 — 캐시 데이터 표시 중</Text>
        </View>
      )}

      <Card shadow>
        {/* 약품명 + 일반명 + 제조사 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.s20 }}>
          <View style={{ flex: 1, marginRight: spacing.s12 }}>
            <Text style={{ fontSize: typography.fz18, fontWeight: typography.fw7, color: colors.ink, marginBottom: 4 }}>
              {drug.drug_name}
            </Text>
            {drug.ingredient_name ? (
              <Text style={{ fontSize: typography.fz13, color: colors.accent700, marginBottom: 4 }}>{drug.ingredient_name}</Text>
            ) : null}
            <Text style={{ fontSize: typography.fz13, color: drug.manufacturer ? colors.muted : colors.muted2, fontStyle: drug.manufacturer ? 'normal' : 'italic' }}>
              {drug.manufacturer ?? '제조사 정보 없음'}
            </Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pill" size={22} color={colors.accent700} />
          </View>
        </View>

        {/* 효능·용법·주의사항·부작용 */}
        {sections.map((sec, i) => (
          <View key={sec.label} style={[{ paddingTop: spacing.s16 }, i === 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s8 }}>
              <Icon name="link" size={13} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>{sec.label}</Text>
            </View>
            <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20, marginBottom: spacing.s16 }}>{sec.value}</Text>
          </View>
        ))}

        {/* 식약처 출처 + 캐시 조회 시각 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.s12, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
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
