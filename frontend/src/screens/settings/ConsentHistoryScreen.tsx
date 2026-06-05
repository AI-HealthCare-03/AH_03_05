import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';
import { usersApi } from '../../api';
import type { ConsentType } from '../../api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'ConsentHistory'>;

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

// BE 응답 매핑용 약관 타입·명칭 템플릿 (agreedAt은 BE에서만 채워짐)
const STATIC_CONSENTS: ConsentRow[] = [
  { type: 'terms', name: '서비스 이용약관', required: true, agreed: false, agreedAt: null },
  { type: 'privacy', name: '개인정보 처리방침', required: true, agreed: false, agreedAt: null },
  { type: 'sensitive_health', name: '민감 건강정보 수집·이용 동의', required: true, agreed: false, agreedAt: null },
  { type: 'ai_analysis', name: 'AI 분석 활용 동의', required: true, agreed: false, agreedAt: null },
  { type: 'marketing', name: '마케팅 수신 동의', required: false, agreed: false, agreedAt: null },
];

export function ConsentHistoryScreen({ navigation }: { navigation: NavProp }) {
  const { flash } = useApp();
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [togglingType, setTogglingType] = useState<ConsentType | null>(null);

  useEffect(() => {
    usersApi
      .getConsents()
      .then(res => {
        const beMap = new Map(res.consents.map(c => [c.consent_type, c]));
        setConsents(
          STATIC_CONSENTS.map(s => {
            const be = beMap.get(s.type);
            if (!be) return s;
            return {
              type: be.consent_type as ConsentType,
              name: s.name,
              required: be.required_type === 'required',
              agreed: be.is_agreed,
              agreedAt: be.agreed_at ? new Date(be.agreed_at).toLocaleString('ko-KR') : null,
            };
          })
        );
      })
      .catch(() => {
        setLoadError(true);
      })
      .finally(() => setLoadingConsents(false));
  }, []);

  const toggleMarketing = async (value: boolean) => {
    const prev = consents;
    setTogglingType('marketing');
    // 낙관적 업데이트
    setConsents(c =>
      c.map(item =>
        item.type === 'marketing'
          ? { ...item, agreed: value, agreedAt: value ? new Date().toLocaleString('ko-KR') : null }
          : item
      )
    );
    try {
      await usersApi.updateConsent('marketing', value);
      flash(value ? '마케팅 수신에 동의했어요' : '마케팅 수신 동의를 철회했어요');
    } catch {
      // 실패 시 롤백
      setConsents(prev);
      flash('변경에 실패했어요. 다시 시도해주세요.');
    } finally {
      setTogglingType(null);
    }
  };

  const marketingConsent = consents.find(c => c.type === 'marketing');

  return (
    <ScreenLayout
      title="약관 동의 내역"
      back
      onBack={() =>
        navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')
      }
      scrollable
    >
      {loadError && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.s8,
            backgroundColor: colors.danger50,
            borderRadius: radii.sm,
            padding: spacing.s12,
            marginBottom: spacing.s14,
          }}
        >
          <Icon name="alert" size={14} color={colors.danger} />
          <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>
            동의 내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </Text>
        </View>
      )}
      <View style={[s.banner, { backgroundColor: colors.accent50, marginBottom: spacing.s14 }]}>
        <Icon name="info" size={16} color={colors.accent700} />
        <Text
          style={{
            fontSize: typography.fz13,
            color: colors.accent700,
            flex: 1,
            marginLeft: spacing.s10,
          }}
        >
          필수 약관은 철회 시 회원탈퇴로 이어집니다.{'\n'}선택 약관(마케팅)은 언제든 변경
          가능합니다.
        </Text>
      </View>

      {loadingConsents ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.s32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <Card shadow noPadding style={{ overflow: 'hidden' }}>
          {consents.map((c, i) => (
            <View
              key={c.type}
              style={[
                { paddingHorizontal: spacing.s20, paddingVertical: spacing.s14 },
                i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.s8,
                  marginBottom: spacing.s6,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.fz14,
                    fontWeight: typography.fw6,
                    color: colors.ink,
                    flex: 1,
                  }}
                >
                  {c.name}
                </Text>
                <Badge
                  variant={
                    c.required
                      ? 'danger'
                      : c.type === 'marketing' && marketingConsent?.agreed
                        ? 'success'
                        : 'default'
                  }
                >
                  {c.required
                    ? '필수'
                    : c.type === 'marketing' && marketingConsent?.agreed
                      ? '동의함'
                      : '선택'}
                </Badge>
                {c.type === 'marketing' ? (
                  <Switch
                    value={marketingConsent?.agreed ?? false}
                    onValueChange={toggleMarketing}
                    disabled={togglingType === 'marketing'}
                    trackColor={{ true: colors.accent }}
                  />
                ) : (
                  <Badge variant={c.agreed ? 'success' : 'default'}>
                    {c.agreed ? '동의함' : '미동의'}
                  </Badge>
                )}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                  {c.type === 'marketing'
                    ? marketingConsent?.agreed
                      ? `동의일: ${marketingConsent.agreedAt}`
                      : '동의 안 함'
                    : c.agreedAt
                      ? `동의일: ${c.agreedAt}`
                      : '—'}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('LegalDoc', { docKey: DOC_KEY[c.type] })}
                    accessibilityRole="button"
                    accessibilityLabel="전문 보기"
                  >
                    <Text style={{ fontSize: typography.fz12, color: colors.accent }}>
                      전문 보기
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScreenLayout>
  );
}

export default ConsentHistoryScreen;
