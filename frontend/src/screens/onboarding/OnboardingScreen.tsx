import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import MediPTLogo from '../../components/MediPTLogo';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, radii, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { healthProfileApi, extractApiError } from '../../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParams, 'OnboardingStep'>;

const AGE_MAP: Record<string, string> = {
  '20대': '20s',
  '30대': '30s',
  '40대': '40s',
  '50대': '50s',
  '60대+': '60s',
};
const GENDER_MAP: Record<string, string | undefined> = {
  여성: 'F',
  남성: 'M',
  '답변 안 함': undefined,
};

const AGES = ['20대', '30대', '40대', '50대', '60대+'];
const SEXES = ['여성', '남성', '답변 안 함'];

const STEP2_FIELDS = ['conditions', 'allergies', 'otherMeds'] as const;
const STEP2_LABELS = ['기저질환', '알레르기', '현재 복용약 (처방전 외)'];
const STEP2_PLACEHOLDERS = [
  '예: 고혈압, 제2형 당뇨',
  '예: 페니실린, 아스피린',
  '예: 비타민, 오메가3',
];

const splitList = (s: string) =>
  s
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

export default function OnboardingScreen({ navigation, route }: Props) {
  const step: number = route?.params?.step ?? 1;
  const { user, setUser } = useApp();
  const { isTabletOrAbove } = useBreakpoint();
  const { top: safeTop } = useSafeAreaInsets();

  const [form, setFormState] = React.useState({
    age: user.age || '',
    sex: user.sex || '',
    conditions: user.conditions || '',
    allergies: user.allergies || '',
    otherMeds: user.otherMeds || '',
    history: user.history || '',
  });
  const set = (k: string, v: string) => setFormState(prev => ({ ...prev, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNav, setPendingNav] = useState(false);

  // Navigate only after AppProvider has re-rendered with the updated context.
  // Calling navigation.reset() immediately after setUser() races against
  // React's async state commit — HomeScreen would mount with stale context.
  useEffect(() => {
    if (!pendingNav) return;
    navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
  }, [pendingNav, user.profileComplete, navigation]);

  const next = async () => {
    if (step === 1) {
      setUser({ ...user, age: form.age, sex: form.sex });
      navigation.replace('OnboardingStep', { step: 2 });
      return;
    }
    setLoading(true);
    setError('');
    try {
      await healthProfileApi.upsertHealthProfile({
        age_group: AGE_MAP[form.age],
        gender: GENDER_MAP[form.sex],
        chronic_diseases: splitList(form.conditions),
        allergies: splitList(form.allergies),
        current_medications: splitList(form.otherMeds),
        medical_history: form.history || undefined,
      });
      setUser({ ...user, ...form, profileComplete: true });
      setPendingNav(true);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const back = () => navigation.replace('OnboardingStep', { step: 1 });
  const skip = () => {
    setUser({ ...user, profileComplete: false });
    setPendingNav(true);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop) },
        isTabletOrAbove && styles.containerDesktop,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[{ width: '100%' }, isTabletOrAbove && { maxWidth: 520 }]}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <MediPTLogo width={130} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { flex: 1, backgroundColor: colors.accent }]} />
          <View
            style={[
              styles.progressBar,
              { flex: 1, backgroundColor: step === 2 ? colors.accent : colors.accent100 },
            ]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.stepLabel}>STEP {step} / 2</Text>

          {step === 1 ? (
            <>
              <Text style={styles.title}>기본 정보를 알려주세요</Text>
              <Text style={styles.sub}>입력된 정보는 개인화에만 사용돼요</Text>

              <View style={styles.infoBanner}>
                <Icon name="info" size={16} color={colors.accent700} />
                <Text style={styles.infoText}>입력할수록 더 개인화된 가이드를 받을 수 있어요.</Text>
              </View>

              <Text style={styles.fieldLabel}>연령대</Text>
              <View style={styles.chipRow}>
                {AGES.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, form.age === a && styles.chipActive]}
                    onPress={() => set('age', a)}
                  >
                    <Text style={[styles.chipText, form.age === a && styles.chipTextActive]}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>성별</Text>
              <View style={styles.chipRow}>
                {SEXES.map(sv => (
                  <TouchableOpacity
                    key={sv}
                    style={[styles.chip, styles.chipGrow, form.sex === sv && styles.chipActive]}
                    onPress={() => set('sex', sv)}
                  >
                    <Text style={[styles.chipText, form.sex === sv && styles.chipTextActive]}>
                      {sv}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>건강 상태를 알려주세요</Text>
              <Text style={styles.sub}>기저질환·알레르기·복용약은 쉼표로 구분해 입력해주세요.</Text>

              {STEP2_FIELDS.map((k, i) => (
                <Input
                  key={k}
                  label={STEP2_LABELS[i]}
                  placeholder={STEP2_PLACEHOLDERS[i]}
                  value={form[k]}
                  onChangeText={v => set(k, v)}
                  containerStyle={{ marginBottom: spacing.s14 }}
                />
              ))}

              <Input
                label="병력 메모"
                placeholder="과거 수술/입원 기록 등"
                value={form.history}
                onChangeText={v => set('history', v)}
                multiline
                style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.s8 }}
              />
            </>
          )}

          {error ? (
            <Text
              style={{
                fontSize: typography.fz13,
                color: colors.danger,
                textAlign: 'center',
                marginBottom: spacing.s8,
              }}
            >
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.s12, marginTop: spacing.s24 }}>
            <Button
              variant="ghost"
              size="lg"
              style={{ flex: 1 }}
              onPress={step === 1 ? skip : back}
              disabled={loading}
            >
              {step === 1 ? '건너뛰기' : '이전'}
            </Button>
            <Button
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              loading={loading}
              onPress={next}
            >
              {step === 2 ? '완료' : '다음'}
            </Button>
          </View>
        </View>

        <Text style={styles.hint}>입력하지 않아도 서비스 이용은 가능해요.</Text>
        {step === 1 && (
          <TouchableOpacity onPress={skip} style={{ alignSelf: 'center', marginTop: spacing.s4 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.accent }}>
              건너뛰고 둘러보기
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  container: { padding: spacing.s24, alignItems: 'center' },
  containerDesktop: { padding: spacing.s48, paddingVertical: spacing.s40, alignItems: 'center' },
  brandRow: { marginBottom: spacing.s20 },
  progressRow: { flexDirection: 'row', gap: spacing.s6, marginBottom: spacing.s20, width: '100%' },
  progressBar: { height: 4, borderRadius: radii.r2 },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s24,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  stepLabel: {
    fontSize: typography.fz12,
    fontWeight: typography.fw7,
    color: colors.accent,
    marginBottom: spacing.s4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.fz22,
    fontWeight: typography.fw7,
    color: colors.ink,
    marginBottom: spacing.s6,
  },
  sub: { fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent50,
    borderRadius: radii.md,
    padding: spacing.s14,
    marginBottom: spacing.s16,
    gap: spacing.s10,
  },
  infoText: { fontSize: typography.fz13, color: colors.accent700, flex: 1 },
  fieldLabel: {
    fontSize: typography.fz13,
    fontWeight: typography.fw6,
    color: colors.ink2,
    marginBottom: spacing.s8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s8, marginBottom: spacing.s16 },
  chip: {
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  chipGrow: { flex: 1, alignItems: 'center' },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  chipText: { fontSize: typography.fz13, color: colors.ink2 },
  chipTextActive: { color: colors.accent700, fontWeight: typography.fw6 },
  hint: {
    fontSize: typography.fz12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.s16,
  },
});
