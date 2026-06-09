import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import IconCircle from '../../components/IconCircle';
import SectionHeader from '../../components/SectionHeader';
import { recordsApi, extractApiError } from '../../api';
import type { RecordDetail, MedicationItem, RecordGuideResponse } from '../../api';
import { RECORD_LABEL, formatDate, getRecordColor, iconFor } from './_recordsShared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecordsStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RecordsStackParams, 'RecordDetail'>;
import EmptyState from '../../components/EmptyState';

function mapApiError(err: any): string {
  const status = err?.response?.status;
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 404) return '기록을 찾을 수 없습니다.';
  if (!err?.response) return '네트워크 오류가 발생했습니다.';
  return extractApiError(err) || '오류가 발생했습니다.';
}

export function RecordDetailScreen({ navigation, route }: Props) {
  const { flash } = useApp();
  const recordId: number | undefined = route?.params?.recordId;
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [guide, setGuide] = useState<RecordGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medsError, setMedsError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      setError('기록 ID가 없어요.');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [rec, meds, gd] = await Promise.allSettled([
          recordsApi.getRecord(recordId),
          recordsApi.getRecordMedications(recordId),
          recordsApi.getRecordGuide(recordId),
        ]);

        if (rec.status === 'fulfilled') {
          const r = rec.value;
          setRecord(r);
        } else {
          setError(mapApiError((rec as PromiseRejectedResult).reason));
        }

        if (meds.status === 'fulfilled') {
          setMedications(meds.value.medications ?? []);
        } else {
          setMedsError(true);
        }

        if (gd.status === 'fulfilled') {
          setGuide(gd.value);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  const handleDownload = async () => {
    if (!record?.file_url) {
      flash('파일 URL을 불러올 수 없어요.');
      return;
    }
    setDownloading(true);
    try {
      const supported = await Linking.canOpenURL(record.file_url);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(record.file_url);
    } catch {
      flash('파일을 열 수 없어요.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!recordId) return;
    const doDelete = async () => {
      try {
        await recordsApi.deleteRecord(recordId);
        flash('진료기록이 삭제됐습니다.');
        navigation.goBack();
      } catch {
        flash('진료기록 삭제에 실패했습니다.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('이 기록과 연결된 약품 정보, 가이드가 모두 삭제돼요. 삭제 후에는 복구가 불가능해요.')) doDelete();
      return;
    }
    Alert.alert(
      '기록 삭제',
      '이 기록과 연결된 약품 정보, 가이드가 모두 삭제돼요. 삭제 후에는 복구가 불가능해요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()} title="진료기록으로 돌아가기">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (error || !record) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()} title="진료기록으로 돌아가기">
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.s20 }}
        >
          <Text style={{ fontSize: typography.fz14, color: colors.muted }}>
            {error || '기록을 불러올 수 없어요.'}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const typeLabel = RECORD_LABEL[record.record_type];
  const guideReady = guide?.status === 'completed';
  const accentColor = getRecordColor(record.record_id);

  return (
    <>
      <ScreenLayout
        title="진료기록으로 돌아가기"
        back
        onBack={() => navigation.goBack()}
        scrollable
        scrollPadding={false}
        contentStyle={{ padding: spacing.s20, paddingBottom: spacing.s40 }}
      >
        {/* ── 기록 헤더 ── */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.s20 }}>
          <IconCircle
            size={52}
            icon={iconFor(record.record_type)}
            iconSize={26}
            color={colors.accent}
            backgroundColor={colors.accent50}
            borderRadius={radii.lg}
            style={{ marginRight: spacing.s16 }}
          />
          <View style={{ flex: 1 }}>
            {/* 뱃지 + 날짜 + 버튼 (한 행) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.s6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}>
                <Badge variant="accent">{typeLabel}</Badge>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                  {formatDate(record.uploaded_at ?? '')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.s8, alignItems: 'center' }}>
                <Button variant="danger" size="sm" leftIcon="trash" onPress={handleDelete}>
                  삭제
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon="wand"
                  disabled={!guideReady}
                  onPress={() =>
                    guide?.guide_id
                      ? navigation
                          .getParent()
                          ?.navigate('GuideTab', {
                            screen: 'GuideResult',
                            params: { guideId: guide.guide_id },
                          })
                      : navigation
                          .getParent()
                          ?.navigate('GuideTab', { screen: 'GuideLoading', params: { recordId } })
                  }
                >
                  가이드
                </Button>
              </View>
            </View>
            {/* 병원명 / 타입별 주제목 */}
            <Text
              style={{
                fontSize: typography.fz20,
                fontWeight: typography.fw7,
                color: colors.ink,
                marginBottom: spacing.s2,
              }}
            >
              {record.record_type === 'manual'
                ? '직접 입력'
                : (record.hospital_name ?? RECORD_LABEL[record.record_type])}
            </Text>
            {/* 담당의 — prescription / medical_record만 표시 */}
            {(record.record_type === 'prescription' || record.record_type === 'medical_record') &&
            record.doctor_name ? (
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>
                담당: {record.doctor_name}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── 처방 약품 ── */}
        <Card shadow style={{ marginBottom: spacing.s14 }}>
          <SectionHeader
            icon="link"
            label={`처방 약품 (${medications.length}종)`}
            action={
              record.total_days ? (
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                  총 처방 일수 {record.total_days}일
                </Text>
              ) : undefined
            }
          />

          {medsError ? (
            <Text
              style={{
                fontSize: typography.fz13,
                color: colors.muted,
                textAlign: 'center',
                paddingVertical: spacing.s12,
              }}
            >
              약품 정보를 불러오지 못했어요.
            </Text>
          ) : medications.length === 0 ? (
            <Text
              style={{
                fontSize: typography.fz13,
                color: colors.muted,
                textAlign: 'center',
                paddingVertical: spacing.s12,
              }}
            >
              처방된 약품이 없어요.
            </Text>
          ) : (
            medications.map((med, i) => (
              <TouchableOpacity
                key={med.medication_id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.s14,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: colors.hairline,
                }}
                disabled={!med.drug_ref_id}
                activeOpacity={med.drug_ref_id ? 0.7 : 1}
                onPress={() =>
                  med.drug_ref_id && navigation.navigate('DrugDetail', { drugId: med.drug_ref_id })
                }
                accessibilityRole="button"
                accessibilityLabel={med.drug_ref_id ? `${med.drug_name} 상세 보기` : med.drug_name}
              >
                <View
                  style={{
                    width: 4,
                    height: 36,
                    borderRadius: radii.r2,
                    backgroundColor: accentColor,
                  }}
                />
                <View style={{ flex: 1, marginLeft: spacing.s12 }}>
                  <Text
                    style={{
                      fontSize: typography.fz14,
                      fontWeight: typography.fw6,
                      color: med.drug_ref_id ? colors.accent700 : colors.ink,
                    }}
                  >
                    {med.drug_name}
                  </Text>
                  {med.frequency || med.dosage ? (
                    <Text style={s.subtitleText}>
                      {[med.frequency, med.dosage].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius={radii.pill}
                  disabled={!med.drug_ref_id}
                  onPress={() =>
                    med.drug_ref_id &&
                    navigation.navigate('DrugDetail', { drugId: med.drug_ref_id })
                  }
                >
                  약품 상세
                </Button>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* ── 가이드 상태 ── */}
        <Card shadow style={{ marginBottom: spacing.s14 }}>
          <SectionHeader icon="wand" iconColor={colors.accent700} label="복약 가이드" />
          {!guide ? (
            <EmptyState
              icon="doc"
              title="아직 가이드가 없어요"
              message="AI가 처방 내용을 분석해 복약 가이드를 생성해드려요."
              action={{
                label: '가이드 생성하기',
                onPress: () =>
                  navigation
                    .getParent()
                    ?.navigate('GuideTab', { screen: 'GuideLoading', params: { recordId } }),
              }}
            />
          ) : !guideReady ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.s12,
                paddingVertical: spacing.s8,
              }}
            >
              <ActivityIndicator color={colors.accent} size="small" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.fz14,
                    fontWeight: typography.fw6,
                    color: colors.ink,
                  }}
                >
                  가이드를 분석하고 있어요...
                </Text>
                <Text style={s.subtitleText}>분석이 완료되면 알림으로 알려드려요.</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
              <IconCircle
                size={40}
                icon="check"
                iconSize={18}
                color={colors.success}
                backgroundColor={colors.success50}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.fz14,
                    fontWeight: typography.fw6,
                    color: colors.ink,
                  }}
                >
                  가이드가 준비됐어요
                </Text>
                <Text style={s.subtitleText}>복약 방법, 주의사항, 생활습관 안내를 확인하세요.</Text>
              </View>
              <Button
                variant="primary"
                size="sm"
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('GuideTab', {
                      screen: 'GuideResult',
                      params: { guideId: guide.guide_id },
                    })
                }
              >
                바로가기
              </Button>
            </View>
          )}
        </Card>

        {/* ── 의사 메모 — prescription / medical_record만 표시 ── */}
        {(record.record_type === 'prescription' || record.record_type === 'medical_record') &&
        record.notes ? (
          <Card shadow style={{ marginBottom: spacing.s14 }}>
            <Text
              style={{
                fontSize: typography.fz13,
                fontWeight: typography.fw6,
                color: colors.ink,
                marginBottom: spacing.s8,
              }}
            >
              의사 메모
            </Text>
            <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: typography.lh20 }}>
              {record.notes}
            </Text>
          </Card>
        ) : null}

        {/* ── 원본 이미지 — manual은 숨김 ── */}
        {record.record_type !== 'manual' && (
          <Card shadow style={{ marginBottom: spacing.s14 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.s12,
              }}
            >
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
                원본 이미지
              </Text>
              <TouchableOpacity
                onPress={handleDownload}
                disabled={downloading}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s4 }}
                accessibilityRole="button"
                accessibilityLabel="원본 이미지 다운로드"
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Icon
                    name="download"
                    size={14}
                    color={record.file_url ? colors.accent : colors.muted2}
                  />
                )}
                <Text
                  style={{
                    fontSize: typography.fz13,
                    color: record.file_url ? colors.accent : colors.muted2,
                  }}
                >
                  {downloading ? '여는 중...' : '다운로드'}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                height: 200,
                backgroundColor: colors.accent50,
                borderRadius: radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.s12,
              }}
            >
              <Icon name="doc" size={72} color={colors.accentAlpha25} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                {record.file_name ?? '파일명 없음'}
              </Text>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                {[
                  record.file_size,
                  record.uploaded_at ? `업로드 ${formatDate(record.uploaded_at)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </Card>
        )}
      </ScreenLayout>
    </>
  );
}

export default RecordDetailScreen;

const s = StyleSheet.create({
  subtitleText: { fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 },
});
