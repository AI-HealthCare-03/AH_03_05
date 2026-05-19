// auth screens: LoginScreen, SignupScreen, ForgotPasswordScreen
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../../navigation/AppNavigator';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type AuthNavProp = NativeStackNavigationProp<AuthStackParams>;

// ─── FocusableInputRow ────────────────────────────────────────────────────────

function FocusableInputRow({ icon, ...props }: any) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
      <Icon name={icon} size={16} color={focused ? colors.accent : colors.muted} />
      <TextInput
        style={[styles.input, { outlineStyle: 'none' } as any]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function PwRule({ ok, children }: { ok: boolean; children: string }) {
  return (
    <View style={styles.pwRule}>
      <Icon name={ok ? 'check-circle' : 'x'} size={13} color={ok ? colors.success : colors.muted} />
      <Text style={{ fontSize: 12, color: ok ? colors.success : colors.muted, marginLeft: 4 }}>{children}</Text>
    </View>
  );
}

function AgreeRow({ checked, onPress, label, extra }: {
  checked: boolean; onPress: () => void; label: React.ReactNode; extra?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.agreeRow} activeOpacity={0.7}>
      <View style={[styles.agreeCircle, { backgroundColor: checked ? colors.accent : 'transparent', borderWidth: checked ? 0 : 1.5 }]}>
        {checked && <Icon name="check" size={11} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        {typeof label === 'string'
          ? <Text style={{ fontSize: 13 }}>{label}</Text>
          : label}
      </View>
      {extra && <Text style={{ fontSize: 11, color: colors.muted }}>{extra}</Text>}
    </TouchableOpacity>
  );
}


// ─── BrandPanel (desktop left panel) ─────────────────────────────────────────

function BrandPanel({ tagline, desc, features }: {
  tagline: React.ReactNode; desc: string; features: { icon: string; title: string; sub: string }[];
}) {
  return (
    <View style={bp.panel}>
      {/* 브랜드 로고 — 패널 최상단 고정 */}
      <View style={bp.brandRow}>
        <View style={bp.logo}><Icon name="robot" size={16} color="#fff" /></View>
        <Text style={bp.brandName}>MediPT</Text>
      </View>

      {/* 메인 컨텐츠 — 나머지 공간에서 수직 중앙 */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={bp.tagline}>{tagline}</Text>
        <Text style={bp.desc}>{desc}</Text>
        {features.map((f, i) => (
          <View key={i} style={bp.feat}>
            <View style={bp.featIcon}><Icon name={f.icon} size={16} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={bp.featTitle}>{f.title}</Text>
              <Text style={bp.featSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const bp = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#0891B2',
    padding: 40,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 36, marginBottom: 14 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 28 },
  feat: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  featIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  featSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
});

// ─── LoginScreen ─────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: { navigation: AuthNavProp }) {
  const { user, setUser } = useApp();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const submit = () => {
    setUser({ ...user, loggedIn: true, email: email || user.email });
    // Navigate to Main — reset root stack
    (navigation as any).reset({ index: 0, routes: [{ name: 'Main' as never }] });
  };

  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"처방전 한 장이면,\n오늘의 복약·생활습관 가이드."}
          desc="의료 문서를 업로드하면 OCR로 약품을 자동 인식하고, 건강 정보를 바탕으로 개인화된 가이드를 제공합니다."
          features={[
            { icon: 'scan', title: '처방전 OCR 자동 인식', sub: '처방전 사진으로 복약 정보 추출' },
            { icon: 'pill', title: 'AI 맞춤 복약 가이드', sub: 'LLM 기반 개인화 안내 생성' },
            { icon: 'chat', title: '건강 상담 챗봇', sub: '생활습관 AI 챗봇 실시간 상담' },
          ]}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>만나서 반가워요 👋</Text>
            <Text style={[styles.authSub, { marginBottom: 24 }]}>MediPT 계정으로 로그인해주세요.</Text>
            <View style={styles.field}>
              <Text style={styles.label}>이메일</Text>
              <FocusableInputRow icon="mail" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>비밀번호</Text>
              <FocusableInputRow icon="lock" placeholder="8~20자, 영문/숫자/특수문자 3종류 이상" value={pw} onChangeText={setPw} secureTextEntry />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: colors.accent }}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>로그인</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={{ fontSize: 13, color: colors.accent }}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}><Icon name="robot" size={18} color="#fff" /></View>
          <Text style={styles.brandName}>MediPT</Text>
        </View>

        <Text style={styles.authTitle}>만나서 반가워요 👋</Text>
        <Text style={styles.authSub}>MediPT 계정으로 로그인해주세요.</Text>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>이메일</Text>
          <FocusableInputRow
            icon="mail"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>비밀번호</Text>
          <FocusableInputRow
            icon="lock"
            placeholder="8~20자, 영문/숫자/특수문자 3종류 이상"
            value={pw}
            onChangeText={setPw}
            secureTextEntry
          />
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: colors.accent }}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={submit} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>로그인</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={{ fontSize: 13, color: colors.accent }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── SignupScreen ─────────────────────────────────────────────────────────────

export function SignupScreen({ navigation }: { navigation: AuthNavProp }) {
  const { user, setUser } = useApp();
  const { isDesktop } = useBreakpoint();
  const [form, setForm] = useState({ name: '', email: '', pw: '', pw2: '' });
  const [agreed, setAgreed] = useState({ all: false, tos: true, privacy: false, sensitive: false, ai: false, marketing: false });

  // 이메일 인증 상태
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeFocused, setCodeFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

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

  const sendCode = () => {
    if (!form.email) return;
    setCodeSent(true);
    setEmailVerified(false);
    setCode('');
    setCodeError('');
  };

  const verifyCode = () => {
    // 데모: 임의 코드 "123456" 통과
    if (code === '123456') {
      setEmailVerified(true);
      setCodeError('');
    } else {
      setCodeError('인증 코드가 일치하지 않습니다.');
    }
  };

  const pwLengthOk = form.pw.length >= 8 && form.pw.length <= 20;
  const pwTypesOk = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(form.pw)).length >= 3;
  const pwNotSameOk = !!form.pw && form.pw !== form.email && form.pw !== form.name;
  const requiredOk = agreed.tos && agreed.privacy && agreed.sensitive && agreed.ai;
  const canSubmit = form.name && form.email && emailVerified && pwLengthOk && pwTypesOk && pwNotSameOk && form.pw === form.pw2 && requiredOk;

  const submit = () => {
    if (!canSubmit) return;
    setUser({ ...user, name: form.name, email: form.email, loggedIn: true, profileComplete: false });
    (navigation as any).reset({ index: 0, routes: [{ name: 'Onboarding' as never }] });
  };

  const formContent = (
    <>
      {/* 이름 */}
      <View style={styles.field}>
        <Text style={styles.label}>이름</Text>
        <TextInput style={[styles.inputPlain, { outlineStyle: 'none' } as any]} value={form.name} onChangeText={v => set('name', v)} />
      </View>

      {/* 이메일 + 인증코드 발송 */}
      <View style={styles.field}>
        <Text style={styles.label}>이메일</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.inputRow, { flex: 1 }, emailFocused && !emailVerified && styles.inputRowFocused, emailVerified && { borderColor: colors.success, borderWidth: 1.5 }]}>
            <Icon name="mail" size={16} color={emailVerified ? colors.success : emailFocused ? colors.accent : colors.muted} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              placeholder="name@example.com"
              value={form.email}
              onChangeText={v => { set('email', v); setEmailVerified(false); setCodeSent(false); setCode(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!emailVerified}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {emailVerified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="check-circle" size={14} color={colors.success} />
                <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>인증완료</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 0, paddingHorizontal: 14, height: 44, borderRadius: radii.md, opacity: form.email && !emailVerified ? 1 : 0.4 }]}
            onPress={sendCode}
            disabled={!form.email || emailVerified}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              {codeSent && !emailVerified ? '재발송' : '인증코드 발송'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 인증코드 입력 */}
        {codeSent && !emailVerified && (
          <View style={{ marginTop: 8, gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={[styles.inputRow, { flex: 1 }, codeFocused && styles.inputRowFocused, codeError ? { borderColor: colors.danger } : {}]}>
                <Icon name="lock" size={16} color={codeError ? colors.danger : codeFocused ? colors.accent : colors.muted} />
                <TextInput
                  style={[styles.input, { outlineStyle: 'none' } as any]}
                  placeholder="6자리 인증코드 입력"
                  value={code}
                  onChangeText={v => { setCode(v); setCodeError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                />
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, { marginTop: 0, paddingHorizontal: 14, height: 44, borderRadius: radii.md, opacity: code.length === 6 ? 1 : 0.4 }]}
                onPress={verifyCode}
                disabled={code.length !== 6}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>확인</Text>
              </TouchableOpacity>
            </View>
            {codeError ? (
              <Text style={{ fontSize: 12, color: colors.danger }}>{codeError}</Text>
            ) : (
              <Text style={{ fontSize: 12, color: colors.muted }}>이메일로 발송된 6자리 코드를 입력해주세요. (데모: 123456)</Text>
            )}
          </View>
        )}
      </View>

      {/* 비밀번호 */}
      <View style={styles.field}>
        <Text style={styles.label}>비밀번호</Text>
        <TextInput style={[styles.inputPlain, { outlineStyle: 'none' } as any]} secureTextEntry value={form.pw} onChangeText={v => set('pw', v)} />
        <View style={{ marginTop: 8, gap: 4 }}>
          <PwRule ok={pwLengthOk}>8자 이상 20자 이하</PwRule>
          <PwRule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</PwRule>
          <PwRule ok={pwNotSameOk}>이메일·이름과 동일하지 않음</PwRule>
        </View>
      </View>

      {/* 비밀번호 확인 */}
      <View style={styles.field}>
        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput style={[styles.inputPlain, { outlineStyle: 'none' } as any]} placeholder="비밀번호 재입력" secureTextEntry value={form.pw2} onChangeText={v => set('pw2', v)} />
      </View>

      {/* 약관 동의 */}
      <View style={[styles.card, { marginBottom: 18 }]}>
        <AgreeRow checked={agreed.all} onPress={() => toggleAgree('all')} label={<Text style={{ fontSize: 13, fontWeight: '700' }}>전체 동의 (선택 항목 포함)</Text>} />
        <View style={styles.divider} />
        <AgreeRow checked={agreed.tos}       onPress={() => toggleAgree('tos')}       label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 서비스 이용약관 동의</Text>}           extra="보기 ›" />
        <AgreeRow checked={agreed.privacy}   onPress={() => toggleAgree('privacy')}   label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 개인정보 처리방침 동의</Text>}         extra="보기 ›" />
        <AgreeRow checked={agreed.sensitive} onPress={() => toggleAgree('sensitive')} label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 민감 건강정보 수집·이용 동의</Text>}   extra="보기 ›" />
        <AgreeRow checked={agreed.ai}        onPress={() => toggleAgree('ai')}        label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> AI 분석 활용 동의</Text>}             extra="보기 ›" />
        <AgreeRow checked={agreed.marketing} onPress={() => toggleAgree('marketing')} label="[선택] 마케팅 정보 수신 동의" />
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, !canSubmit && { opacity: 0.45 }]}
        onPress={submit} disabled={!canSubmit} activeOpacity={0.85}>
        <Text style={styles.btnPrimaryText}>가입하기</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>이미 계정이 있나요? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ fontSize: 13, color: colors.accent }}>로그인</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"1분이면 가입 완료,\n오늘부터 복약 관리\n시작해요."}
          desc="이메일과 비밀번호로 간단하게 가입하고 맞춤 복약 가이드를 받아보세요."
          features={[
            { icon: 'mail',  title: '이메일 인증 회원가입', sub: '안전한 이메일 인증으로 계정을 생성해요' },
            { icon: 'scan',  title: '처방전 OCR 분석',      sub: '가입 즉시 처방전 업로드 가능' },
            { icon: 'wand',  title: 'AI 맞춤 복약 가이드',  sub: '건강 프로필 기반 개인화 안내' },
          ]}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 48, paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>계정 만들기</Text>
            <Text style={[styles.authSub, { marginBottom: 24 }]}>이메일과 비밀번호로 1분이면 가입할 수 있어요.</Text>
            {formContent}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}><Icon name="robot" size={18} color="#fff" /></View>
          <Text style={styles.brandName}>MediPT</Text>
        </View>
        <Text style={styles.authTitle}>계정 만들기</Text>
        <Text style={styles.authSub}>이메일과 비밀번호로 1분이면 가입할 수 있어요.</Text>
        {formContent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── ForgotPasswordScreen ─────────────────────────────────────────────────────

export function ForgotPasswordScreen({ navigation }: { navigation: AuthNavProp }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { isDesktop } = useBreakpoint();

  const formContent = sent ? (
    <>
      <View style={[styles.banner, styles.bannerSuccess, { marginBottom: 18 }]}>
        <Icon name="check-circle" size={16} color={colors.success} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 14 }}>메일을 보냈어요</Text>
          <Text style={{ fontSize: 12, marginTop: 2, color: colors.ink2 }}>{email} 로 재설정 링크를 보냈어요. 스팸함도 확인해주세요.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.btnGhost} onPress={() => setSent(false)} activeOpacity={0.8}>
        <Text style={styles.btnGhostText}>다른 이메일로 다시 보내기</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 13, color: colors.accent }}>로그인으로 돌아가기</Text>
      </TouchableOpacity>
    </>
  ) : (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>이메일</Text>
        <FocusableInputRow
          icon="mail"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />
      </View>
      <TouchableOpacity
        style={[styles.btnPrimary, !email && { opacity: 0.45 }]}
        onPress={() => email && setSent(true)}
        disabled={!email} activeOpacity={0.85}>
        <Text style={styles.btnPrimaryText}>재설정 링크 받기</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>기억나셨나요? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ fontSize: 13, color: colors.accent }}>로그인</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"비밀번호를 잊으셨나요?\n이메일로 재설정 링크를\n보내드릴게요."}
          desc="가입 시 사용한 이메일을 입력해주세요. 안내 메일 발송 후 24시간 안에 비밀번호를 재설정해주세요."
          features={[
            { icon: 'shield', title: '안전한 본인 인증', sub: '이메일을 통한 2단계 확인' },
            { icon: 'lock', title: '재설정 후 자동 로그아웃', sub: '다른 기기에서 다시 로그인 필요' },
          ]}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>비밀번호 찾기</Text>
            <Text style={[styles.authSub, { marginBottom: 24 }]}>가입한 이메일로 재설정 링크를 보내드려요.</Text>
            {formContent}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}><Icon name="robot" size={18} color="#fff" /></View>
          <Text style={styles.brandName}>MediPT</Text>
        </View>
        <Text style={styles.authTitle}>비밀번호 찾기</Text>
        <Text style={styles.authSub}>가입한 이메일로 재설정 링크를 보내드려요.</Text>
        {formContent}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  authContainer: {
    flexGrow: 1,
    padding: spacing.s6,
    paddingTop: 56,
    backgroundColor: colors.canvas,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s6,
  },
  brandLogo: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  brandName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  authTitle: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  authSub:   { fontSize: 14, color: colors.muted, marginBottom: spacing.s5 },
  field:     { marginBottom: spacing.s4 },
  label:     { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.md, paddingHorizontal: 12, height: 44,
    backgroundColor: colors.surface,
  },
  inputRowFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink, marginLeft: 8 },
  inputPlain: {
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.md, paddingHorizontal: 12, height: 44,
    fontSize: 14, color: colors.ink, backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  divider: { height: 0.5, backgroundColor: colors.hairline, marginVertical: 10 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  agreeCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderColor: colors.hairlineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    height: 50,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.pill, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  pwRule: { flexDirection: 'row', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
});

export default LoginScreen;
