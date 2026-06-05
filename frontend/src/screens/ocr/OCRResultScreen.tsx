import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Banner from '../../components/Banner';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { recordsApi, medicationsApi, extractApiError } from '../../api';
import type { MedicationCandidate } from '../../api';
import { s } from './_ocrShared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'OCRResult'>;

function buildCandidateTime(c: MedicationCandidate): string {
  if (!c.frequency && !c.timing) return '';
  const parts: string[] = [];
  if (c.frequency) parts.push(c.frequency);
  if (c.timing) parts.push(c.timing);
  parts.push('14일');
  return `1일 ${parts.join(' · ')}`;
}

export function OCRResultScreen({ navigation, route }: Props) {
  const recordId: number | undefined = route?.params?.recordId;
  const inputMethod: string | undefined = route?.params?.inputMethod;
  const { ocrSession, setOcrSession, flash } = useApp();
  const [candidates, setCandidates] = useState<MedicationCandidate[]>([]);
  const [loading, setLoading] = useState(!!recordId);
  const [error, setError] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [textExpanded, setTextExpanded] = useState(false);
  const [savingText, setSavingText] = useState(false);

  useEffect(() => {
    if (!recordId) return;
    (async () => {
      try {
        const res = await recordsApi.getOcrResult(recordId);
        setOcrText(res.ocr_edited_text ?? res.ocr_text ?? '');
        setCandidates(res.medication_candidates ?? []);
        setOcrSession({
          ...ocrSession,
          drugs: (res.medication_candidates ?? []).map(c => ({
            name: c.drug_name,
            maker: '',
            time: buildCandidateTime(c),
            confidence: Math.round(c.confidence * 100),
            status: !c.is_verified && c.confidence < 0.7 ? 'needsCheck' : 'ok',
          })),
        });
      } catch (e) {
        setError(extractApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  const isManualInput = inputMethod === 'manual';

  const displayDrugs = recordId
    ? candidates.map(c => ({
        name: c.drug_name,
        maker: '',
        time: buildCandidateTime(c),
        confidence: c.confidence != null ? Math.round(c.confidence * 100) : null,
        status:
          !isManualInput && !c.is_verified && (c.confidence ?? 1) < 0.7
            ? 'needsCheck'
            : ('ok' as 'ok' | 'needsCheck'),
        isManual: isManualInput,
      }))
    : ocrSession.drugs;

  const handleGuideGenerate = async () => {
    if (recordId && candidates.length > 0 && candidates.some(c => c.medication_id !== undefined)) {
      setVerifying(true);
      try {
        await medicationsApi.verifyMedications(
          recordId,
          candidates.map(c => ({
            medication_id: c.medication_id!,
            drug_ref_id: c.drug_ref_id != null ? String(c.drug_ref_id) : null,
          }))
        );
      } catch (e) {
        setVerifying(false);
        setError(extractApiError(e));
        return;
      }
      setVerifying(false);
    }
    navigation.navigate('GuideLoading', recordId ? { recordId } : undefined);
  };

  if (loading) {
    return (
      <View style={[s.loadingRoot, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s12 }}>
          OCR 결과 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScreenLayout
      title="OCR 인식 결과 확인"
      back
      onBack={() => navigation.goBack()}
      right={
        <Button
          variant="primary"
          size="sm"
          leftIcon="wand"
          onPress={handleGuideGenerate}
          loading={verifying}
          disabled={verifying}
        >
          가이드 생성하기
        </Button>
      }
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s20 }}
    >
      {inputMethod !== 'manual' &&
        (!imageRemoved ? (
          <Card shadow style={{ marginBottom: spacing.s14 }}>
            <View style={s.docPreview}>
              <Icon name="doc" size={72} color={colors.accentAlpha30} />
              <TouchableOpacity
                onPress={() => {
                  setImageRemoved(true);
                  flash('이미지를 제거했습니다');
                }}
                style={s.removeBtn}
                accessibilityLabel="이미지 제거"
              >
                <Icon name="x" size={14} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: spacing.s12,
              }}
            >
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
                {recordId ? `기록 #${recordId}` : ocrSession.fileName}
              </Text>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                {ocrSession.fileSize}
              </Text>
            </View>
          </Card>
        ) : (
          <Card
            shadow
            style={{ marginBottom: 14, alignItems: 'center', paddingVertical: spacing.s24 }}
          >
            <Icon name="image" size={24} color={colors.muted2} />
            <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s8 }}>
              원본 이미지를 제거했어요
            </Text>
            <TouchableOpacity
              onPress={() => {
                setImageRemoved(false);
                flash('이미지를 복원했습니다');
              }}
              style={{ marginTop: spacing.s4 }}
            >
              <Text style={{ fontSize: typography.fz12, color: colors.accent }}>되돌리기</Text>
            </TouchableOpacity>
          </Card>
        ))}

      {error ? (
        <Banner variant="danger" body={error} style={{ marginBottom: spacing.s14 }} />
      ) : (
        <Banner
          variant="success"
          title="OCR 인식이 완료됐어요"
          style={{ marginBottom: spacing.s14 }}
        />
      )}

      {recordId && inputMethod !== 'manual' && (
        <Card shadow style={{ marginBottom: spacing.s14 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => setTextExpanded(p => !p)}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}>
              <Icon name="edit" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2 }}>
                인식 텍스트 직접 수정
              </Text>
            </View>
            <Icon name={textExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
          </TouchableOpacity>
          {textExpanded && (
            <View style={{ marginTop: spacing.s12 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.hairlineStrong,
                  borderRadius: 8,
                  padding: spacing.s12,
                  fontSize: typography.fz13,
                  color: colors.ink,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                multiline
                value={ocrText}
                onChangeText={setOcrText}
                placeholder="인식된 텍스트를 수정해주세요"
                placeholderTextColor={colors.muted2}
              />
              <TouchableOpacity
                style={{
                  marginTop: spacing.s8,
                  alignSelf: 'flex-end',
                  backgroundColor: savingText ? colors.hairline : colors.accent,
                  paddingHorizontal: spacing.s16,
                  paddingVertical: spacing.s8,
                  borderRadius: 8,
                }}
                disabled={savingText}
                onPress={async () => {
                  setSavingText(true);
                  try {
                    await recordsApi.updateOcrText(recordId, { ocr_edited_text: ocrText });
                    flash('텍스트가 저장됐어요');
                    setTextExpanded(false);
                  } catch (e) {
                    flash(extractApiError(e));
                  } finally {
                    setSavingText(false);
                  }
                }}
              >
                {savingText
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.white }}>저장</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </Card>
      )}

      <Card shadow>
        <SectionHeader
          icon="link"
          label={`인식된 약품 (${displayDrugs.length}종)`}
          action={
            <TouchableOpacity onPress={() => navigation.navigate('DrugCandidate')}>
              <Text style={{ fontSize: typography.fz13, color: colors.accent }}>+ 직접 추가</Text>
            </TouchableOpacity>
          }
        />

        {displayDrugs.map((d, i) => {
          const warn = d.status === 'needsCheck';
          const manual = d.isManual;
          const bgColor = manual ? colors.accent50 : warn ? colors.warning50 : colors.success50;
          const dotColor = manual ? colors.accent700 : warn ? colors.warning : colors.success;
          return (
            <TouchableOpacity
              key={`${d.name}_${i}`}
              style={[s.drugCard, { backgroundColor: bgColor }]}
              onPress={() =>
                warn || manual
                  ? navigation.navigate('DrugCandidate', { medicationName: d.name, drugIndex: i })
                  : navigation.navigate('DrugDosage', {
                      drugIndex: i,
                      medicationId: recordId ? candidates[i]?.medication_id : undefined,
                    })
              }
            >
              <View style={[s.drugDot, { backgroundColor: dotColor }]}>
                {manual ? (
                  <Icon name="edit" size={14} color={colors.white} />
                ) : warn ? (
                  <Icon name="alert" size={14} color={colors.white} />
                ) : (
                  <Icon name="check" size={14} color={colors.white} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
                  <Text
                    style={{ fontSize: typography.fz14, fontWeight: typography.fw6, flex: 1 }}
                    numberOfLines={1}
                  >
                    {d.name}
                  </Text>
                  {d.maker ? (
                    <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                      ({d.maker})
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: typography.fz12,
                    color: manual
                      ? colors.accent700
                      : warn
                        ? colors.warningText
                        : colors.successText,
                    marginTop: spacing.s2,
                  }}
                >
                  {manual
                    ? '직접 입력된 약품'
                    : warn
                      ? `인식률 ${d.confidence}% — 확인이 필요해요`
                      : d.time || `인식률 ${d.confidence}%`}
                </Text>
              </View>
              <View
                style={[
                  s.chip,
                  {
                    backgroundColor: manual
                      ? colors.accent100
                      : warn
                        ? colors.warning
                        : colors.white,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.fz11,
                    color: manual ? colors.accent700 : warn ? colors.white : colors.successText,
                    fontWeight: typography.fw6,
                  }}
                >
                  {manual ? '직접 입력' : warn ? '검색/확인' : '수정'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    </ScreenLayout>
  );
}

export default OCRResultScreen;
