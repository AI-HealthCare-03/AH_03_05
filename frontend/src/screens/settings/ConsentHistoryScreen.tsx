import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';
import { usersApi } from '../../api';
import type { ConsentType } from '../../api';

const DOC_KEY: Record<ConsentType, 'tos' | 'privacy' | 'sensitive'> = {
  terms: 'tos',
  privacy: 'privacy',
  sensitive_health: 'sensitive',
  ai_analysis: 'sensitive',
  marketing: 'privacy',
};

interface ConsentRow {
  type: ConsentType;
  name: string;
  required: boolean;
  agreed: boolean;
  agreedAt: string | null;
}

// Static fallback — shown while loading or on fetch failure
const STATIC_CONSENTS: ConsentRow[] = [
  { type: 'terms',           name: '서비스 이용약관',           required: true,  agreed: true, agreedAt: '2026.05.01 14:23' },
  { type: 'privacy',         name: '개인정보 처리방침',           required: true,  agreed: true, agreedAt: '2026.05.01 14:23' },
  { type: 'sensitive_health',name: '민감 건강정보 수집·이용 동의', required: true,  agreed: true, agreedAt: '2026.05.01 14:23' },
  { type: 'ai_analysis',     name: 'AI 분석 활용 동의',           required: true,  agreed: true, agreedAt: '2026.05.01 14:23' },
  { type: 'marketing',       name: '마케팅 수신 동의',            required: false, agreed: false, agreedAt: null },
];

export function ConsentHistoryScreen({ navigation }: any) {
  const { flash } = useApp();
  const [consents, setConsents] = useState<ConsentRow[]>(STATIC_CONSENTS);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [togglingType, setTogglingType] = useState<ConsentType | null>(null);
  const [withdrawModal, setWithdrawModal] = useState(false);

  useEffect(() => {
    usersApi.getConsents()
      .then(res => {
        const rows: ConsentRow[] = res.consents.map(c => ({
          type: c.type,
          name: c.label,
          required: c.required,
          agreed: c.agreed,
          agreedAt: c.agreedAt ?? null,
        }));
        setConsents(rows);
      })
      .catch(() => { /* silent — keep static fallback */ })
      .finally(() => setLoadingConsents(false));
  }, []);

  const toggleMarketing = async (value: boolean) => {
    setTogglingType('marketing');
    try {
      await usersApi.updateConsent('marketing', value);
      setConsents(prev => prev.map(c =>
        c.type === 'marketing' ? { ...c, agreed: value, agreedAt: value ? new Date().toLocaleString('ko-KR') : null } : c
      ));
      flash(value ? '마케팅 수신에 동의했어요' : '마케팅 수신 동의를 철회했어요');
    } catch {
      flash('변경에 실패했어요. 다시 시도해주세요.');
    } finally {
      setTogglingType(null);
    }
  };

  const marketingConsent = consents.find(c => c.type === 'marketing');

  return (
    <ScreenLayout title="약관 동의 내역" back onBack={() => navigation.goBack()} scrollable>
      <View style={[s.banner, { backgroundColor: colors.accent50, marginBottom: 14 }]}>
        <Icon name="info" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: 10 }}>
          필수 약관은 철회 시 회원탈퇴로 이어집니다.{'\n'}선택 약관(마케팅)은 언제든 변경 가능합니다.
        </Text>
      </View>

      {loadingConsents ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.s32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <Card noPadding style={{ overflow: 'hidden' }}>
          {consents.map((c, i) => (
            <View key={c.type} style={[{ paddingHorizontal: spacing.s16, paddingVertical: 14 }, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8, marginBottom: 6 }}>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, flex: 1 }}>{c.name}</Text>
                <Badge variant={c.required ? 'danger' : 'default'}>
                  {c.required ? '필수' : '선택'}
                </Badge>
                {c.type === 'marketing' ? (
                  <Switch
                    value={marketingConsent?.agreed ?? false}
                    onValueChange={toggleMarketing}
                    disabled={togglingType === 'marketing'}
                    trackColor={{ true: colors.accent }}
                  />
                ) : (
                  <Badge variant={c.agreed ? 'success' : 'default'}>{c.agreed ? '동의함' : '미동의'}</Badge>
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                  {c.type === 'marketing'
                    ? (marketingConsent?.agreed ? `동의일: ${marketingConsent.agreedAt}` : '동의 안 함')
                    : (c.agreedAt ? `동의일: ${c.agreedAt}` : '—')}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('LegalDoc', { docKey: DOC_KEY[c.type] })}>
                    <Text style={{ fontSize: typography.fz12, color: colors.accent }}>전문 보기</Text>
                  </TouchableOpacity>
                  {c.required && (
                    <TouchableOpacity onPress={() => setWithdrawModal(true)}>
                      <Text style={{ fontSize: typography.fz12, color: colors.muted }}>철회 안내</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      {withdrawModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ margin: spacing.s20, width: '85%' }}>
            <Text style={{ fontSize: 16, fontWeight: typography.fw7, marginBottom: 10, color: colors.danger }}>필수 약관 철회 안내</Text>
            <Text style={{ fontSize: typography.fz14, color: colors.ink2, lineHeight: 22, marginBottom: spacing.s20 }}>
              이 약관 철회는 회원탈퇴로 이어집니다.{'\n'}탈퇴를 원하시면 설정 &gt; 회원 탈퇴를 이용해주세요.
            </Text>
            <Button variant="primary" size="lg" style={{ borderRadius: radii.md }} onPress={() => setWithdrawModal(false)} fullWidth>확인</Button>
          </Card>
        </View>
      )}
    </ScreenLayout>
  );
}

export default ConsentHistoryScreen;
