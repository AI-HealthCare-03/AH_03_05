// records/RecordListScreen.tsx + RecordDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { recordsApi, extractApiError } from '../../api';
import type { RecordSummary, RecordType, RecordDetail, MedicationItem } from '../../api';

// ─── helpers ─────────────────────────────────────────────────────────────────

const RECORD_LABEL: Record<RecordType, string> = {
  prescription: '처방전',
  medicine_bag: '약봉투',
  medical_record: '진료기록',
};

const FILTER_TO_TYPE: Record<string, RecordType | undefined> = {
  '처방전': 'prescription',
  '약봉투': 'medicine_bag',
  '진료기록': 'medical_record',
};

const iconFor = (type: RecordType) =>
  type === 'prescription' ? 'doc' : type === 'medicine_bag' ? 'pill' : 'list';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '');
}

// ─── RecordListScreen ─────────────────────────────────────────────────────────

export function RecordListScreen({ navigation }: any) {
  const [filter, setFilter] = useState('전체');
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const tabs = ['전체', '처방전', '약봉투', '진료기록'];

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await recordsApi.getRecords({
        record_type: FILTER_TO_TYPE[filter],
        size: 50,
      });
      setRecords(res.items);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <ScreenLayout
      title="진료기록"
      subtitle="업로드한 의료 문서와 분석 결과를 확인할 수 있어요."
      right={<Button variant="primary" size="sm" leftIcon="camera" onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}>업로드</Button>}
      headerExtra={
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {tabs.map((t) => (
            <TouchableOpacity key={t} style={[s.chip, filter === t && s.chipActive]} onPress={() => setFilter(t)}>
              <Text style={[{ fontSize: typography.fz12 }, filter === t && { color: colors.accent700, fontWeight: typography.fw6 }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.s5 }}>
          <Icon name="alert" size={32} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s3, textAlign: 'center' }}>{error}</Text>
          <Button variant="primary" style={{ marginTop: spacing.s4 }} onPress={() => fetchRecords()}>다시 시도</Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.s4, gap: spacing.s3 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRecords(true)} tintColor={colors.accent} />}
        >
          {records.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Icon name="doc" size={40} color={colors.muted2} />
              <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s3 }}>아직 업로드된 기록이 없어요.</Text>
            </View>
          ) : records.map((r) => (
            <TouchableOpacity
              key={r.record_id}
              style={s.recordCard}
              onPress={() => navigation.navigate('RecordDetail', { recordId: r.record_id })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={iconFor(r.record_type)} size={18} color={colors.accent700} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s2, marginBottom: spacing.s1 }}>
                    <View style={{ paddingHorizontal: spacing.s2, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 0.5, borderColor: colors.hairline }}>
                      <Text style={{ fontSize: typography.fz11, color: colors.ink2 }}>{RECORD_LABEL[r.record_type]}</Text>
                    </View>
                    <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{formatDate(r.uploaded_at)}</Text>
                  </View>
                  <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>{RECORD_LABEL[r.record_type]}</Text>
                  <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{r.status.replace('_', ' ')}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.muted2} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

// ─── RecordDetailScreen ───────────────────────────────────────────────────────

export function RecordDetailScreen({ navigation, route }: any) {
  const recordId: number = route?.params?.recordId;
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recordId) return;
    (async () => {
      setLoading(true);
      try {
        const [rec, meds] = await Promise.allSettled([
          recordsApi.getRecord(recordId),
          recordsApi.getRecordMedications(recordId),
        ]);
        if (rec.status === 'fulfilled') setRecord(rec.value);
        else setError(extractApiError((rec as PromiseRejectedResult).reason));
        if (meds.status === 'fulfilled') setMedications(meds.value.medications);
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  if (loading) {
    return (
      <ScreenLayout noHeader>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (error || !record) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.s5 }}>
          <Text style={{ fontSize: typography.fz14, color: colors.muted }}>{error || '기록을 불러올 수 없어요.'}</Text>
        </View>
      </ScreenLayout>
    );
  }

  const typeLabel = RECORD_LABEL[record.record_type];

  return (
    <ScreenLayout
      title={`${typeLabel} · ${formatDate(record.uploaded_at ?? '')}`}
      back
      onBack={() => navigation.goBack()}
      right={<Button variant="primary" size="sm" leftIcon="wand" onPress={() => navigation.navigate('GuideResult')}>가이드</Button>}
      scrollable
    >
      {/* 기본 정보 */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: spacing.s4, flexWrap: 'wrap' }}>
          {[
            ['종류', typeLabel],
            ['업로드', formatDate(record.uploaded_at ?? '')],
            ['상태', record.status.replace(/_/g, ' ')],
            ...(record.ocr_confidence != null ? [['OCR 정확도', `${Math.round(record.ocr_confidence * 100)}%`]] : []),
          ].map(([k, v]) => (
            <View key={k}>
              <Text style={{ fontSize: typography.fz11, color: colors.muted }}>{k}</Text>
              <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, marginTop: 2 }}>{v}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* 처방 약품 */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="link" size={14} color={colors.ink2} />
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
              처방 약품 ({medications.length}종)
            </Text>
          </View>
        </View>
        {medications.length === 0 ? (
          <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: 'center', paddingVertical: spacing.s3 }}>
            약품 정보를 불러오는 중이에요.
          </Text>
        ) : medications.map((med, i) => (
          <View key={med.medication_id} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: colors.accent }} />
            <View style={{ flex: 1, marginLeft: spacing.s3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{med.drug_name}</Text>
                {med.is_verified && (
                  <Badge variant="success" size="sm">확인됨</Badge>
                )}
              </View>
              {(med.dosage || med.frequency) ? (
                <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>
                  {[med.frequency, med.dosage].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('DrugDosage')}>
              <Text style={{ fontSize: typography.fz12, color: colors.accent }}>복용법</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* 원본 이미지 영역 */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>원본 이미지</Text>
        </View>
        <View style={{ height: 140, backgroundColor: colors.accent50, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
        </View>
        <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 10 }}>
          {typeLabel} · {formatDate(record.uploaded_at ?? '')}
        </Text>
      </Card>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: spacing.s3, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  recordCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s5, borderWidth: 0.5, borderColor: colors.hairline, marginBottom: spacing.s3 },
  drugRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
});

export default RecordListScreen;
