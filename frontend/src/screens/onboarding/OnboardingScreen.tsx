import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, AppInput } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export default function OnboardingScreen({ navigation, route }: any) {
  const step: number = route?.params?.step ?? 1;
  const { user, setUser } = useApp();
  const { isDesktop } = useBreakpoint();

  const [form, setFormState] = React.useState({
    age:        user.age        || '',
    sex:        user.sex        || '',
    conditions: user.conditions || '',
    allergies:  user.allergies  || '',
    otherMeds:  user.otherMeds  || '',
    history:    user.history    || '',
  });
  const set = (k: string, v: string) => setFormState(prev => ({ ...prev, [k]: v }));

  const next = () => {
    if (step === 1) {
      setUser({ ...user, age: form.age, sex: form.sex });
      navigation.replace('OnboardingStep', { step: 2 });
    } else {
      setUser({ ...user, ...form, profileComplete: true });
      navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    }
  };
  const back = () => navigation.replace('OnboardingStep', { step: 1 });
  const skip = () => {
    setUser({
      ...user,
      age: '', sex: '', conditions: '', allergies: '',
      otherMeds: '', history: '', profileComplete: false,
    });
    navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
  };

  const ages  = ['20대', '30대', '40대', '50대', '60대+'];
  const sexes = ['여성', '남성', '답변 안 함'];

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[
        s.container,
        { paddingHorizontal: isDesktop ? 48 : spacing.s5 },
      ]}
      keyboardShouldPersistTaps="handled">

      {/* Brand */}
      <View style={s.brandRow}>
        <View style={s.brandLogo}><Icon name="robot" size={18} color="#fff" /></View>
        <Text style={s.brandName}>MediPT</Text>
      </View>

      {/* Progress */}
      <View style={s.progressRow}>
        <View style={[s.progressBar, { flex: 1, backgroundColor: colors.accent }]} />
        <View style={[s.progressBar, { flex: 1, backgroundColor: step === 2 ? colors.accent : colors.accent100 }]} />
      </View>

      <View style={s.card}>
        <Text style={s.stepLabel}>STEP {step} / 2</Text>

        {step === 1 ? (
          <>
            <Text style={s.title}>기본 정보를 알려주세요</Text>
            <Text style={s.sub}>입력된 정보는 개인화에만 사용돼요</Text>

            <View style={s.infoBanner}>
              <Icon name="info" size={16} color={colors.accent700} />
              <Text style={s.infoText}>입력할수록 더 개인화된 가이드를 받을 수 있어요.</Text>
            </View>

            <Text style={s.fieldLabel}>연령대</Text>
            <View style={s.chipRow}>
              {ages.map(a => (
                <TouchableOpacity key={a} style={[s.chip, form.age === a && s.chipActive]} onPress={() => set('age', a)}>
                  <Text style={[s.chipText, form.age === a && s.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>성별</Text>
            <View style={s.chipRow}>
              {sexes.map(sv => (
                <TouchableOpacity key={sv} style={[s.chip, s.chipGrow, form.sex === sv && s.chipActive]} onPress={() => set('sex', sv)}>
                  <Text style={[s.chipText, form.sex === sv && s.chipTextActive]}>{sv}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={s.title}>건강 상태를 알려주세요</Text>
            <Text style={s.sub}>기저질환·알레르기·복용약은 쉼표로 구분해 입력해주세요.</Text>

            {(['conditions', 'allergies', 'otherMeds'] as const).map((k, i) => {
              const labels       = ['기저질환', '알레르기', '현재 복용약 (처방전 외)'];
              const placeholders = ['예: 고혈압, 제2형 당뇨', '예: 페니실린, 아스피린', '예: 비타민, 오메가3'];
              return (
                <View key={k} style={{ marginBottom: 14 }}>
                  <Text style={s.fieldLabel}>{labels[i]}</Text>
                  <AppInput
                    placeholder={placeholders[i]}
                    value={form[k]}
                    onChangeText={v => set(k, v)}
                  />
                </View>
              );
            })}

            <Text style={s.fieldLabel}>병력 메모</Text>
            <AppInput
              multiline
              inputHeight={80}
              placeholder="과거 수술/입원 기록 등"
              value={form.history}
              onChangeText={v => set('history', v)}
            />
          </>
        )}

        {/* Actions */}
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={step === 1 ? skip : back} activeOpacity={0.8}>
            <Text style={s.btnGhostText}>{step === 1 ? '건너뛰기' : '이전'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} onPress={next} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>{step === 2 ? '완료' : '다음'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.hint}>입력하지 않아도 서비스 이용은 가능해요.</Text>
      {step === 1 && (
        <TouchableOpacity onPress={skip} style={{ alignSelf: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: colors.accent }}>건너뛰고 둘러보기</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.canvas },
  container:   { paddingTop: 28, paddingBottom: 40, alignItems: 'center' },
  brandRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s5 },
  brandLogo:   { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brandName:   { fontSize: 17, fontWeight: '700', color: colors.ink },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.s5, width: '100%' },
  progressBar: { height: 4, borderRadius: 2 },
  card:        { width: '100%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s5, borderWidth: 0.5, borderColor: colors.hairline, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  stepLabel:   { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 4, letterSpacing: 0.5 },
  title:       { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  sub:         { fontSize: 14, color: colors.muted, marginBottom: spacing.s4 },
  infoBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginBottom: spacing.s4, gap: 10 },
  infoText:    { fontSize: 13, color: colors.accent700, flex: 1 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 8 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.s4 },
  chip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.surface },
  chipGrow:    { flex: 1, alignItems: 'center' },
  chipActive:  { backgroundColor: colors.accent50, borderColor: colors.accent },
  chipText:    { fontSize: 13, color: colors.ink2 },
  chipTextActive: { color: colors.accent700, fontWeight: '600' },
  btnRow:      { flexDirection: 'row', gap: 12, marginTop: spacing.s5 },
  btnPrimary:  { backgroundColor: colors.accent, borderRadius: radii.pill, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost:    { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.pill, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnGhostText:   { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  hint:        { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.s4 },
});
