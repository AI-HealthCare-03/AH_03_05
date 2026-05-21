import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Modal,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AppInput } from '../../theme';

// ─── ScrollView contentContainerStyle 헬퍼 ──────────────────────────────────
function useScrollStyle() {
  const { isDesktop } = useBreakpoint();
  return {
    paddingHorizontal: isDesktop ? 48 : spacing.s5,
    paddingTop: 28,
    paddingBottom: 40,
    maxWidth: 920,
    alignSelf: 'center' as any,
    width: '100%',
  };
}
import Icon from '../../components/Icon';
import BellButton from '../../components/BellButton';
import { colors, radii, spacing } from '../../theme';



// ─── Shared helpers ───────────────────────────────────────────────────────────

function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.topBar}>
      <TouchableOpacity onPress={onBack} style={s.iconBtn}>
        <Icon name="arrow-left" size={16} color={colors.ink2} />
      </TouchableOpacity>
      <Text style={[s.screenTitle, { flex: 1, marginLeft: 8 }]}>{title}</Text>
      {right}
    </View>
  );
}

function RowItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.rowItem} onPress={onPress} activeOpacity={0.7}>
      <Icon name={icon} size={16} color={danger ? colors.danger : colors.accent700} />
      <Text style={[s.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Icon name="chevron-right" size={14} color={colors.muted2} />
    </TouchableOpacity>
  );
}

function Rule({ ok, children }: { ok: boolean; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Icon name={ok ? 'check-circle' : 'x'} size={13} color={ok ? colors.success : colors.muted} />
      <Text style={{ fontSize: 12, color: ok ? colors.success : colors.muted, marginLeft: 4 }}>{children}</Text>
    </View>
  );
}


// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen({ navigation }: any) {
  const { user, flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        {/* 페이지 헤더 */}
        <View style={{ marginBottom: spacing.s4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>설정</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>알림 · 보안 · 약관 · 계정 정보를 관리해요.</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={[s.card, { gap: 12, marginBottom: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.avatar}><Icon name="user" size={22} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{user.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{user.email}</Text>
            </View>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('PersonalInfo')}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink2 }}>내 정보</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {user.profileComplete ? (
              <View style={{ backgroundColor: colors.accent50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: colors.accent700, fontWeight: '700' }}>건강정보 입력 완료</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: colors.surface2, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '600' }}>건강정보 미입력</Text>
              </View>
            )}
            {(user.age || user.sex) ? (
              <Text style={{ fontSize: 12, color: colors.muted }}>{user.age} · {user.sex}</Text>
            ) : null}
          </View>
        </View>

        {/* 건강 프로필 */}
        <SettingsGroup title="건강 프로필" icon="heart">
          <SettingsRow first label="건강 프로필 관리" desc="연령·기저질환·알레르기" onPress={() => navigation.navigate('ProfileEdit')} />
        </SettingsGroup>

        {/* 알림 */}
        <SettingsGroup title="알림" icon="notifications">
          <SettingsRow first label="알림 설정" desc="복약·가이드·시스템 알림" onPress={() => navigation.navigate('NotificationSettings')} />
        </SettingsGroup>

        {/* 보안 */}
        <SettingsGroup title="보안" icon="lock-closed">
          <SettingsRow first label="비밀번호 변경"     onPress={() => navigation.navigate('PasswordChange')} />
          <SettingsRow label="로그인 기기 관리"  onPress={() => navigation.navigate('DeviceManagement')} />
        </SettingsGroup>

        {/* 약관 및 정책 */}
        <SettingsGroup title="약관 및 정책" icon="shield-checkmark">
          <SettingsRow first label="약관 동의 내역"                onPress={() => navigation.navigate('ConsentHistory')} />
          <SettingsRow label="서비스 이용약관"               onPress={() => navigation.navigate('LegalDoc', { docKey: 'tos' })} />
          <SettingsRow label="개인정보 처리방침"              onPress={() => navigation.navigate('LegalDoc', { docKey: 'privacy' })} />
          <SettingsRow label="민감 건강정보 수집·이용 동의"   onPress={() => navigation.navigate('LegalDoc', { docKey: 'sensitive' })} />
        </SettingsGroup>

        {/* 계정 */}
        <SettingsGroup title="계정" icon="person">
          <TouchableOpacity style={s.rowItem} onPress={() => setConfirmLogout(true)}>
            <Icon name="logout" size={16} color={colors.muted} />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: colors.muted }}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]} onPress={() => navigation.navigate('DeleteAccount')}>
            <Icon name="alert" size={16} color={colors.danger} />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: colors.danger }}>회원탈퇴</Text>
          </TouchableOpacity>
        </SettingsGroup>

        <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
          본 서비스는 의료 행위를 대체하지 않으며, 참고 정보를 제공합니다.
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={confirmLogout}
        title="로그아웃 하시겠어요?"
        desc="다시 로그인하기 전까지 알림과 동기화가 중단돼요."
        confirmLabel="로그아웃"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); navigation.navigate('Auth'); flash('로그아웃 되었어요'); }}
      />
    </View>
  );
}

function SettingsGroup({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={[s.card, { padding: 0, overflow: 'hidden', marginBottom: 12 }]}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        backgroundColor: colors.canvas,
        borderBottomWidth: 0.5, borderBottomColor: colors.hairline,
      }}>
        <Icon name={icon} size={13} color={colors.accent} />
        <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '600', color: colors.muted, letterSpacing: 0.3 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SettingsRow({ label, desc, onPress, first }: { label: string; desc?: string; onPress: () => void; first?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.rowItem, !first && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
      onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{label}</Text>
        {desc && <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{desc}</Text>}
      </View>
      <Icon name="chevron-right" size={16} color={colors.muted2} />
    </TouchableOpacity>
  );
}

function ConfirmModal({ visible, title, desc, confirmLabel, onCancel, onConfirm, danger }: {
  visible: boolean; title: string; desc: string; confirmLabel: string;
  onCancel: () => void; onConfirm: () => void; danger?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, padding: 24, borderRadius: radii.xl, width: '100%', maxWidth: 360, ...{ shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 } }}>
          <Text style={{ fontSize: 17, fontWeight: '700', textAlign: 'center', color: colors.ink }}>{title}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>{desc}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            <TouchableOpacity style={[s.secondaryBtn, { flex: 1, paddingVertical: 12, alignItems: 'center' }]} onPress={onCancel}>
              <Text style={{ fontWeight: '700', color: colors.ink2 }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: danger ? colors.danger : colors.accent }}
              onPress={onConfirm}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── NotificationSettingsScreen (AlertSettings 디자인 적용) ──────────────────

export function NotificationSettingsScreen({ navigation }: any) {
  const scrollStyle = useScrollStyle();
  const [medAlert,   setMedAlert]   = useState(true);
  const [morning,    setMorning]    = useState(true);
  const [lunch,      setLunch]      = useState(false);
  const [evening,    setEvening]    = useState(true);
  const [missed,     setMissed]     = useState(true);
  const [guide,      setGuide]      = useState(true);
  const [chat,       setChat]       = useState(true);
  const [system,     setSystem]     = useState(true);
  const [marketing,  setMarketing]  = useState(false);
  const [morningTime, setMorningTime] = useState('08:30');
  const [lunchTime,   setLunchTime]   = useState('12:30');
  const [eveningTime, setEveningTime] = useState('19:00');
  const [morningType, setMorningType] = useState('정시');
  const [lunchType,   setLunchType]   = useState('정시');
  const [eveningType, setEveningType] = useState('정시');
  const { flash } = useApp();

  const mealTypes = ['정시', '식전', '식후'];

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ marginBottom: spacing.s4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
              <Icon name="arrow-left" size={16} color={colors.ink2} />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>알림 설정</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 42 }}>복약 알림 시간과 빈도를 자세히 설정할 수 있어요.</Text>
        </View>

        <AlertGroup title="복약 알림">
          <AlertRow label="복약 알림 받기" desc="각 식사 시간에 알림을 받아요" on={medAlert} onChange={setMedAlert} />
          {medAlert && (
            <>
              <MealAlertRow
                label="아침 복약" subLabel={`알림 시간 ${morningTime}`}
                on={morning} onChange={setMorning}
                time={morningTime} onTimeChange={setMorningTime}
                mealType={morningType} onTypeChange={setMorningType}
                types={mealTypes}
              />
              <MealAlertRow
                label="점심 복약" subLabel={`알림 시간 ${lunchTime}`}
                on={lunch} onChange={setLunch}
                time={lunchTime} onTimeChange={setLunchTime}
                mealType={lunchType} onTypeChange={setLunchType}
                types={mealTypes}
              />
              <MealAlertRow
                label="저녁 복약" subLabel={`알림 시간 ${eveningTime}`}
                on={evening} onChange={setEvening}
                time={eveningTime} onTimeChange={setEveningTime}
                mealType={eveningType} onTypeChange={setEveningType}
                types={mealTypes}
              />
            </>
          )}
          <AlertRow label="복약 누락 알림" desc="복약을 놓쳤을 때 알려드려요" on={missed} onChange={setMissed} />
        </AlertGroup>

        <AlertGroup title="가이드/상담">
          <AlertRow label="새 가이드 생성 알림" desc="처방전을 분석한 새 가이드가 만들어졌을 때" on={guide} onChange={setGuide} />
          <AlertRow label="상담 답변 알림"      desc="AI 상담 응답이 도착했을 때"                 on={chat}  onChange={setChat} />
        </AlertGroup>

        <AlertGroup title="시스템">
          <AlertRow label="내 정보 업데이트 권장 알림" desc="30일 이상 정보가 변경되지 않았을 때" on={system}    onChange={setSystem} />
          <AlertRow label="마케팅 정보 수신"           desc="신규 기능·이벤트 안내 (선택)"         on={marketing} onChange={setMarketing} />
        </AlertGroup>

        <TouchableOpacity
          style={[s.btnPrimary, { height: 50 }]}
          onPress={() => { flash('알림 설정이 저장됐어요'); navigation.goBack(); }}
          activeOpacity={0.85}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MealAlertRow({ label, subLabel, on, onChange, time, onTimeChange, mealType, onTypeChange, types }: {
  label: string; subLabel: string; on: boolean; onChange: (v: boolean) => void;
  time: string; onTimeChange: (v: string) => void;
  mealType: string; onTypeChange: (v: string) => void; types: string[];
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: 0.5, borderTopColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: on ? 10 : 0 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>{label}</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{subLabel}</Text>
        </View>
        <Switch value={on} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.hairlineStrong }} />
      </View>
      {on && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.md, paddingHorizontal: 10, height: 36, gap: 6, flex: 1 }}>
            <AppInput
              containerStyle={{ flex: 1, borderWidth: 0, height: 34, borderRadius: 0, paddingHorizontal: 0, backgroundColor: 'transparent' }}
              inputStyle={{ fontSize: 13 }}
              value={time} onChangeText={onTimeChange}
            />
            <Icon name="clock" size={13} color={colors.muted} />
          </View>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 10, height: 36, gap: 6 }}
              onPress={() => setTypeOpen(p => !p)}>
              <Text style={{ fontSize: 13, color: colors.ink }}>{mealType}</Text>
              <Icon name="chevron-down" size={12} color={colors.muted} />
            </TouchableOpacity>
            {typeOpen && (
              <View style={{ position: 'absolute', top: 40, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, zIndex: 100, minWidth: 72,
                shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                {types.map(t => (
                  <TouchableOpacity key={t} style={{ paddingHorizontal: 12, paddingVertical: 10 }} onPress={() => { onTypeChange(t); setTypeOpen(false); }}>
                    <Text style={{ fontSize: 13, color: t === mealType ? colors.accent700 : colors.ink, fontWeight: t === mealType ? '700' : '400' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function AlertGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[s.card, { padding: 0, overflow: 'hidden', marginBottom: 12 }]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function AlertRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>{label}</Text>
        {desc && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{desc}</Text>}
      </View>
      <Switch value={on} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.hairlineStrong }} />
    </View>
  );
}

// ─── ProfileEditScreen ────────────────────────────────────────────────────────

export function ProfileEditScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [form, setForm] = useState({
    age: user.age || '40대', sex: user.sex || '여성',
    conditions: user.conditions || '', otherMeds: user.otherMeds || '',
    allergies: user.allergies || '', pregnant: user.pregnant || '아니오',
    smoking: user.smoking || '아니오', notes: user.notes || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = () => { setUser({ ...user, ...form }); flash('저장했어요'); navigation.goBack(); };

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>건강 프로필 관리</Text>
        </View>
        <View style={s.card}>
          <View style={[s.infoBanner, { marginBottom: 20 }]}>
            <Icon name="info" size={16} color={colors.accent700} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 13, color: colors.accent700, fontWeight: '600' }}>입력할수록 더 개인화된 가이드를 받을 수 있어요.</Text>
              <Text style={{ fontSize: 12, color: colors.accent700, marginTop: 2 }}>아래 정보는 모두 선택 입력 항목입니다. (이름/이메일은 가입 시 완료)</Text>
            </View>
          </View>

          {/* 연령대 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={s.fieldLabel}>연령대 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['20대', '30대', '40대', '50대', '60대+'].map(o => (
                <TouchableOpacity key={o} style={[s.chip, form.age === o && s.chipActive]} onPress={() => set('age', o)}>
                  <Text style={[{ fontSize: 13 }, form.age === o && { color: colors.accent700, fontWeight: '600' }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 성별 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={s.fieldLabel}>성별 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['여성', '남성'].map(o => (
                <TouchableOpacity key={o} style={[s.chip, form.sex === o && s.chipActive]} onPress={() => set('sex', o)}>
                  <Text style={[{ fontSize: 13 }, form.sex === o && { color: colors.accent700, fontWeight: '600' }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 기저질환 */}
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>기저질환 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <AppInput value={form.conditions} onChangeText={v => set('conditions', v)} />
          </View>

          {/* 현재 복용약 */}
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>현재 복용약 (처방전 외) <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <AppInput placeholder="비타민, 오메가3 등 영양제 포함" value={form.otherMeds} onChangeText={v => set('otherMeds', v)} />
          </View>

          {/* 알레르기 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={s.fieldLabel}>알레르기 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <AppInput placeholder="예: 페니실린, 아스피린" value={form.allergies} onChangeText={v => set('allergies', v)} />
          </View>

          {/* 임신/수유 + 음주/흡연 — 2열 */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>임신/수유 여부 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['예', '아니오'].map(o => (
                  <TouchableOpacity key={o} style={[s.chip, form.pregnant === o && s.chipActive]} onPress={() => set('pregnant', o)}>
                    <Text style={[{ fontSize: 13 }, form.pregnant === o && { color: colors.accent700, fontWeight: '600' }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>음주/흡연 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['예', '아니오'].map(o => (
                  <TouchableOpacity key={o} style={[s.chip, form.smoking === o && s.chipActive]} onPress={() => set('smoking', o)}>
                    <Text style={[{ fontSize: 13 }, form.smoking === o && { color: colors.accent700, fontWeight: '600' }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 의사 소견 */}
          <Text style={s.fieldLabel}>의사 소견 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택 · 직접 입력)</Text></Text>
          <AppInput multiline inputHeight={80} value={form.notes} onChangeText={v => set('notes', v)} />

          <TouchableOpacity style={[s.btnPrimary, { marginTop: 20, height: 50 }]} onPress={save}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>저장하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── NotificationsScreen ──────────────────────────────────────────────────────

export function NotificationsScreen({ navigation }: any) {
  const scrollStyle = useScrollStyle();
  const { notifications, setNotifications, flash } = useApp();
  const markAll = () => { setNotifications(notifications.map(n => ({ ...n, unread: false }))); flash('모두 읽음 처리했어요'); };
  const clear   = () => { setNotifications([]); flash('알림을 모두 지웠어요'); };
  const today   = notifications.filter(n => /오늘|^\d{2}:/.test(n.time));
  const earlier = notifications.filter(n => !/오늘|^\d{2}:/.test(n.time));

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, flex: 1, marginLeft: 10 }}>알림</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={s.btnGhost} onPress={markAll}><Text style={{ fontSize: 12, color: colors.ink2 }}>모두 읽음</Text></TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={clear}><Text style={{ fontSize: 12, color: colors.ink2 }}>모두 지우기</Text></TouchableOpacity>
          </View>
        </View>
        {notifications.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 56 }]}>
            <Icon name="bell" size={36} color={colors.muted2} />
            <Text style={{ fontSize: 15, fontWeight: '600', marginTop: 14 }}>알림이 없어요</Text>
          </View>
        ) : (
          [{ label: '오늘', items: today }, { label: '이전', items: earlier }].map(g =>
            g.items.length > 0 ? (
              <View key={g.label} style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 12, color: colors.muted, paddingHorizontal: 4, marginBottom: 8 }}>{g.label}</Text>
                <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
                  {g.items.map((n, i) => (
                    <View key={n.id} style={[s.notifRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }, n.unread && { backgroundColor: colors.accent50 }]}>
                      <View style={s.notifIcon}><Icon name={n.icon} size={14} color={colors.accent700} /></View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>{n.title}</Text>
                          <Text style={{ fontSize: 12, color: colors.muted }}>{n.time}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{n.body}</Text>
                      </View>
                      {n.unread && <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.danger, marginTop: 4, marginLeft: 6 }} />}
                    </View>
                  ))}
                </View>
              </View>
            ) : null
          )
        )}
      </ScrollView>
    </View>
  );
}

// ─── PersonalInfoScreen ───────────────────────────────────────────────────────

export function PersonalInfoScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [name, setName] = useState(user.name || '');
  const [nickname, setNickname] = useState(user.nickname || '');

  // 비밀번호 변경
  const [cur, setCur]   = useState('');
  const [pw, setPw]     = useState('');
  const [pw2, setPw2]   = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const pwLengthOk = pw.length >= 8 && pw.length <= 20;
  const pwTypesOk  = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length >= 3;
  const matchOk    = !!pw && pw === pw2;
  const canChangePw = !!cur && pwLengthOk && pwTypesOk && matchOk;

  const saveInfo = () => { setUser({ ...user, name, nickname }); flash('저장했어요'); navigation.goBack(); };
  const savePw   = () => {
    if (!canChangePw) return;
    setCur(''); setPw(''); setPw2(''); setPwOpen(false);
    flash('비밀번호가 변경되었어요');
  };

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>내 정보</Text>
        </View>

        {/* 기본 정보 */}
        <View style={s.card}>
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>이름</Text>
            <AppInput value={name} onChangeText={setName} />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>닉네임 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text></Text>
            <AppInput placeholder="표시될 이름을 입력해 주세요" value={nickname} onChangeText={setNickname} />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={s.fieldLabel}>이메일</Text>
            <View style={[{ borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: 12, height: 46, justifyContent: 'center', backgroundColor: colors.canvas }]}>
              <Text style={{ fontSize: 14, color: colors.muted }}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={[s.btnPrimary, { height: 50 }]} onPress={saveInfo}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>저장하기</Text>
          </TouchableOpacity>
        </View>

        {/* 비밀번호 변경 */}
        <View style={[s.card, { padding: 0, overflow: 'hidden', marginTop: 12 }]}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            onPress={() => setPwOpen(p => !p)}
            activeOpacity={0.7}>
            <Icon name="lock-closed" size={15} color={colors.accent} />
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: colors.ink }}>비밀번호 변경</Text>
            <Icon name={pwOpen ? 'chevron-up' : 'chevron-down'} size={15} color={colors.muted2} />
          </TouchableOpacity>

          {pwOpen && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
              {[
                { label: '현재 비밀번호', val: cur, set: setCur },
                { label: '새 비밀번호',   val: pw,  set: setPw },
                { label: '새 비밀번호 확인', val: pw2, set: setPw2 },
              ].map(f => (
                <View key={f.label} style={{ marginTop: 12 }}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <AppInput secureTextEntry value={f.val} onChangeText={f.set} />
                </View>
              ))}
              <View style={{ marginTop: 10, marginBottom: 4, gap: 4 }}>
                <Rule ok={pwLengthOk}>8자 이상 20자 이하</Rule>
                <Rule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</Rule>
                <Rule ok={matchOk}>새 비밀번호와 확인이 일치</Rule>
              </View>
              <TouchableOpacity
                style={[s.btnPrimary, { height: 50, marginTop: 12, opacity: canChangePw ? 1 : 0.4 }]}
                disabled={!canChangePw} onPress={savePw}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>변경하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── PasswordChangeScreen ─────────────────────────────────────────────────────

export function PasswordChangeScreen({ navigation }: any) {
  const { flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [cur, setCur] = useState('');
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const pwLengthOk = pw.length >= 8 && pw.length <= 20;
  const pwTypesOk  = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length >= 3;
  const matchOk    = !!pw && pw === pw2;
  const canSubmit  = !!cur && pwLengthOk && pwTypesOk && matchOk;

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>비밀번호 변경</Text>
        </View>
        <View style={s.card}>
          {[
            { label: '현재 비밀번호', val: cur, set: setCur },
            { label: '새 비밀번호',  val: pw,  set: setPw },
            { label: '새 비밀번호 확인', val: pw2, set: setPw2 },
          ].map(f => (
            <View key={f.label} style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <AppInput secureTextEntry value={f.val} onChangeText={f.set} />
            </View>
          ))}
          <View style={{ marginBottom: 14 }}>
            <Rule ok={pwLengthOk}>8자 이상 20자 이하</Rule>
            <Rule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</Rule>
            <Rule ok={matchOk}>새 비밀번호와 확인이 일치</Rule>
          </View>
          <TouchableOpacity style={[s.btnPrimary, { height: 50, opacity: canSubmit ? 1 : 0.4 }]}
            disabled={!canSubmit} onPress={() => { flash('비밀번호가 변경되었어요'); navigation.goBack(); }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>변경하기</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.infoBanner, { marginTop: 14 }]}>
          <Icon name="shield" size={16} color={colors.accent700} />
          <Text style={{ fontSize: 13, color: colors.accent700, flex: 1, marginLeft: 8 }}>변경 후 다른 기기에서는 다시 로그인해야 해요.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── DeviceManagementScreen ───────────────────────────────────────────────────

export function DeviceManagementScreen({ navigation }: any) {
  const { flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [devices, setDevices] = useState([
    { id: 'd1', name: 'MacBook Air · Safari', loc: '서울, 한국', at: '지금 사용 중', current: true, icon: 'doc' },
    { id: 'd2', name: 'iPhone 15 · MediPT 앱', loc: '서울, 한국', at: '12시간 전', current: false, icon: 'device' },
    { id: 'd3', name: 'Chrome · Windows', loc: '부산, 한국', at: '3일 전', current: false, icon: 'globe' },
  ]);

  const revoke = (id: string) => { setDevices(prev => prev.filter(d => d.id !== id)); flash('해당 기기에서 로그아웃 했어요'); };

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>로그인 기기 관리</Text>
        </View>
        <View style={[s.card, { padding: 0, overflow: 'hidden', marginBottom: 18 }]}>
          {devices.map((d, i) => (
            <View key={d.id} style={[s.rowItem, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ width: 40, height: 40, borderRadius: radii.sm, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={d.icon} size={18} color={colors.accent700} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>{d.name}</Text>
                  {d.current && <View style={s.badgeSuccess}><Text style={{ fontSize: 11, color: colors.success }}>현재 기기</Text></View>}
                </View>
                <Text style={{ fontSize: 12, color: colors.muted }}>{d.loc} · {d.at}</Text>
              </View>
              {!d.current && (
                <TouchableOpacity style={s.btnGhost} onPress={() => revoke(d.id)}>
                  <Text style={{ fontSize: 12, color: colors.ink2 }}>로그아웃</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <TouchableOpacity style={[s.btnGhost, { alignItems: 'center', paddingVertical: 12 }]}
          onPress={() => { setDevices(prev => prev.filter(d => d.current)); flash('다른 기기는 모두 로그아웃 했어요'); }}>
          <Text style={{ color: colors.danger, fontSize: 14 }}>다른 모든 기기 로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── ConsentHistoryScreen ────────────────────────────────────────────────────

export function ConsentHistoryScreen({ navigation }: any) {
  const { flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [marketing, setMarketing] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);

  const consents = [
    { key: 'tos',       name: '서비스 이용약관',           required: true,  date: '2026.05.01 14:23', docKey: 'tos' },
    { key: 'privacy',   name: '개인정보 처리방침',           required: true,  date: '2026.05.01 14:23', docKey: 'privacy' },
    { key: 'sensitive', name: '민감 건강정보 수집·이용 동의', required: true,  date: '2026.05.01 14:23', docKey: 'sensitive' },
    { key: 'ai',        name: 'AI 분석 활용 동의',           required: true,  date: '2026.05.01 14:23', docKey: 'tos' },
    { key: 'marketing', name: '마케팅 수신 동의',            required: false, date: marketing ? '2026.05.01 14:23' : null, docKey: 'tos' },
  ];

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>약관 동의 내역</Text>
        </View>
        <View style={[s.banner, { backgroundColor: colors.accent50, marginBottom: 14 }]}>
          <Icon name="info" size={16} color={colors.accent700} />
          <Text style={{ fontSize: 13, color: colors.accent700, flex: 1, marginLeft: 10 }}>
            필수 약관은 철회 시 회원탈퇴로 이어집니다.{'\n'}선택 약관(마케팅)은 언제든 변경 가능합니다.
          </Text>
        </View>

        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          {consents.map((c, i) => (
            <View key={c.key} style={[{ paddingHorizontal: 16, paddingVertical: 14 }, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 }}>{c.name}</Text>
                <View style={[s.chip, { backgroundColor: c.required ? colors.danger50 : colors.surface2 }]}>
                  <Text style={{ fontSize: 11, color: c.required ? colors.danger : colors.ink2, fontWeight: '600' }}>
                    {c.required ? '필수' : '선택'}
                  </Text>
                </View>
                {c.key === 'marketing' ? (
                  <Switch
                    value={marketing}
                    onValueChange={v => { setMarketing(v); flash(v ? '마케팅 수신에 동의했어요' : '마케팅 수신 동의를 철회했어요'); }}
                    trackColor={{ true: colors.accent }}
                  />
                ) : (
                  <View style={[s.chip, { backgroundColor: colors.success50 }]}>
                    <Text style={{ fontSize: 11, color: colors.success, fontWeight: '600' }}>동의함</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {c.key === 'marketing'
                    ? (marketing ? `동의일: ${c.date}` : '동의 안 함')
                    : `동의일: ${c.date}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('LegalDoc', { docKey: c.docKey })}>
                    <Text style={{ fontSize: 12, color: colors.accent }}>전문 보기</Text>
                  </TouchableOpacity>
                  {c.required && (
                    <TouchableOpacity onPress={() => setWithdrawModal(true)}>
                      <Text style={{ fontSize: 12, color: colors.muted }}>철회 안내</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 필수 약관 철회 안내 모달 */}
        {withdrawModal && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={[s.card, { margin: 20, width: '85%' }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.danger }}>필수 약관 철회 안내</Text>
              <Text style={{ fontSize: 14, color: colors.ink2, lineHeight: 22, marginBottom: 20 }}>
                이 약관 철회는 회원탈퇴로 이어집니다.{'\n'}탈퇴를 원하시면 설정 &gt; 회원 탈퇴를 이용해주세요.
              </Text>
              <TouchableOpacity style={[s.btnPrimary, { height: 50 }]} onPress={() => setWithdrawModal(false)}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── LegalDocScreen ───────────────────────────────────────────────────────────

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
  const scrollStyle = useScrollStyle();
  const docKey: string = route?.params?.docKey || 'tos';
  const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.tos;
  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{doc.title}</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>{doc.version}</Text>
        <View style={s.card}>
          {doc.sections.map((sec, i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 8 }}>{sec.h}</Text>
              <Text style={{ fontSize: 14, color: colors.ink2, lineHeight: 22 }}>{sec.b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── DeleteAccountScreen ──────────────────────────────────────────────────────

export function DeleteAccountScreen({ navigation }: any) {
  const { user, flash } = useApp();
  const scrollStyle = useScrollStyle();
  const [step, setStep] = useState(1);
  const [checked, setChecked] = useState({ data: false, irreversible: false, alt: false });
  const [confirm, setConfirm] = useState('');
  const allChecked = checked.data && checked.irreversible && checked.alt;
  const confirmOk  = confirm === '회원 탈퇴';

  const proceed = () => {
    if (step === 1 && allChecked) setStep(2);
    else if (step === 2 && confirmOk) {
      flash('탈퇴 처리가 완료됐어요. 안녕히 가세요 👋');
      navigation.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
    }
  };

  const CheckRow = ({ k, label }: { k: keyof typeof checked; label: string }) => (
    <TouchableOpacity style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 }}
      onPress={() => setChecked(p => ({ ...p, [k]: !p[k] }))}>
      <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: checked[k] ? colors.accent : colors.hairlineStrong, backgroundColor: checked[k] ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {checked[k] && <Icon name="check" size={11} color="#fff" />}
      </View>
      <Text style={{ fontSize: 13, color: colors.ink2, flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView contentContainerStyle={scrollStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.s4 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Icon name="arrow-left" size={16} color={colors.ink2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>회원 탈퇴</Text>
        </View>
        <View style={[s.banner, s.bannerDanger, { marginBottom: 18 }]}>
          <Icon name="alert" size={16} color={colors.danger} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', color: colors.danger }}>탈퇴하면 복구할 수 없어요</Text>
            <Text style={{ fontSize: 12, color: colors.ink2, marginTop: 2 }}>아래 내용을 꼭 확인해주세요.</Text>
          </View>
        </View>

        <View style={s.card}>
          {step === 1 ? (
            <>
              <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 12 }}>탈퇴 시 삭제되는 정보</Text>
              {['건강 프로필 (기저질환, 알레르기, 복용약)', '업로드한 처방전·약봉투·진료기록 4건', 'AI 상담 기록 3건', '생성된 복약 가이드 및 알림 설정'].map((item, i) => (
                <Text key={i} style={{ fontSize: 14, color: colors.ink2, marginBottom: 4 }}>• {item}</Text>
              ))}
              <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: 16 }} />
              <CheckRow k="data" label="모든 건강 데이터가 영구 삭제되는 점에 동의합니다." />
              <CheckRow k="irreversible" label="탈퇴 후에는 복구할 수 없다는 점을 이해했습니다." />
              <CheckRow k="alt" label="복약 정보 보관이 필요하다면 데이터 내보내기 후 탈퇴할 수 있다는 점을 알고 있습니다." />
            </>
          ) : (
            <>
              <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 8 }}>최종 확인</Text>
              <Text style={{ fontSize: 13, color: colors.ink2, marginBottom: 14 }}>
                정말로 탈퇴하시려면 아래 입력란에{' '}
                <Text style={{ fontWeight: '700', color: colors.danger }}>"회원 탈퇴"</Text>를 입력해주세요.
              </Text>
              <AppInput placeholder="회원 탈퇴" value={confirm} onChangeText={setConfirm} />
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 10 }}>{user.email} 계정이 삭제됩니다.</Text>
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity style={[s.btnGhost, { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center' }]}
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink2 }}>{step === 2 ? '이전' : '취소'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnPrimary, { flex: 1, height: 50, backgroundColor: colors.danger, opacity: (step === 1 ? allChecked : confirmOk) ? 1 : 0.4 }]}
            disabled={step === 1 ? !allChecked : !confirmOk} onPress={proceed}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{step === 1 ? '다음' : '탈퇴하기'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topBar: { paddingHorizontal: spacing.s4, paddingTop: 52, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.hairline, flexDirection: 'row', alignItems: 'center' },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.s4, marginBottom: 0,
    borderWidth: 0.5, borderColor: colors.hairline,
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface2, borderRadius: radii.pill },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surface2 },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent, borderWidth: 1 },
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.ink },
  btnPrimary: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: spacing.s4, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.pill, paddingHorizontal: spacing.s4, height: 50, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent50, padding: 14 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  bannerDanger: { backgroundColor: colors.danger50 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  notifIcon: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  badgeSuccess: { backgroundColor: colors.success50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
});

export default SettingsScreen;
