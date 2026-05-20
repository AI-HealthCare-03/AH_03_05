import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing } from '../../theme';

export default function OnboardingScreen({ navigation, route }: any) {
  const step: number = route?.params?.step ?? 1;
  const { user, setUser } = useApp();

  const [form, setForm] = useState({
    age: user.age || '40대',
    sex: user.sex || '여성',
    conditions: user.conditions || '',
    allergies: user.allergies || '',
    otherMeds: user.otherMeds || '',
    history: user.history || '',
  });
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const next = () => {
    if (step === 1) {
      setUser({ ...user, age: form.age, sex: form.sex });
      navigation.replace('OnboardingStep', { step: 2 });
    } else {
      setUser({ ...user, ...form, profileComplete: true });
      navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    }
  };
  const back = () => {
    if (step === 1) navigation.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
    else navigation.replace('OnboardingStep', { step: 1 });
  };
  const skip = () => {
    setUser({ ...user, profileComplete: false });
    navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
  };

  const ages  = ['20대', '30대', '40대', '50대', '60대+'];
  const sexes = ['여성', '남성', '답변 안 함'];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Brand */}
      <View style={styles.brandRow}>
        <View style={styles.brandLogo}><Icon name="robot" size={18} color="#fff" /></View>
        <Text style={styles.brandName}>MediPT</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { flex: 1, backgroundColor: colors.accent }]} />
        <View style={[styles.progressBar, { flex: 1, backgroundColor: step === 2 ? colors.accent : colors.accent100 }]} />
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
              {ages.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, form.age === a && styles.chipActive]} onPress={() => set('age', a)}>
                  <Text style={[styles.chipText, form.age === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>성별</Text>
            <View style={styles.chipRow}>
              {sexes.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, styles.chipGrow, form.sex === s && styles.chipActive]} onPress={() => set('sex', s)}>
                  <Text style={[styles.chipText, form.sex === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>건강 상태를 알려주세요</Text>
            <Text style={styles.sub}>기저질환·알레르기·복용약은 쉼표로 구분해 입력해주세요.</Text>

            {(['conditions', 'allergies', 'otherMeds'] as const).map((k, i) => {
              const labels = ['기저질환', '알레르기', '현재 복용약 (처방전 외)'];
              const placeholders = ['예: 고혈압, 제2형 당뇨', '예: 페니실린, 아스피린', '예: 비타민, 오메가3'];
              return (
                <View key={k} style={{ marginBottom: 14 }}>
                  <Text style={styles.fieldLabel}>{labels[i]}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={placeholders[i]}
                    value={form[k]}
                    onChangeText={v => set(k, v)}
                  />
                </View>
              );
            })}

            <Text style={styles.fieldLabel}>병력 메모</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="과거 수술/입원 기록 등"
              value={form.history}
              onChangeText={v => set('history', v)}
              multiline
            />
          </>
        )}

        {/* Actions */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btnGhost, { flex: 1 }]} onPress={back} activeOpacity={0.8}>
            <Text style={styles.btnGhostText}>{step === 1 ? '건너뛰기' : '이전'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={next} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{step === 2 ? '완료' : '다음'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>입력하지 않아도 서비스 이용은 가능해요.</Text>
      {step === 1 && (
        <TouchableOpacity onPress={skip} style={{ alignSelf: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: colors.accent }}>건너뛰고 둘러보기</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  container: { padding: spacing.s6, paddingTop: 56, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s5 },
  brandLogo: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brandName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.s5, width: '100%' },
  progressBar: { height: 4, borderRadius: 2 },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s6, borderWidth: 0.5, borderColor: colors.hairline },
  stepLabel: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 4, letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.muted, marginBottom: spacing.s4 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginBottom: spacing.s4, gap: 10 },
  infoText: { fontSize: 13, color: colors.accent700, flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.s4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.surface },
  chipGrow: { flex: 1, alignItems: 'center' },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.ink2 },
  chipTextActive: { color: colors.accent700, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.ink, backgroundColor: colors.surface },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: spacing.s6 },
  btnPrimary: { backgroundColor: colors.accent, borderRadius: radii.pill, height: 48, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.pill, height: 48, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.s4 },
});
