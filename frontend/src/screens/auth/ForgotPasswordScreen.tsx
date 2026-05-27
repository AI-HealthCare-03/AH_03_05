import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandPanel, styles, type AuthNavProp } from './_authShared';

// ─── ForgotPasswordScreen ─────────────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const BRAND_PANEL_FEATURES = [
  { icon: 'shield', title: '안전한 본인 인증', sub: '이메일을 통한 2단계 확인' },
  { icon: 'lock', title: '재설정 후 자동 로그아웃', sub: '다른 기기에서 다시 로그인 필요' },
];

export function ForgotPasswordScreen({ navigation }: { navigation: AuthNavProp }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { isTabletOrAbove } = useBreakpoint();
  const { top: safeTop } = useSafeAreaInsets();

  const formContent = sent ? (
    <>
      <View style={[styles.banner, styles.bannerSuccess, { marginBottom: 18 }]}>
        <Icon name="check-circle" size={16} color={colors.success} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ fontWeight: typography.fw7, fontSize: typography.fz14 }}>메일을 보냈어요</Text>
          <Text style={{ fontSize: typography.fz12, marginTop: 2, color: colors.ink2 }}>{email} 로 재설정 링크를 보냈어요. 스팸함도 확인해주세요.</Text>
        </View>
      </View>
      <Button variant="ghost" size="lg" onPress={() => setSent(false)} fullWidth>다른 이메일로 다시 보내기</Button>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignSelf: 'center', marginTop: spacing.s16 }}>
        <Text style={{ fontSize: typography.fz13, color: colors.accent }}>로그인으로 돌아가기</Text>
      </TouchableOpacity>
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
        onPress={() => {
          if (!EMAIL_RE.test(email)) {
            setEmailError('올바른 이메일 형식이 아닙니다');
            return;
          }
          setSent(true);
        }}
        fullWidth
      >재설정 링크 받기</Button>
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
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 48 }} keyboardShouldPersistTaps="handled">
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
          <View style={styles.brandLogo}><Icon name="robot" size={18} color={colors.white} /></View>
          <Text style={styles.brandName}>MediPT</Text>
        </View>
        <Text style={styles.authTitle}>비밀번호 찾기</Text>
        <Text style={styles.authSub}>가입한 이메일로 재설정 링크를 보내드려요.</Text>
        {formContent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default ForgotPasswordScreen;
