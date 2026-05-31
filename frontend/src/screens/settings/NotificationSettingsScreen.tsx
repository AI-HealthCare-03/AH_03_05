import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { scheduleMedicationNotifications } from '../../utils/notifications';
import { useApp } from '../../context/AppContext';
import { getMedicationAlarms, updateMedicationAlarm } from '../../api/medications';
import { notificationSettingsApi } from '../../api';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

type MealState = { on: boolean; time: string };
type MealKey = 'morning' | 'lunch' | 'dinner';

function timeStrToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeStr(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

type MealRowProps = {
  label: string;
  val: MealState;
  setVal: React.Dispatch<React.SetStateAction<MealState>>;
  master: boolean;
  onTimePress: () => void;
};

function MealRow({ label, val, setVal, master, onTimePress }: MealRowProps) {
  const active = master && val.on;
  return (
    <View style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: master ? colors.ink : colors.muted }}>
          {label}
        </Text>
        <Text style={{ fontSize: typography.fz12, color: colors.muted }}>알림 시간 {val.time}</Text>
      </View>

      {Platform.OS === 'web' ? (
        // @ts-ignore — web only HTML element
        <input
          type="time"
          value={val.time}
          disabled={!active}
          onChange={(e: any) => setVal(p => ({ ...p, time: e.target.value }))}
          style={webTimeInput(active)}
        />
      ) : (
        <TouchableOpacity
          style={[s.timeInput, !active && { opacity: 0.4 }]}
          onPress={onTimePress}
          disabled={!active}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: typography.fz13, color: active ? colors.ink : colors.muted, textAlign: 'center' }}>
            {val.time}
          </Text>
        </TouchableOpacity>
      )}

      <Switch
        value={val.on && master}
        onValueChange={v => setVal(p => ({ ...p, on: v }))}
        disabled={!master}
        trackColor={{ true: colors.accent }}
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
  const { flash, notifSettings, setNotifSettings } = useApp();
  const [master, setMaster]   = useState(notifSettings.master);
  const [morning, setMorning] = useState<MealState>(notifSettings.morning);
  const [lunch,   setLunch]   = useState<MealState>(notifSettings.lunch);
  const [dinner,  setDinner]  = useState<MealState>(notifSettings.dinner);
  const [newGuide,    setNewGuide]    = useState(notifSettings.newGuide);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [systemAlarm, setSystemAlarm] = useState(false);
  const [chatReply,   setChatReply]   = useState(notifSettings.chatReply);
  const [marketing,   setMarketing]   = useState(notifSettings.marketing);
  const [pickerOpen, setPickerOpen] = useState<MealKey | null>(null);

  useEffect(() => {
    notificationSettingsApi.getNotificationSettings()
      .then(res => {
        setNewGuide(res.guide_complete_alarm);
        setOcrComplete(res.ocr_complete_alarm);
        setSystemAlarm(res.system_alarm);
      })
      .catch(() => {});
  }, []);

  const getMealState = (key: MealKey): MealState =>
    key === 'morning' ? morning : key === 'lunch' ? lunch : dinner;

  const setMealTime = (key: MealKey, time: string) => {
    if (key === 'morning') setMorning(p => ({ ...p, time }));
    else if (key === 'lunch') setLunch(p => ({ ...p, time }));
    else setDinner(p => ({ ...p, time }));
  };

  const handlePickerChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPickerOpen(null);
    if (date && pickerOpen !== null) setMealTime(pickerOpen, dateToTimeStr(date));
  };

  const save = async () => {
    const next = { master, morning, lunch, dinner, newGuide, chatReply, marketing };
    setNotifSettings(next);
    await scheduleMedicationNotifications(next).catch(() => {});

    notificationSettingsApi.updateNotificationSettings({
      guide_complete_alarm: newGuide,
      ocr_complete_alarm: ocrComplete,
      system_alarm: systemAlarm,
    }).catch(() => flash('설정 저장에 실패했습니다.'));

    try {
      const meds = await getMedicationAlarms();
      if (meds.length > 0) {
        const alarm_times = master
          ? [morning, lunch, dinner].filter(m => m.on).map(m => m.time)
          : [];
        await Promise.all(
          meds.map(med => updateMedicationAlarm(med.id, { alarm_times, is_alarm_enabled: master }))
        );
      }
    } catch {
      // 로컬 설정은 이미 적용됨 — BE 동기화 실패는 무시
    }

    flash('저장했어요');
    navigation.goBack();
  };

  const pickerDate = pickerOpen ? timeStrToDate(getMealState(pickerOpen).time) : new Date();

  return (
    <ScreenLayout title="알림 설정" back onBack={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')} scrollable>
      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <View style={s.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7 }}>복약 알림 받기</Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>각 식사 시간에 알림을 받아요</Text>
          </View>
          <Switch value={master} onValueChange={setMaster} trackColor={{ true: colors.accent }} />
        </View>
        <MealRow label="아침 복약" val={morning} setVal={setMorning} master={master} onTimePress={() => setPickerOpen('morning')} />
        <MealRow label="점심 복약" val={lunch}   setVal={setLunch}   master={master} onTimePress={() => setPickerOpen('lunch')} />
        <MealRow label="저녁 복약" val={dinner}  setVal={setDinner}  master={master} onTimePress={() => setPickerOpen('dinner')} />
      </Card>

      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <ToggleRow label="새 가이드 생성 알림"  sub="처방전 분석이 완료되었을 때"  val={newGuide}    onChange={setNewGuide} />
        <ToggleRow label="OCR 처리 완료 알림"  sub="문서 OCR 분석이 완료됐을 때"  val={ocrComplete} onChange={setOcrComplete} />
        <ToggleRow label="시스템 알림"         sub="서비스 공지 및 중요 안내"      val={systemAlarm} onChange={setSystemAlarm} />
        <ToggleRow label="상담 답변 알림"      sub="AI 상담 응답이 도착했을 때"   val={chatReply}   onChange={setChatReply} />
        <ToggleRow label="마케팅 정보 수신"                                         val={marketing}   onChange={setMarketing} />
      </Card>

      <Button variant="primary" size="lg" borderRadius={radii.pill} onPress={save} fullWidth>저장하기</Button>

      {/* Android: system time dialog (렌더링되면 즉시 다이얼로그 표시) */}
      {Platform.OS === 'android' && pickerOpen !== null && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* iOS: 하단 모달 spinner */}
      {Platform.OS === 'ios' && (
        <Modal visible={pickerOpen !== null} transparent animationType="fade">
          <TouchableOpacity style={ps.backdrop} onPress={() => setPickerOpen(null)} activeOpacity={1}>
            <View style={ps.sheet}>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handlePickerChange}
                textColor={colors.ink}
                style={{ width: '100%' }}
              />
              <Button
                variant="primary"
                size="lg"
                borderRadius={radii.pill}
                onPress={() => setPickerOpen(null)}
                fullWidth
              >확인</Button>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScreenLayout>
  );
}

export default NotificationSettingsScreen;

function webTimeInput(active: boolean): object {
  return {
    border: `1px solid ${colors.hairlineStrong}`,
    borderRadius: radii.md,
    paddingLeft: spacing.s8,
    paddingRight: spacing.s8,
    height: 36,
    width: 80,
    fontSize: typography.fz13,
    color: active ? colors.ink : colors.muted,
    background: 'transparent',
    textAlign: 'center',
    opacity: active ? 1 : 0.4,
    cursor: active ? 'pointer' : 'not-allowed',
  };
}

const ps = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.s20,
    paddingBottom: spacing.s32,
  },
});
