// src/screens/dose-input/DoseInputScreen.tsx
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, font, shadow } from '../../theme';

const FREQ = ['1회', '2회', '3회', '4회'];
const TIMING = ['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복'];
const PERIOD = ['7일', '14일', '30일', '60일', '90일', '장기복용'];

type RouteParams = {
  name?: string;
  ingredient?: string;
  maker?: string;
};

export default function DoseInputScreen() {
  const navigation = useNavigation<any>();
  // useLocalSearchParams → useRoute().params
  const route = useRoute();
  const { name = '메트포르민정 500mg', ingredient = 'Metformin', maker = 'A제약' } = (route.params as RouteParams) ?? {};

  const [freq, setFreq] = useState('3회');
  const [timing, setTiming] = useState('식후 30분');
  const [period, setPeriod] = useState('14일');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <View style={[styles.tag, { backgroundColor: colors.successSoft }]}>
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: font.xs }}>선택됨</Text>
        </View>
        <Text style={{ fontSize: font.base, fontWeight: '700', marginTop: 8 }}>{name}</Text>
        <Text style={{ fontSize: font.xs, color: colors.mutedForeground, marginTop: 4 }}>
          성분: {ingredient} | 제조사: {maker}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningSoft, padding: 10, borderRadius: radius.md, marginVertical: 12 }}>
        <Ionicons name="warning" size={14} color={colors.warning} />
        <Text style={{ fontSize: font.xs, color: colors.warning, fontWeight: '700', flex: 1 }}>
          OCR 자동 인식 결과예요. 처방전과 다르면 직접 수정해 주세요.
        </Text>
      </View>

      <Section label="1일 복용 횟수">
        <ChipGroup options={FREQ} value={freq} onChange={setFreq} />
      </Section>
      <Section label="복용 시간">
        <ChipGroup options={TIMING} value={timing} onChange={setTiming} />
      </Section>
      <Section label="복용 기간">
        <ChipGroup options={PERIOD} value={period} onChange={setPeriod} />
      </Section>

      <View style={[styles.card, { marginTop: 8 }]}>
        <Text style={{ fontSize: font.xs, fontWeight: '700', color: colors.mutedForeground, marginBottom: 8 }}>입력 확인</Text>
        <Text style={{ fontSize: font.sm }}>
          <Text style={{ color: colors.mutedForeground }}>횟수 </Text>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{freq}</Text>
          <Text style={{ color: colors.mutedForeground }}>  시간 </Text>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{timing}</Text>
          <Text style={{ color: colors.mutedForeground }}>  기간 </Text>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{period}</Text>
        </Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('OCR')}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>복용법 저장하기</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: font.xs, fontWeight: '700', color: colors.mutedForeground, marginBottom: 8 }}>{label}</Text>
      {children}
    </View>
  );
}

function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary : colors.muted,
            }}
          >
            <Text style={{ color: active ? '#fff' : colors.foreground, fontSize: font.xs, fontWeight: '600' }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: 16, borderRadius: radius.lg, ...shadow.card },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginTop: 16 },
});
