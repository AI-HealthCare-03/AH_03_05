// auth screens: LoginScreen, SignupScreen, ForgotPasswordScreen
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, useWindowDimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../../navigation/AppNavigator';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';



// 아이콘 없는 포커스 인풋 (회원가입 name/pw 필드용)
function FocusableInput({ style, ...props }: any) {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      style={[
        styles.inputPlain,
        focused && styles.inputRowFocused,
        { outlineStyle: 'none' } as any,
        style,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor={colors.muted2}
      {...props}
    />
  );
}

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

function AgreeRow({ checked, onPress, label, extra, onExtra }: {
  checked: boolean; onPress: () => void; label: React.ReactNode; extra?: string; onExtra?: () => void;
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
      {extra && (
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onExtra?.(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 12, color: colors.accent }}>{extra}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── TermsModal (보기 › 클릭 시 약관 내용 표시) ──────────────────────────────

const TERMS_DATA: Record<string, { title: string; content: string }> = {
  tos: {
    title: '서비스 이용약관',
    content: `제1조 (목적)\n본 약관은 MediPT(이하 "서비스")가 제공하는 복약 관리 서비스의 이용 조건을 규정합니다.\n\n제2조 (서비스 내용)\n서비스는 처방전 OCR 인식, AI 복약 가이드, 건강 상담 챗봇 기능을 제공합니다. 본 서비스는 의료 행위를 대체하지 않으며, 참고 정보 제공을 목적으로 합니다.\n\n제3조 (이용자 의무)\n이용자는 정확한 정보를 입력하고, 서비스를 법령 및 본 약관에 따라 이용해야 합니다.\n\n제4조 (서비스 중단)\n시스템 점검·장애 등 불가피한 경우 서비스를 일시 중단할 수 있습니다.\n\n제5조 (면책)\n서비스 제공 정보는 의료 전문가의 진단·처방을 대체하지 않으며, 이에 따른 손해에 대해 책임지지 않습니다.`,
  },
  privacy: {
    title: '개인정보 처리방침',
    content: `1. 수집 항목\n이름, 이메일, 연령대, 성별, 기저질환, 알레르기, 복용약 정보\n\n2. 수집 목적\n서비스 제공, 복약 가이드 생성, 건강 상담 AI 활용\n\n3. 보유 기간\n회원 탈퇴 시 즉시 파기 (단, 법령에 따라 보관이 필요한 경우 제외)\n\n4. 제3자 제공\n이용자 동의 없이 제3자에게 제공하지 않습니다.\n\n5. 이용자 권리\n언제든지 개인정보 조회·수정·삭제를 요청할 수 있습니다.`,
  },
  sensitive: {
    title: '민감 건강정보 수집·이용 동의',
    content: `1. 수집 항목\n기저질환, 알레르기, 복용약, 처방전 이미지\n\n2. 수집 목적\nAI 복약 가이드 생성 및 건강 상담 서비스 제공\n\n3. 보관 기간\n회원 탈퇴 시 즉시 파기. 처방전 이미지는 OCR 처리 완료 후 90일 후 자동 삭제됩니다.\n\n4. 동의 거부 권리\n동의를 거부하실 수 있으나, 이 경우 서비스 이용이 제한됩니다.`,
  },
  ai: {
    title: 'AI 분석 활용 동의',
    content: `1. 활용 목적\n입력하신 건강 정보를 AI 모델에 제공하여 개인화된 복약 가이드 및 상담 답변을 생성합니다.\n\n2. 활용 범위\n복약 가이드 생성, 약물 상호작용 분석, 건강 상담 응답\n\n3. 비식별화\nAI 분석에 사용되는 데이터는 비식별화 처리됩니다.\n\n4. 동의 거부\n거부 시 AI 기반 맞춤 서비스 이용이 제한됩니다.`,
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    content: `수집 목적: 신규 기능 안내, 이벤트 정보, 건강 정보 콘텐츠 제공\n\n수신 채널: 이메일, 앱 푸시 알림\n\n수신 거부: 설정 > 알림 설정에서 언제든지 철회 가능합니다.\n\n이 동의는 선택 사항으로, 거부하셔도 기본 서비스 이용에 제한이 없습니다.`,
  },
};

function TermsModal({ docKey, onClose }: { docKey: string | null; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  if (!docKey || !TERMS_DATA[docKey]) return null;
  const { title, content } = TERMS_DATA[docKey];

  const inner = (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={16} color={colors.ink2} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: isWide ? 420 : 340 }}>
        <Text style={{ fontSize: 13, color: colors.ink2, lineHeight: 22 }}>{content}</Text>
      </ScrollView>
      <TouchableOpacity
        style={{ backgroundColor: colors.accent, borderRadius: radii.md, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}
        onPress={onClose}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>확인</Text>
      </TouchableOpacity>
    </>
  );

  if (isWide) {
    // 데스크탑: 화면 중앙 다이얼로그
    return (
      <Modal visible animationType="fade" transparent onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 520,
            shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
          }}>
            {inner}
          </View>
        </View>
      </Modal>
    );
  }

  // 모바일: 하단 시트
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
          {inner}
        </View>
      </View>
    </Modal>
  );
}


// ─── BrandPanel (desktop left panel) ─────────────────────────────────────────

function BrandPanel({ tagline, desc, features }: {
  tagline: React.ReactNode; desc: string; features: { icon: string; title: string; sub: string }[];
}) {
  return (
    <View style={bp.panel}>
      {/* 장식 원 */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ position: 'absolute', bottom: 100, right: 10, width: 160, height: 160, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' }} />

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
            <View style={bp.featIcon}><Icon name={f.icon} size={14} color="rgba(255,255,255,0.9)" /></View>
            <View style={{ flex: 1 }}>
              <Text style={bp.featTitle}>{f.title}</Text>
              <Text style={bp.featSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 푸터 */}
      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>
        © 2026 MediPT — 본 서비스는 의료 행위가 아닌 정보 제공 서비스입니다.
      </Text>
    </View>
  );
}

const bp = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#0891B2',
    padding: 40,
    overflow: 'hidden' as const,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 36, marginBottom: 14 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 28 },
  feat: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  featIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  featTitle: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  featSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
});

// ─── LoginScreen ─────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: { navigation: AuthNavProp }) {
  const { user, setUser } = useApp();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const { isDesktop } = useBreakpoint();

  const submit = () => {
    setUser({ ...user, loggedIn: true, email: email || user.email });
    (navigation as any).reset({ index: 0, routes: [{ name: 'Main' as never }] });
  };

  const loginFeatures = [
    { icon: 'scan',   title: 'OCR 자동 인식 · 식약처 약품 검색', sub: '처방전 사진으로 복약 정보 추출' },
    { icon: 'wand',   title: '공식협회 가이드라인 기반 안내',     sub: 'LLM 기반 개인화 복약 안내 생성' },
    { icon: 'shield', title: '민감 건강정보 암호화 보관',        sub: '안전한 데이터 보호' },
  ];

  const formContent = (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>이메일</Text>
        <FocusableInputRow icon="mail" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.muted2} />
      </View>
      <View style={styles.field}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.label}>비밀번호</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ fontSize: 12, color: colors.accent }}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
        <FocusableInputRow icon="lock" placeholder="8~20자, 영문/숫자/특수문자 3종류 이상" value={pw} onChangeText={setPw} secureTextEntry placeholderTextColor={colors.muted2} />
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
      <Text style={{ fontSize: 11, color: colors.muted2, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
        5회 연속 실패 시 10분간 로그인이 제한됩니다.{'\n'}
        로그인하면 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
      </Text>
    </>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"처방전 한 장이면,\n오늘의 복약·생활습관 가이드."}
          desc="의료 문서를 업로드하면 OCR로 약품을 자동 인식하고, 건강 정보를 바탕으로 개인화된 가이드를 제공합니다."
          features={loginFeatures}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
            <Text style={styles.authTitle}>다시 만나서 반가워요 👋</Text>
            <Text style={[styles.authSub, { marginBottom: 28 }]}>MediPT 계정으로 로그인해주세요.</Text>
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
        <Text style={styles.authTitle}>다시 만나서 반가워요 👋</Text>
        <Text style={styles.authSub}>MediPT 계정으로 로그인해주세요.</Text>
        {formContent}
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
  const [termsModal, setTermsModal] = useState<null | 'tos' | 'privacy' | 'sensitive' | 'ai' | 'marketing'>(null);

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
        <FocusableInput value={form.name} onChangeText={(v: string) => set('name', v)} placeholder="2~20자, 한글/영문" />
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
        <FocusableInput secureTextEntry value={form.pw} onChangeText={(v: string) => set('pw', v)} placeholder="8~20자" />
        <View style={{ marginTop: 8, gap: 4 }}>
          <PwRule ok={pwLengthOk}>8자 이상 20자 이하</PwRule>
          <PwRule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</PwRule>
          <PwRule ok={pwNotSameOk}>이메일·이름과 동일하지 않음</PwRule>
        </View>
      </View>

      {/* 비밀번호 확인 */}
      <View style={styles.field}>
        <Text style={styles.label}>비밀번호 확인</Text>
        <FocusableInput secureTextEntry placeholder="비밀번호 재입력" value={form.pw2} onChangeText={(v: string) => set('pw2', v)} />
      </View>

      {/* 약관 동의 */}
      <View style={[styles.card, { marginBottom: 18 }]}>
        <AgreeRow checked={agreed.all} onPress={() => toggleAgree('all')} label={<Text style={{ fontSize: 13, fontWeight: '700' }}>전체 동의 (선택 항목 포함)</Text>} />
        <View style={styles.divider} />
        <AgreeRow checked={agreed.tos}       onPress={() => toggleAgree('tos')}       label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 서비스 이용약관 동의</Text>}           extra="보기 ›" onExtra={() => setTermsModal('tos')} />
        <AgreeRow checked={agreed.privacy}   onPress={() => toggleAgree('privacy')}   label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 개인정보 처리방침 동의</Text>}         extra="보기 ›" onExtra={() => setTermsModal('privacy')} />
        <AgreeRow checked={agreed.sensitive} onPress={() => toggleAgree('sensitive')} label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> 민감 건강정보 수집·이용 동의</Text>}   extra="보기 ›" onExtra={() => setTermsModal('sensitive')} />
        <AgreeRow checked={agreed.ai}        onPress={() => toggleAgree('ai')}        label={<Text style={{ fontSize: 13 }}><Text style={{ color: colors.danger, fontWeight: '600' }}>[필수]</Text> AI 분석 활용 동의</Text>}             extra="보기 ›" onExtra={() => setTermsModal('ai')} />
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

      {/* 약관 모달 — 보기 › 클릭 시 */}
      <TermsModal docKey={termsModal} onClose={() => setTermsModal(null)} />
    </>
  );

  const signupFeatures = [
    { icon: 'mail',   title: '이메일 인증 회원가입',   sub: '안전한 본인 확인으로 계정 생성' },
    { icon: 'scan',   title: '처방전 OCR 분석',        sub: '가입 즉시 처방전 업로드 가능' },
    { icon: 'shield', title: '민감 건강정보 별도 동의', sub: '안전하게 보관·관리합니다' },
  ];

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <BrandPanel
          tagline={"오늘의 처방을\n나에게 맞는 가이드로."}
          desc="가입은 1분이면 충분해요. 입력한 건강 정보는 모두 암호화되며 AI 답변에만 활용됩니다."
          features={signupFeatures}
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
  authTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  authSub:   { fontSize: 13, color: colors.muted, marginBottom: spacing.s5 },
  field:     { marginBottom: spacing.s4 },
  label:     { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radii.md, paddingHorizontal: 12, height: 46,
    backgroundColor: colors.canvas,
  },
  inputRowFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink, marginLeft: 8 },
  inputPlain: {
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radii.md, paddingHorizontal: 12, height: 46,
    fontSize: 14, color: colors.ink, backgroundColor: colors.canvas,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s5,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    borderRadius: radii.md,       // 목표: radii.md (12)
    height: 50,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radii.md, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  pwRule: { flexDirection: 'row', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
});

export default LoginScreen;
