import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';

const LEGAL_DOCS: Record<string, { title: string; version: string; sections: { h: string; b: string }[] }> = {
  tos: {
    title: '서비스 이용약관', version: 'v2.3 · 2026.01.01 시행',
    sections: [
      { h: '제1조 (목적)', b: '본 약관은 MediPT 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.' },
      { h: '제4조 (의료 자문 대체 금지)', b: '본 서비스는 의료 행위가 아니며, 의사·약사 등 의료 전문가의 상담을 대체할 수 없습니다.' },
    ],
  },
  privacy: {
    title: '개인정보 처리방침', version: 'v1.7 · 2026.03.15 시행',
    sections: [
      { h: '1. 수집하는 개인정보 항목', b: '필수: 이름, 이메일, 비밀번호\n선택: 연령대, 성별, 기저질환, 알레르기, 복용약 정보' },
      { h: '5. 제3자 제공', b: '회사는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.' },
    ],
  },
  sensitive: {
    title: '민감 건강정보 수집 · 이용 동의 내역', version: '최종 동의일 2026.05.01',
    sections: [
      { h: '수집 항목', b: '기저질환, 알레르기, 복용 중 약물, 처방전 이미지 및 OCR 추출 텍스트, AI 상담 대화 기록' },
      { h: '보관 기간', b: '회원 탈퇴 시 즉시 파기. 원본 처방전 이미지는 OCR 처리 완료 후 90일 후 자동 삭제됩니다.' },
    ],
  },
};

export function LegalDocScreen({ navigation, route }: any) {
  const docKey: string = route?.params?.docKey || 'tos';
  const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.tos;
  return (
    <ScreenLayout title={doc.title} back onBack={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')} scrollable>
      <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s16 }}>{doc.version}</Text>
      <Card shadow>
        {doc.sections.map((sec) => (
          <View key={sec.h} style={{ marginBottom: spacing.s20 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s8 }}>{sec.h}</Text>
            <Text style={{ fontSize: typography.fz14, color: colors.ink2, lineHeight: 22 }}>{sec.b}</Text>
          </View>
        ))}
      </Card>
    </ScreenLayout>
  );
}

export default LegalDocScreen;
