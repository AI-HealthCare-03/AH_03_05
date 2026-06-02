import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { updateMedicationDosage } from '../../api/medications';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { s } from './_ocrShared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'DrugDosage'>;

export function DrugDosageScreen({ navigation, route }: Props) {
  const { flash, ocrSession, setOcrSession } = useApp();
  const drugIndex: number | undefined = route?.params?.drugIndex;
  const medicationId: number | undefined = route?.params?.medicationId;
  const selectedDrug = route?.params?.selectedDrug;
  const fromSearch = !!selectedDrug;

  // B12: 재진입 시 저장값 복원 — "1일 3회 · 식후 30분 · 14일" 형식에서 파싱
  const existing = drugIndex !== undefined ? ocrSession.drugs[drugIndex] : undefined;
  const savedParts = (existing?.time ?? '').replace(/^1일 /, '').split(' · ');
  const [freq, setFreq] = useState(savedParts[0] || '3회');
  const [time, setTime] = useState(savedParts[1] || '식후 30분');
  const [duration, setDuration] = useState(savedParts[2] || '14일');

  const save = async () => {
    const timeStr = `1일 ${freq} · ${time} · ${duration}`; // B11: duration 포함
    if (fromSearch && drugIndex === undefined) {
      // B13: 직접 추가 플로우 — 신규 약품 push
      setOcrSession({
        ...ocrSession,
        drugs: [
          ...ocrSession.drugs,
          {
            name: selectedDrug.drug_name,
            maker: selectedDrug.manufacturer ?? '',
            time: timeStr,
            confidence: 100,
            status: 'ok',
          },
        ],
      });
    } else {
      setOcrSession({
        ...ocrSession,
        drugs: ocrSession.drugs.map((d, i) =>
          i === drugIndex ? { ...d, status: 'ok', time: timeStr, confidence: 100 } : d
        ),
      });
    }

    if (medicationId != null) {
      try {
        await updateMedicationDosage(medicationId, {
          frequency: `1일 ${freq}`,
          timing: time,
          duration,
        });
      } catch {
        flash('복용법 저장에 실패했습니다.');
        return;
      }
    }

    flash('복용법을 저장했어요');
    if (fromSearch) {
      navigation.pop(2);
    } else {
      navigation.goBack();
    }
  };

  type SectionProps = {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
  };
  const Section = ({ label, options, value, onChange }: SectionProps) => (
    <View style={{ marginBottom: spacing.s20 }}>
      <Text
        style={{
          fontSize: typography.fz13,
          fontWeight: typography.fw6,
          color: colors.ink2,
          marginBottom: spacing.s8,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s8 }}>
        {options.map((o: string) => (
          <TouchableOpacity
            key={o}
            style={[s.chip, value === o && s.chipActive]}
            onPress={() => onChange(o)}
          >
            <Text
              style={[
                { fontSize: typography.fz13 },
                value === o && { color: colors.accent700, fontWeight: typography.fw6 },
              ]}
            >
              {o}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="복용법 입력"
      back
      onBack={() => navigation.goBack()}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s20 }}
    >
      <Text style={{ fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s20 }}>
        OCR 인식값이 자동으로 채워졌어요. 내용을 확인하고 필요시 수정해 주세요.
      </Text>

      <Card shadow>
        <View style={[s.banner, s.bannerSuccess, { marginBottom: spacing.s14 }]}>
          <View style={[s.chip, { backgroundColor: colors.success }]}>
            <Text
              style={{ color: colors.white, fontSize: typography.fz11, fontWeight: typography.fw6 }}
            >
              선택됨
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.s10 }}>
            <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>
              {selectedDrug ? selectedDrug.drug_name : (existing?.name ?? '—')}
            </Text>
            {selectedDrug?.ingredient_name || selectedDrug?.manufacturer || existing?.maker ? (
              <Text style={{ fontSize: typography.fz12, color: colors.successText }}>
                {selectedDrug
                  ? [
                      selectedDrug.ingredient_name && `성분: ${selectedDrug.ingredient_name}`,
                      selectedDrug.manufacturer && `제조사: ${selectedDrug.manufacturer}`,
                    ]
                      .filter(Boolean)
                      .join(' | ')
                  : `제조사: ${existing!.maker}`}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[s.banner, s.bannerWarn, { marginBottom: spacing.s20 }]}>
          <Icon name="alert" size={16} color={colors.warning} />
          <Text
            style={{
              fontSize: typography.fz13,
              color: colors.ink2,
              flex: 1,
              marginLeft: spacing.s8,
            }}
          >
            아래 값은 OCR 자동 인식 결과입니다. 처방전과 다른 경우 직접 수정해 주세요.
          </Text>
        </View>

        <Section
          label="1일 복용 횟수"
          options={['1회', '2회', '3회', '4회']}
          value={freq}
          onChange={setFreq}
        />
        <Section
          label="복용 시간"
          options={['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복']}
          value={time}
          onChange={setTime}
        />
        <Section
          label="복용 기간"
          options={['7일', '14일', '30일', '60일', '90일', '장기복용']}
          value={duration}
          onChange={setDuration}
        />

        <Card style={{ backgroundColor: colors.surface2, marginBottom: spacing.s20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s16 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>입력 확인</Text>
            {[
              ['횟수', freq],
              ['시간', time],
              ['기간', duration],
            ].map(([k, v]) => (
              <View
                key={k}
                style={{ flexDirection: 'row', gap: spacing.s4, alignItems: 'baseline' }}
              >
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{k}</Text>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button variant="primary" size="lg" borderRadius={radii.pill} onPress={save}>
          복용법 저장하기
        </Button>
      </Card>
    </ScreenLayout>
  );
}

export default DrugDosageScreen;
