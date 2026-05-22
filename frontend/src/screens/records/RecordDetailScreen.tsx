import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { recordsApi, extractApiError } from '../../api';
import type { RecordDetail, MedicationItem } from '../../api';
import { RECORD_LABEL, formatDate, getRecordColor, s } from './_recordsShared';

export function RecordDetailScreen({ navigation, route }: any) {
  const recordId: number | undefined = route?.params?.recordId;
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      setError('기록 ID가 없어요.');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [rec, meds] = await Promise.allSettled([
          recordsApi.getRecord(recordId),
          recordsApi.getRecordMedications(recordId),
        ]);
        if (rec.status === 'fulfilled') {
          setRecord(rec.value);
        } else if (__DEV__) {
          setRecord({
            record_id: 1,
            record_type: 'prescription',
            status: 'ocr_completed',
            uploaded_at: '2026-05-11T10:00:00',
            ocr_confidence: 0.91,
          });
        } else {
          setError(extractApiError((rec as PromiseRejectedResult).reason));
        }
        if (meds.status === 'fulfilled') {
          setMedications(meds.value.medications);
        } else if (__DEV__) {
          setMedications([
            { medication_id: 1, drug_name: '암로디핀정 5mg', dosage: '1정', frequency: '1일 1회 아침 식후', is_verified: true },
            { medication_id: 2, drug_name: '로수바스타틴 10mg', dosage: '1정', frequency: '1일 1회 저녁 식후', is_verified: true },
            { medication_id: 3, drug_name: '메트포르민 500mg', dosage: '1정', frequency: '1일 2회 식후', is_verified: false },
          ]);
        } else {
          console.warn('[RecordDetail] medications 로드 실패 (백엔드 미구현):', (meds as PromiseRejectedResult).reason);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  if (loading) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (error || !record) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.s20 }}>
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
      right={<Button variant="primary" size="sm" leftIcon="wand" onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'GuideResult' })}>가이드</Button>}
      scrollable
    >
      {/* 기본 정보 */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: spacing.s16, flexWrap: 'wrap' }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="link" size={14} color={colors.ink2} />
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
              처방 약품 ({medications.length}종)
            </Text>
          </View>
        </View>
        {medications.length === 0 ? (
          <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: 'center', paddingVertical: spacing.s12 }}>
            약품 정보를 불러오는 중이에요.
          </Text>
        ) : medications.map((med, i) => (
          <View key={med.medication_id} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: getRecordColor(recordId ?? 0) }} />
            <View style={{ flex: 1, marginLeft: spacing.s12 }}>
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
      <Card style={{ marginBottom: 14 }}>
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

      <TouchableOpacity
        disabled
        style={{ borderWidth: 1, borderColor: colors.danger, borderRadius: radii.pill, height: 50, alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}
        onPress={() => {}}
      >
        <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.danger }}>기록 삭제</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

export default RecordDetailScreen;
