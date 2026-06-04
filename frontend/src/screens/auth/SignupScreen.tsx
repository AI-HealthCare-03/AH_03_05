import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useApp, defaultUser } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { colors, radii, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import axios from 'axios';
import { authApi, extractApiError } from '../../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandPanel, styles, type AuthNavProp } from './_authShared';
import MediPTLogo from '../../components/MediPTLogo';

// ─── SignupScreen internals ───────────────────────────────────────────────────

const TERMS_CONTENT: Record<string, { title: string; body: string }> = {
  tos: {
    title: '서비스 이용약관',
    body: '제1조(목적)\n본 약관은 MediPT 서비스 이용에 관한 조건 및 절차, 회사와 이용자의 권리·의무·책임 사항을 규정합니다.\n\n제2조(이용 계약 체결)\n이용자는 본 약관에 동의함으로써 이용 계약을 체결합니다.\n\n제3조(서비스 이용)\n서비스는 의료 정보 제공 보조 목적으로만 사용되며, 진단·처방을 대체하지 않습니다.',
  },
  privacy: {
    title: '개인정보 처리방침',
    body: '1. 수집 항목\n이메일, 이름, 닉네임, 서비스 이용 기록\n\n2. 수집 목적\n회원 식별, 서비스 제공, 고객 지원\n\n3. 보유 기간\n회원 탈퇴 후 30일 내 파기 (관계 법령에 따른 보존 기간 제외)\n\n4. 제3자 제공\n원칙적으로 제3자에게 제공하지 않습니다.',
  },
  sensitive: {
    title: '민감 건강정보 수집·이용 동의',
    body: '수집 항목: 만성질환, 알레르기, 복용 중인 약물, 병력 메모\n\n이용 목적: 개인화된 복약 가이드 및 AI 분석 제공\n\n보유 기간: 회원 탈퇴 후 즉시 파기\n\n민감정보는 암호화되어 저장되며 의료진에게 자동 전송되지 않습니다.',
  },
  ai: {
    title: 'AI 분석 활용 동의',
    body: '귀하의 건강 프로필 및 처방 정보는 AI 복약 가이드 생성에 활용됩니다.\n\nAI가 생성한 정보는 참고용이며, 실제 의료 판단을 대체하지 않습니다.\n\n분석 결과는 외부 AI 모델(LLM API)에 전달될 수 있으며, 개인 식별 정보는 제외됩니다.',
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    body: '이메일, 앱 푸시 알림을 통해 서비스 업데이트, 건강 정보, 이벤트 안내를 받으실 수 있습니다.\n\n동의하지 않으셔도 서비스 이용에 불이익이 없습니다.\n\n언제든지 설정 > 알림에서 수신 거부가 가능합니다.',
  },
};

function AgreeRow({
  checked,
  onPress,
  label,
  extra,
  onPressExtra,
}: {
  checked: boolean;
  onPress: () => void;
  label: React.ReactNode;
  extra?: string;
  onPressExtra?: () => void;
}) {
  return (
    <View style={styles.agreeRow}>
      <TouchableOpacity
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.s10 }}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.agreeCircle,
            {
              backgroundColor: checked ? colors.accent : 'transparent',
              borderWidth: checked ? 0 : 1.5,
            },
          ]}
        >
          {checked && <Icon name="check" size={11} color={colors.white} />}
        </View>
        <View style={{ flex: 1 }}>
          {typeof label === 'string' ? (
            <Text style={{ fontSize: typography.fz13 }}>{label}</Text>
          ) : (
            label
          )}
        </View>
      </TouchableOpacity>
      {extra && (
        <TouchableOpacity
          onPress={onPressExtra}
          disabled={!onPressExtra}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              fontSize: typography.fz11,
              color: onPressExtra ? colors.accent : colors.muted,
            }}
          >
            {extra}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── SignupScreen ─────────────────────────────────────────────────────────────

export function SignupScreen({ navigation }: { navigation: AuthNavProp }) {
  const { setUser, flash } = useApp();
  const { isTabletOrAbove } = useBreakpoint();
  const { top: safeTop } = useSafeAreaInsets();
  const [form, setForm] = useState({ name: '', nickname: '', email: '', pw: '', pw2: '' });
  const [agreed, setAgreed] = useState({
    all: false,
    tos: false,
    privacy: false,
    sensitive: false,
    ai: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirm: '',
    form: '',
  });
  const [termsModal, setTermsModal] = useState<keyof typeof TERMS_CONTENT | null>(null);

  // 이메일 인증 상태
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 비밀번호/확인 touched 상태
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleAgree = (k: string) => {
    if (k === 'all') {
      const v = !agreed.all;
      setAgreed({ all: v, tos: v, privacy: v, sensitive: v, ai: v, marketing: v });
    } else {
      setAgreed(prev => {
        const next = { ...prev, [k]: !prev[k as keyof typeof prev] } as typeof prev;
        next.all = next.tos && next.privacy && next.sensitive && next.ai && next.marketing;
        return next;
      });
    }
  };

  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const sendCode = async () => {
    if (!form.email || cooldown > 0) return;
    if (!EMAIL_RE.test(form.email)) {
      setFieldErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
      return;
    }
    setFieldErrors(prev => ({ ...prev, email: '' }));
    setSendingCode(true);
    try {
      await authApi.sendVerificationCode({ email: form.email });
      setCodeSent(true);
      setEmailVerified(false);
      setCode('');
      setCodeError('');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        setFieldErrors(prev => ({ ...prev, email: '이미 가입된 이메일입니다.' }));
      } else if (status === 429) {
        const retryAfter = e?.response?.data?.retry_after ?? 60;
        startCooldown(retryAfter);
        setCodeSent(true);
        setCodeError('');
      } else {
        setFieldErrors(prev => ({ ...prev, email: extractApiError(e) }));
      }
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return;
    setVerifyingCode(true);
    try {
      await authApi.verifyEmailCode({ email: form.email, code: code.trim() });
      setEmailVerified(true);
      setCodeError('');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) {
        setCodeError('인증 코드가 올바르지 않습니다.');
      } else {
        setCodeError(extractApiError(e));
      }
    } finally {
      setVerifyingCode(false);
    }
  };

  const pwLengthOk = form.pw.length >= 8 && form.pw.length <= 20;
  const pwUpperOk = /[A-Z]/.test(form.pw);
  const pwLowerOk = /[a-z]/.test(form.pw);
  const pwNumberOk = /[0-9]/.test(form.pw);
  const pwSpecialOk = /[^A-Za-z0-9]/.test(form.pw);
  const pwNotSameOk =
    form.pw.length === 0 ||
    ((form.name.length === 0 || !form.pw.toLowerCase().includes(form.name.toLowerCase())) &&
      (form.email.length === 0 || !form.pw.toLowerCase().includes(form.email.toLowerCase())));
  const pwAllOk = pwLengthOk && pwUpperOk && pwLowerOk && pwNumberOk && pwSpecialOk && pwNotSameOk;

  const requiredOk = agreed.tos && agreed.privacy && agreed.sensitive && agreed.ai;
  const canSubmit =
    form.name &&
    form.name.length >= 2 &&
    form.email &&
    emailVerified &&
    pwAllOk &&
    form.pw === form.pw2 &&
    requiredOk;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setFieldErrors({ email: '', password: '', confirm: '', form: '' });
    try {
      const resolvedNickname = form.nickname.trim() || form.name;
      await authApi.signup({
        email: form.email,
        password: form.pw,
        name: form.name,
        nickname: resolvedNickname,
        consents: [
          { consent_type: 'terms', is_agreed: agreed.tos },
          { consent_type: 'privacy', is_agreed: agreed.privacy },
          { consent_type: 'sensitive_health', is_agreed: agreed.sensitive },
          { consent_type: 'ai_analysis', is_agreed: agreed.ai },
          { consent_type: 'marketing', is_agreed: agreed.marketing },
        ],
      });
      try {
        await authApi.login({ email: form.email, password: form.pw });
        setUser({
          ...defaultUser,
          name: form.name,
          nickname: resolvedNickname,
          email: form.email,
          loggedIn: true,
          profileComplete: false,
        });
        (navigation as any).reset({ index: 0, routes: [{ name: 'Onboarding' as never }] });
      } catch {
        flash('자동 로그인에 실패했습니다. 로그인 화면에서 다시 시도해주세요.');
        navigation.navigate('Login');
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setFieldErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
        setEmailVerified(false);
        setCodeSent(false);
      } else if (axios.isAxiosError(e) && !e.response) {
        setFieldErrors(prev => ({
          ...prev,
          form: '네트워크 오류가 발생했습니다. 연결을 확인해주세요',
        }));
      } else {
        setFieldErrors(prev => ({ ...prev, form: extractApiError(e) }));
      }
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 미충족 항목 텍스트
  const pwUnmet =
    passwordTouched && !pwAllOk
      ? (() => {
          const items: string[] = [];
          if (!pwLengthOk) items.push('8자 이상 20자 이하');
          if (!pwUpperOk) items.push('대문자 포함');
          if (!pwLowerOk) items.push('소문자 포함');
          if (!pwNumberOk) items.push('숫자 포함');
          if (!pwSpecialOk) items.push('특수문자 포함');
          return items.length > 0 ? `${items.join(', ')} 필요` : '';
        })()
      : '';

  const formContent = (
    <>
      {/* 이름 */}
      <View style={styles.field}>
        <Text style={styles.label}>이름</Text>
        <Input
          value={form.name}
          onChangeText={v => set('name', v)}
          onBlur={() => setNameTouched(true)}
          style={{ outlineStyle: 'none' } as any}
          {...({ minLength: undefined, pattern: undefined } as any)}
        />
        {nameTouched && form.name.length > 0 && form.name.length < 2 && (
          <Text style={styles.fieldError}>이름은 2자 이상 입력해주세요</Text>
        )}
      </View>

      {/* 닉네임 (선택) */}
      <View style={styles.field}>
        <Text style={styles.label}>닉네임</Text>
        <Input
          placeholder="미입력 시 이름으로 표시돼요"
          value={form.nickname}
          onChangeText={v => set('nickname', v)}
          style={{ outlineStyle: 'none' } as any}
        />
      </View>

      {/* 이메일 + 인증코드 발송 */}
      <View style={styles.field}>
        <Text style={styles.label}>이메일</Text>
        <View style={{ flexDirection: 'row', gap: spacing.s8 }}>
          <View
            style={[
              styles.inputRow,
              { flex: 1, overflow: 'hidden' },
              emailFocused && !emailVerified && styles.inputRowFocused,
              emailVerified && { borderColor: colors.success, borderWidth: 1.5 },
            ]}
          >
            <Icon
              name="mail"
              size={16}
              color={emailVerified ? colors.success : emailFocused ? colors.accent : colors.muted}
            />
            <TextInput
              style={[styles.input, { outlineStyle: 'none', flexShrink: 1, minWidth: 0 } as any]}
              placeholder="name@example.com"
              placeholderTextColor={colors.muted2}
              value={form.email}
              onChangeText={v => {
                set('email', v);
                setEmailVerified(false);
                setCodeSent(false);
                setCode('');
                setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="new-password"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {emailVerified && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.s4,
                  flexShrink: 0,
                  paddingLeft: spacing.s8,
                }}
              >
                <Icon name="check-circle" size={14} color={colors.success} />
                <Text
                  style={{
                    fontSize: typography.fz12,
                    color: colors.success,
                    fontWeight: typography.fw6,
                  }}
                >
                  인증완료
                </Text>
              </View>
            )}
          </View>
          <Button
            variant="primary"
            size="sm"
            disabled={!form.email || emailVerified || cooldown > 0 || sendingCode}
            loading={sendingCode}
            onPress={sendCode}
            style={{ alignSelf: 'center', height: 44 }}
          >
            {cooldown > 0
              ? `재발송 (${cooldown}초)`
              : codeSent && !emailVerified
                ? '재발송'
                : '인증코드 발송'}
          </Button>
        </View>

        {/* 이메일 필드 에러 */}
        {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}

        {/* 인증코드 입력 */}
        {codeSent && !emailVerified && (
          <View style={{ marginTop: spacing.s8, gap: spacing.s6 }}>
            <View style={{ flexDirection: 'row', gap: spacing.s8 }}>
              <Input
                icon="lock"
                placeholder="6자리 인증코드 입력"
                value={code}
                onChangeText={v => {
                  setCode(v);
                  setCodeError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={codeError || undefined}
                containerStyle={{ flex: 1 }}
              />
              <Button
                variant="primary"
                size="sm"
                disabled={code.length !== 6 || verifyingCode}
                loading={verifyingCode}
                onPress={verifyCode}
                style={{ alignSelf: 'flex-start', height: 44 }}
              >
                확인
              </Button>
            </View>
            {!codeError && (
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                이메일로 발송된 6자리 코드를 입력해주세요. (데모: 123456)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 비밀번호 */}
      <View style={styles.field}>
        <Text style={styles.label}>비밀번호</Text>
        <Input
          secureTextEntry
          placeholder="영문 대소문자, 숫자, 특수문자 포함 8자 이상"
          value={form.pw}
          onChangeText={v => {
            set('pw', v);
            setPasswordTouched(true);
          }}
          onBlur={() => setPasswordTouched(true)}
          autoComplete="new-password"
          style={{ outlineStyle: 'none' } as any}
        />
        {pwUnmet ? <Text style={styles.fieldError}>{pwUnmet}</Text> : null}
      </View>

      {/* 비밀번호 확인 */}
      <View style={styles.field}>
        <Text style={styles.label}>비밀번호 확인</Text>
        <Input
          placeholder="비밀번호 재입력"
          secureTextEntry
          value={form.pw2}
          onChangeText={v => {
            set('pw2', v);
            setConfirmTouched(true);
          }}
          onBlur={() => setConfirmTouched(true)}
          autoComplete="new-password"
          style={{ outlineStyle: 'none' } as any}
        />
        {confirmTouched && form.pw !== form.pw2 ? (
          <Text style={styles.fieldError}>비밀번호가 일치하지 않습니다.</Text>
        ) : null}
      </View>

      {/* 약관 동의 */}
      <Card style={{ marginBottom: spacing.s20 }}>
        <AgreeRow
          checked={agreed.all}
          onPress={() => toggleAgree('all')}
          label={
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw7 }}>
              전체 동의 (선택 항목 포함)
            </Text>
          }
        />
        <View style={styles.divider} />
        <AgreeRow
          checked={agreed.tos}
          onPress={() => toggleAgree('tos')}
          label={
            <Text style={{ fontSize: typography.fz13 }}>
              <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>[필수]</Text>{' '}
              서비스 이용약관 동의
            </Text>
          }
          extra="보기 ›"
          onPressExtra={() => setTermsModal('tos')}
        />
        <AgreeRow
          checked={agreed.privacy}
          onPress={() => toggleAgree('privacy')}
          label={
            <Text style={{ fontSize: typography.fz13 }}>
              <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>[필수]</Text>{' '}
              개인정보 처리방침 동의
            </Text>
          }
          extra="보기 ›"
          onPressExtra={() => setTermsModal('privacy')}
        />
        <AgreeRow
          checked={agreed.sensitive}
          onPress={() => toggleAgree('sensitive')}
          label={
            <Text style={{ fontSize: typography.fz13 }}>
              <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>[필수]</Text> 민감
              건강정보 수집·이용 동의
            </Text>
          }
          extra="보기 ›"
          onPressExtra={() => setTermsModal('sensitive')}
        />
        <AgreeRow
          checked={agreed.ai}
          onPress={() => toggleAgree('ai')}
          label={
            <Text style={{ fontSize: typography.fz13 }}>
              <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>[필수]</Text> AI
              분석 활용 동의
            </Text>
          }
          extra="보기 ›"
          onPressExtra={() => setTermsModal('ai')}
        />
        <AgreeRow
          checked={agreed.marketing}
          onPress={() => toggleAgree('marketing')}
          label="[선택] 마케팅 정보 수신 동의"
          extra="보기 ›"
          onPressExtra={() => setTermsModal('marketing')}
        />
      </Card>

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!canSubmit}
        onPress={submit}
        fullWidth
      >
        가입하기
      </Button>
      {fieldErrors.form ? <Text style={styles.formError}>{fieldErrors.form}</Text> : null}

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.s16 }}>
        <Text style={{ fontSize: typography.fz13, color: colors.muted }}>이미 계정이 있나요? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ fontSize: typography.fz13, color: colors.accent }}>로그인</Text>
        </TouchableOpacity>
      </View>

      {/* 약관 모달 */}
      <Modal
        visible={termsModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.scrim,
            justifyContent: isTabletOrAbove ? 'center' : 'flex-end',
            alignItems: isTabletOrAbove ? 'center' : 'stretch',
          }}
        >
          <View
            style={[
              { backgroundColor: colors.surface, maxHeight: '72%' },
              isTabletOrAbove
                ? { borderRadius: radii.r16, width: '90%', maxWidth: 560 }
                : { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.s20,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.hairline,
              }}
            >
              <Text
                style={{
                  fontSize: typography.fz17,
                  fontWeight: typography.fw7,
                  color: colors.ink,
                  flex: 1,
                }}
              >
                {termsModal ? TERMS_CONTENT[termsModal].title : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setTermsModal(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={20} color={colors.ink2} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.s20 }}>
              <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 22 }}>
                {termsModal ? TERMS_CONTENT[termsModal].body : ''}
              </Text>
            </ScrollView>
            <View
              style={{ padding: spacing.s20, borderTopWidth: 0.5, borderTopColor: colors.hairline }}
            >
              <Button variant="primary" size="lg" onPress={() => setTermsModal(null)} fullWidth>
                확인
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  if (isTabletOrAbove) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={'1분이면 가입 완료,\n오늘부터 복약 관리\n시작해요.'}
          desc="이메일과 비밀번호로 간단하게 가입하고 맞춤 복약 가이드를 받아보세요."
          features={[
            {
              icon: 'mail',
              title: '이메일 인증 회원가입',
              sub: '안전한 이메일 인증으로 계정을 생성해요',
            },
            { icon: 'scan', title: '처방전 OCR 분석', sub: '가입 즉시 처방전 업로드 가능' },
            { icon: 'wand', title: 'AI 맞춤 복약 가이드', sub: '건강 프로필 기반 개인화 안내' },
          ]}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.canvas }}
          contentContainerStyle={{ padding: spacing.s48, paddingVertical: spacing.s40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>계정 만들기</Text>
            <Text style={[styles.authSub, { marginBottom: spacing.s24 }]}>
              이메일과 비밀번호로 1분이면 가입할 수 있어요.
            </Text>
            {formContent}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.authContainer,
          {
            paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop),
            paddingBottom: spacing.s56,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <MediPTLogo width={130} />
        </View>
        <Text style={styles.authTitle}>계정 만들기</Text>
        <Text style={styles.authSub}>이메일과 비밀번호로 1분이면 가입할 수 있어요.</Text>
        {formContent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default SignupScreen;
