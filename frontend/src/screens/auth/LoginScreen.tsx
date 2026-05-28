import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp, defaultUser } from '../../context/AppContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import axios from 'axios';
import { authApi, extractApiError } from '../../api';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandPanel, styles, type AuthNavProp } from './_authShared';
import MediPTLogo from '../../components/MediPTLogo';

// ─── LoginScreen ─────────────────────────────────────────────────────────────

const loginFeatures = [
  { icon: 'camera', title: 'OCR 문서 인식', sub: '처방전·약봉투를 자동으로 분석해요' },
  { icon: 'wand', title: '개인화 복약 가이드', sub: '건강 정보 기반 맞춤 안내를 제공해요' },
  { icon: 'chat', title: 'AI 상담', sub: '복약·생활습관 관련 질문에 답해드려요' },
];

export function LoginScreen({ navigation }: { navigation: AuthNavProp }) {
  const { user, setUser } = useApp();
  const { top: safeTop } = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', form: '' });

  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const submit = async () => {
    if (!email || !pw) return;
    if (!EMAIL_RE.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: '이메일 형식이 올바르지 않습니다' }));
      return;
    }
    setLoading(true);
    setFieldErrors({ email: '', form: '' });
    try {
      const res = await authApi.login({ email, password: pw });
      const rawFlags = await AsyncStorage.getItem('medipt_profile_flags').catch(() => null);
      const profileFlags: Record<string, boolean> = rawFlags ? JSON.parse(rawFlags) : {};
      const updatedUser = { ...defaultUser, loggedIn: true, email, name: res.user.name, nickname: '', profileComplete: profileFlags[email] ?? false };
      setUser(updatedUser);
      const destination = updatedUser.profileComplete ? 'Main' : 'Onboarding';
      (navigation as any).reset({ index: 0, routes: [{ name: destination as never }] });
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setFieldErrors(prev => ({ ...prev, form: '탈퇴한 계정입니다.' }));
      } else if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 422)) {
        setFieldErrors(prev => ({ ...prev, form: '이메일 또는 비밀번호가 올바르지 않습니다' }));
      } else if (axios.isAxiosError(e) && !e.response) {
        setFieldErrors(prev => ({ ...prev, form: '네트워크 오류가 발생했습니다. 연결을 확인해주세요' }));
      } else {
        setFieldErrors(prev => ({ ...prev, form: extractApiError(e) }));
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPw('');
      setFieldErrors({ email: '', form: '' });
    }, [])
  );

  const { isTabletOrAbove } = useBreakpoint();

  if (isTabletOrAbove) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"처방전 한 장이면,\n오늘의 복약·생활습관 가이드."}
          desc="의료 문서를 업로드하면 OCR로 약품을 자동 인식하고, 건강 정보를 바탕으로 개인화된 가이드를 제공합니다."
          features={loginFeatures}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.canvas }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>만나서 반가워요 👋</Text>
            <Text style={[styles.authSub, { marginBottom: spacing.s24 }]}>MediPT 계정으로 로그인해주세요.</Text>
            <View style={styles.field}>
              <Input icon="mail" placeholder="name@example.com" value={email} onChangeText={v => { setEmail(v); setFieldErrors(prev => ({ ...prev, email: '' })); }} autoCapitalize="none" keyboardType="email-address" label="이메일" />
              {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
            </View>
            <View style={styles.field}>
              <Input label="비밀번호" icon="lock" placeholder="8~20자, 영문/숫자/특수문자 3종류 이상" value={pw} onChangeText={setPw} secureTextEntry autoComplete="current-password" />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                <Text style={{ fontSize: typography.fz12, color: colors.accent }}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
            <Button variant="primary" size="lg" loading={loading} disabled={!email || !pw} onPress={submit} fullWidth>로그인</Button>
            {fieldErrors.form ? <Text style={styles.formError}>{fieldErrors.form}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.s16 }}>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={{ fontSize: typography.fz13, color: colors.accent }}>회원가입</Text>
              </TouchableOpacity>
            </View>
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
        <Text style={styles.authTitle}>만나서 반가워요 👋</Text>
        <Text style={styles.authSub}>MediPT 계정으로 로그인해주세요.</Text>

        <View style={styles.field}>
          <Input
            label="이메일"
            icon="mail"
            placeholder="name@example.com"
            value={email}
            onChangeText={v => { setEmail(v); setFieldErrors(prev => ({ ...prev, email: '' })); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Input
            label="비밀번호"
            icon="lock"
            placeholder="비밀번호 입력"
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            autoComplete="current-password"
          />
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.accent }}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        <Button variant="primary" size="lg" loading={loading} disabled={!email || !pw} onPress={submit} fullWidth>
          로그인
        </Button>
        {fieldErrors.form ? <Text style={styles.formError}>{fieldErrors.form}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.s16 }}>
          <Text style={{ fontSize: typography.fz13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={{ fontSize: typography.fz13, color: colors.accent }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
