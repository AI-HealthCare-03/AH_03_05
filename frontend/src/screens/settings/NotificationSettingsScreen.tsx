import React, { useState } from 'react';
import { View, Text, Switch, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

type MealState = { on: boolean; time: string };

type MealRowProps = {
  label: string;
  val: MealState;
  setVal: React.Dispatch<React.SetStateAction<MealState>>;
  master: boolean;
};

function MealRow({ label, val, setVal, master }: MealRowProps) {
  return (
    <View style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <Switch value={val.on && master} onValueChange={v => setVal(p => ({ ...p, on: v }))} disabled={!master} trackColor={{ true: colors.accent }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: master ? colors.ink : colors.muted }}>{label}</Text>
        <Text style={{ fontSize: typography.fz12, color: colors.muted }}>알림 시간 {val.time}</Text>
      </View>
      <TextInput
        style={[s.timeInput, !master && { opacity: 0.4 }]}
        value={val.time}
        onChangeText={v => setVal(p => ({ ...p, time: v }))}
        editable={master && val.on}
      />
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  sub?: string;
  val: boolean;
  onChange: (v: boolean) => void;
};

function ToggleRow({ label, sub, val, onChange }: ToggleRowProps) {
  return (
    <View style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{label}</Text>
        {sub && <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Switch value={val} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}

export function NotificationSettingsScreen({ navigation }: any) {
  const { flash } = useApp();
  const [master, setMaster] = useState(true);
  const [morning, setMorning] = useState<MealState>({ on: true, time: '08:30' });
  const [lunch,   setLunch]   = useState<MealState>({ on: false, time: '12:30' });
  const [dinner,  setDinner]  = useState<MealState>({ on: true,  time: '19:00' });
  const [newGuide, setNewGuide] = useState(true);
  const [chatReply, setChatReply] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <ScreenLayout title="알림 설정" back onBack={() => navigation.goBack()} scrollable>
      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <View style={s.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7 }}>복약 알림 받기</Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>각 식사 시간에 알림을 받아요</Text>
          </View>
          <Switch value={master} onValueChange={setMaster} trackColor={{ true: colors.accent }} />
        </View>
        <MealRow label="아침 복약" val={morning} setVal={setMorning} master={master} />
        <MealRow label="점심 복약" val={lunch}   setVal={setLunch}  master={master} />
        <MealRow label="저녁 복약" val={dinner}  setVal={setDinner} master={master} />
      </Card>

      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <ToggleRow label="새 가이드 생성 알림" sub="처방전 분석이 완료되었을 때" val={newGuide} onChange={setNewGuide} />
        <ToggleRow label="상담 답변 알림" sub="AI 상담 응답이 도착했을 때" val={chatReply} onChange={setChatReply} />
        <ToggleRow label="마케팅 정보 수신" val={marketing} onChange={setMarketing} />
      </Card>

      <Button variant="primary" size="lg" borderRadius={radii.pill} onPress={() => { flash('저장했어요'); navigation.goBack(); }} fullWidth>저장하기</Button>
    </ScreenLayout>
  );
}

export default NotificationSettingsScreen;
