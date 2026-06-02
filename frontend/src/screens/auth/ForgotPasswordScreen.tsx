import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Banner from '../../components/Banner';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandPanel, styles, type AuthNavProp } from './_authShared';
import MediPTLogo from '../../components/MediPTLogo';
import { authApi, extractApiError } from '../../api';

// ─── ForgotPasswordScreen ─────────────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const BRAND_PANEL_FEATURES = [
  { icon: 'shield', title: '안전한 본인 인증', sub: '이메일을 통한 2단계 확인' },
  { icon: 'lock', title: '재설정 후 자동 로그아웃', sub: '다른 기기에서 다시 로그인 필요' },
];

export function ForgotPasswordScreen({ navigation }: { navigation: AuthNavProp }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'confirm'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isTabletOrAbove } = useBreakpoint();
  const { top: safeTop } = useSafeAreaInsets();

  const handleRequestCode = async () => {
    if (!EMAIL_RE.test(email)) { setEmailError('올바른 이메일 형식이 아닙니다'); return; }
    setLoading(true);
    setEmailError('');
    try {
      await authApi.requestPasswordReset(email);
      setStep('confirm');
    } catch (e) {
      setEmailError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim()) { setConfirmError('인증 코드를 입력해주세요'); return; }
    if (newPassword.length < 8) { setConfirmError('비밀번호는 8자 이상이어야 합니다'); return; }
    setLoading(true);
    setConfirmError('');
    try {
      await authApi.confirmPasswordReset(email, code.trim(), newPassword);
      navigation.navigate('Login');
    } catch (e) {
      setConfirmError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const formContent = step === 'confirm' ? (
    <>
      <Banner
        variant="success"
        title="인증 코드를 보냈어요"
        body={`${email} 로 발송됐어요. 스팸함도 확인해주세요.`}
        style={{ marginBottom: spacing.s20 }}
      />
      <View style={styles.field}>
        <Input
          label="인증 코드"
          icon="shield"
          placeholder="이메일로 받은 6자리 코드"
          value={code}
          onChangeText={v => { setCode(v); setConfirmError(''); }}
          keyboardType="number-pad"
          autoFocus
        />
      </View>
      <View style={styles.field}>
        <Input
          label="새 비밀번호"
          icon="lock"
          placeholder="8자 이상"
          value={newPassword}
          onChangeText={v => { setNewPassword(v); setConfirmError(''); }}
          secureTextEntry
        />
      </View>
      {confirmError ? <Text style={[styles.fieldError, { marginBottom: spacing.s8 }]}>{confirmError}</Text> : null}
      <Button variant="primary" size="lg" onPress={handleConfirm} loading={loading} fullWidth>비밀번호 변경</Button>
      <Button variant="ghost" size="lg" onPress={() => { setStep('email'); setCode(''); setNewPassword(''); setConfirmError(''); }} fullWidth style={{ marginTop: spacing.s8 }}>다른 이메일로 다시 보내기</Button>
    </>
  ) : (
    <>
      <View style={styles.field}>
        <Input
          label="이메일"
          icon="mail"
          placeholder="name@example.com"
          value={email}
          onChangeText={v => { setEmail(v); setEmailError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />
        {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
      </View>
      <Button
        variant="primary"
        size="lg"
        disabled={!email || !EMAIL_RE.test(email)}
        onPress={handleRequestCode}
        loading={loading}
        fullWidth
      >인증 코드 받기</Button>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.s16 }}>
        <Text style={{ fontSize: typography.fz13, color: colors.muted }}>기억나셨나요? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ fontSize: typography.fz13, color: colors.accent }}>로그인</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isTabletOrAbove) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"비밀번호를 잊으셨나요?\n이메일로 재설정 링크를\n보내드릴게요."}
          desc="가입 시 사용한 이메일을 입력해주세요. 안내 메일 발송 후 24시간 안에 비밀번호를 재설정해주세요."
          features={BRAND_PANEL_FEATURES}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.s48 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>비밀번호 찾기</Text>
            <Text style={[styles.authSub, { marginBottom: spacing.s24 }]}>가입한 이메일로 재설정 링크를 보내드려요.</Text>
            {formContent}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.authContainer, { paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop) }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <MediPTLogo width={130} />
        </View>
        <Text style={styles.authTitle}>비밀번호 찾기</Text>
        <Text style={styles.authSub}>가입한 이메일로 재설정 링크를 보내드려요.</Text>
        {formContent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default ForgotPasswordScreen;
