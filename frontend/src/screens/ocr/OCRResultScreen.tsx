import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { recordsApi, medicationsApi, extractApiError } from '../../api';
import type { MedicationCandidate } from '../../api';
import { s } from './_ocrShared';

function buildCandidateTime(c: MedicationCandidate): string {
  if (!c.frequency && !c.timing) return '';
  const parts: string[] = [];
  if (c.frequency) parts.push(c.frequency);
  if (c.timing) parts.push(c.timing);
  parts.push('14일');
  return `1일 ${parts.join(' · ')}`;
}

export function OCRResultScreen({ navigation, route }: any) {
  const recordId: number | undefined = route?.params?.recordId;
  const { ocrSession, setOcrSession, flash } = useApp();
  const [candidates, setCandidates] = useState<MedicationCandidate[]>([]);
  const [loading, setLoading] = useState(!!recordId);
  const [error, setError] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!recordId) return;
    (async () => {
      try {
        const res = await recordsApi.getOcrResult(recordId);
        setCandidates(res.medication_candidates ?? []);
        setOcrSession({
          ...ocrSession,
          drugs: (res.medication_candidates ?? []).map(c => ({
            name: c.drug_name,
            maker: '',
            time: buildCandidateTime(c),
            confidence: Math.round(c.confidence * 100),
            status: (!c.is_verified && c.confidence < 0.7) ? 'needsCheck' : 'ok',
          })),
        });
      } catch (e) {
        setError(extractApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  const displayDrugs = recordId
    ? candidates.map(c => ({
        name: c.drug_name,
        maker: '',
        time: buildCandidateTime(c),
        confidence: Math.round(c.confidence * 100),
        status: (!c.is_verified && c.confidence < 0.7) ? 'needsCheck' : 'ok' as 'ok' | 'needsCheck',
      }))
    : ocrSession.drugs;

  const handleGuideGenerate = async () => {
    // TODO: BE에서 medication_candidates에 medication_id 추가 후 동작, 현재는 verify 스킵됨
    if (recordId && candidates.length > 0 && candidates.some(c => c.medication_id !== undefined)) {
      setVerifying(true);
      try {
        await medicationsApi.verifyMedications(
          recordId,
          candidates.map(c => ({
            medication_id: c.medication_id!,
            drug_ref_id: c.drug_ref_id != null ? String(c.drug_ref_id) : null,
          })),
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
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s12 }}>OCR 결과 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScreenLayout
      title="OCR 인식 결과 확인"
      back
      onBack={() => navigation.goBack()}
      right={
        <Button variant="primary" size="sm" leftIcon="wand" onPress={handleGuideGenerate} loading={verifying} disabled={verifying}>가이드 생성하기</Button>
      }
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s20 }}
    >
      {/* TODO: manual-input record는 이미지 없음, BE fix 후 조건부 렌더링 필요 */}
      {!imageRemoved ? (
        <Card shadow style={{ marginBottom: 14 }}>
          <View style={s.docPreview}>
            <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
            <TouchableOpacity onPress={() => { setImageRemoved(true); flash('이미지를 제거했습니다'); }} style={s.removeBtn}>
              <Icon name="x" size={14} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.s12 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
              {recordId ? `기록 #${recordId}` : ocrSession.fileName}
            </Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{ocrSession.fileSize}</Text>
          </View>
        </Card>
      ) : (
        <Card shadow style={{ marginBottom: 14, alignItems: 'center', paddingVertical: spacing.s24 }}>
          <Icon name="image" size={24} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s8 }}>원본 이미지를 제거했어요</Text>
          <TouchableOpacity onPress={() => { setImageRemoved(false); flash('이미지를 복원했습니다'); }} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.accent }}>되돌리기</Text>
          </TouchableOpacity>
        </Card>
      )}

      {error ? (
        <View style={[s.banner, { backgroundColor: colors.danger50, marginBottom: 14 }]}>
          <Icon name="alert" size={16} color={colors.danger} />
          <Text style={{ fontSize: typography.fz14, color: colors.danger, marginLeft: spacing.s8 }}>{error}</Text>
        </View>
      ) : (
        <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, marginLeft: spacing.s8 }}>OCR 인식이 완료됐어요</Text>
        </View>
      )}

      <Card shadow>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="link" size={14} color={colors.ink2} />
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>인식된 약품 ({displayDrugs.length}종)</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DrugCandidate')}>
            <Text style={{ fontSize: typography.fz13, color: colors.accent }}>+ 직접 추가</Text>
          </TouchableOpacity>
        </View>

        {displayDrugs.map((d, i) => {
          const warn = d.status === 'needsCheck';
          return (
            <TouchableOpacity key={i}
              style={[s.drugCard, { backgroundColor: warn ? colors.warning50 : colors.success50 }]}
              onPress={() => warn
                ? navigation.navigate('DrugCandidate', { medicationName: d.name, drugIndex: i })
                : navigation.navigate('DrugDosage', { drugIndex: i })
              }
            >
              <View style={[s.drugDot, { backgroundColor: warn ? colors.warning : colors.success }]}>
                {warn ? <Icon name="alert" size={14} color="#fff" /> : <Icon name="check" size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, flex: 1 }} numberOfLines={1}>{d.name}</Text>
                  {d.maker ? <Text style={{ fontSize: typography.fz12, color: colors.muted }}>({d.maker})</Text> : null}
                </View>
                <Text style={{ fontSize: typography.fz12, color: warn ? '#92400E' : '#065F46', marginTop: 2 }}>
                  {warn ? `인식률 ${d.confidence}% — 확인이 필요해요` : d.time || `인식률 ${d.confidence}%`}
                </Text>
              </View>
              <View style={[s.chip, { backgroundColor: warn ? colors.warning : colors.white }]}>
                <Text style={{ fontSize: typography.fz11, color: warn ? colors.white : '#065F46', fontWeight: typography.fw6 }}>
                  {warn ? '검색/확인' : '수정'}
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
