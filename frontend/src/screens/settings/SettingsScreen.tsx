import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Switch,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s1 }}>
      <Icon name={ok ? 'check-circle' : 'x'} size={13} color={ok ? colors.success : colors.muted} />
      <Text style={{ fontSize: typography.fz12, color: ok ? colors.success : colors.muted, marginLeft: spacing.s1 }}>{children}</Text>
    </View>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen({ navigation }: any) {
  const { user, flash } = useApp();

  return (
    <ScreenLayout
      title="설정"
      subtitle="알림 · 보안 · 약관 · 계정 정보를 관리해요."
      scrollable
    >
      {/* Profile card */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s3 }}>
            <View style={s.avatar}><Icon name="user" size={20} color={colors.ink2} /></View>
            <View>
              <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7 }}>{user.name}</Text>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{user.email}</Text>
            </View>
          </View>
          <Button variant="ghost" size="sm" onPress={() => navigation.navigate('ProfileEdit')}>내 정보</Button>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.s2, marginTop: spacing.s3 }}>
          <View style={s.chip}><Text style={{ fontSize: typography.fz12 }}>건강정보 입력 완료</Text></View>
          <View style={s.chip}><Text style={{ fontSize: typography.fz12, color: colors.ink2 }}>{user.ageNum}세 · {user.sex}</Text></View>
        </View>
      </Card>

      {/* Sections */}
      {[
        [
          { icon: 'wand', label: '건강 프로필', to: 'ProfileEdit' },
          { icon: 'bell', label: '알림 설정', to: 'NotificationSettings' },
        ],
        [
          { icon: 'lock', label: '비밀번호 변경', to: 'PasswordChange' },
          { icon: 'device', label: '로그인 기기 관리', to: 'DeviceManagement' },
        ],
        [
          { icon: 'list', label: '약관 동의 내역', to: 'ConsentHistory' },
          { icon: 'list', label: '서비스 이용약관', to: 'LegalDoc', params: { docKey: 'tos' } },
          { icon: 'list', label: '개인정보 처리방침', to: 'LegalDoc', params: { docKey: 'privacy' } },
          { icon: 'list', label: '민감 건강정보 수집 · 이용 동의 내역', to: 'LegalDoc', params: { docKey: 'sensitive' } },
        ],
      ].map((sec, si) => (
        <Card key={si} noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
          {sec.map((it: any, ji) => (
            <TouchableOpacity key={it.label} style={[s.rowItem, ji > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
              onPress={() => navigation.navigate(it.to, it.params)}>
              <Icon name={it.icon} size={16} color={colors.accent700} />
              <Text style={s.rowLabel}>{it.label}</Text>
              <Icon name="chevron-right" size={14} color={colors.muted2} />
            </TouchableOpacity>
          ))}
        </Card>
      ))}

      <Card noPadding style={{ overflow: 'hidden', marginBottom: 22 }}>
        <TouchableOpacity style={s.rowItem} onPress={() => { navigation.navigate('Auth'); flash('로그아웃 되었어요'); }}>
          <Icon name="logout" size={16} color={colors.ink2} />
          <Text style={s.rowLabel}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]} onPress={() => navigation.navigate('DeleteAccount')}>
          <Icon name="trash" size={16} color={colors.danger} />
          <Text style={[s.rowLabel, { color: colors.danger }]}>회원 탈퇴</Text>
        </TouchableOpacity>
      </Card>

      <Text style={{ fontSize: typography.fz12, color: colors.muted, textAlign: 'center' }}>
        본 서비스는 의료 행위를 대체하지 않으며, 참고 정보를 제공합니다.
      </Text>
    </ScreenLayout>
  );
}

// ─── NotificationSettingsScreen ──────────────────────────────────────────────

export function NotificationSettingsScreen({ navigation }: any) {
  const { flash } = useApp();
  const [master, setMaster] = useState(true);
  const [morning, setMorning] = useState({ on: true, time: '08:30' });
  const [lunch,   setLunch]   = useState({ on: false, time: '12:30' });
  const [dinner,  setDinner]  = useState({ on: true,  time: '19:00' });
  const [newGuide, setNewGuide] = useState(true);
  const [chatReply, setChatReply] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const MealRow = ({ label, val, setVal }: any) => (
    <View style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <Switch value={val.on && master} onValueChange={v => setVal((p: any) => ({ ...p, on: v }))} disabled={!master} trackColor={{ true: colors.accent }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: master ? colors.ink : colors.muted }}>{label}</Text>
        <Text style={{ fontSize: typography.fz12, color: colors.muted }}>알림 시간 {val.time}</Text>
      </View>
      <TextInput
        style={[s.timeInput, !master && { opacity: 0.4 }]}
        value={val.time}
        onChangeText={v => setVal((p: any) => ({ ...p, time: v }))}
        editable={master && val.on}
      />
    </View>
  );

  const ToggleRow = ({ label, sub, val, onChange }: any) => (
    <View style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{label}</Text>
        {sub && <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Switch value={val} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );

  return (
    <ScreenLayout title="알림 설정" back onBack={() => navigation.goBack()} scrollable>
      <Card noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <View style={s.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7 }}>복약 알림 받기</Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>각 식사 시간에 알림을 받아요</Text>
          </View>
          <Switch value={master} onValueChange={setMaster} trackColor={{ true: colors.accent }} />
        </View>
        <MealRow label="아침 복약" val={morning} setVal={setMorning} />
        <MealRow label="점심 복약" val={lunch}   setVal={setLunch} />
        <MealRow label="저녁 복약" val={dinner}  setVal={setDinner} />
      </Card>

      <Card noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
        <ToggleRow label="새 가이드 생성 알림" sub="처방전 분석이 완료되었을 때" val={newGuide} onChange={setNewGuide} />
        <ToggleRow label="상담 답변 알림" sub="AI 상담 응답이 도착했을 때" val={chatReply} onChange={setChatReply} />
        <ToggleRow label="마케팅 정보 수신" val={marketing} onChange={setMarketing} />
      </Card>

      <Button variant="primary" size="lg" style={{ borderRadius: radii.md }} onPress={() => { flash('저장했어요'); navigation.goBack(); }} fullWidth>저장하기</Button>
    </ScreenLayout>
  );
}

// ─── ProfileEditScreen ────────────────────────────────────────────────────────

export function ProfileEditScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const [form, setForm] = useState({
    age: user.age || '40대', sex: user.sex || '여성',
    conditions: user.conditions || '', otherMeds: user.otherMeds || '',
    allergies: user.allergies || '', pregnant: user.pregnant || '아니오',
    smoking: user.smoking || '아니오', notes: user.notes || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const ages  = ['20대', '30대', '40대', '50대', '60대+'];
  const sexes = ['여성', '남성'];
  const yn    = ['예', '아니오'];

  const save = () => { setUser({ ...user, ...form }); flash('저장했어요'); navigation.goBack(); };

  return (
    <ScreenLayout title="개인 정보 수정" back onBack={() => navigation.goBack()} scrollable>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginBottom: spacing.s5 }}>
          <Icon name="info" size={16} color={colors.accent700} />
          <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: spacing.s2 }}>입력할수록 더 개인화된 가이드를 받을 수 있어요.</Text>
        </View>

        {/* Chip fields */}
        {[
          { label: '연령대', key: 'age', options: ages },
          { label: '성별', key: 'sex', options: sexes },
          { label: '임신/수유 여부', key: 'pregnant', options: yn },
          { label: '음주/흡연', key: 'smoking', options: yn },
        ].map(f => (
          <View key={f.key} style={{ marginBottom: spacing.s4 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s2 }}>{f.label} <Text style={{ color: colors.muted, fontWeight: typography.fw4 }}>(선택)</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2 }}>
              {f.options.map(o => (
                <TouchableOpacity key={o} style={[s.chip, form[f.key as keyof typeof form] === o && s.chipActive]} onPress={() => set(f.key, o)}>
                  <Text style={[{ fontSize: typography.fz13 }, form[f.key as keyof typeof form] === o && { color: colors.accent700, fontWeight: typography.fw6 }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Text fields */}
        {[
          { label: '기저질환', key: 'conditions' },
          { label: '현재 복용약 (처방전 외)', key: 'otherMeds' },
          { label: '알레르기', key: 'allergies' },
        ].map(f => (
          <View key={f.key} style={{ marginBottom: 14 }}>
            <Input
              label={`${f.label} (선택)`}
              value={form[f.key as keyof typeof form]}
              onChangeText={v => set(f.key, v)}
            />
          </View>
        ))}

        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s2 }}>의사 소견 <Text style={{ color: colors.muted, fontWeight: typography.fw4 }}>(선택)</Text></Text>
        <TextInput style={[{ borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s3, height: 80, fontSize: typography.fz14, color: colors.ink, backgroundColor: colors.surface }, { textAlignVertical: 'top' }]} multiline value={form.notes} onChangeText={v => set('notes', v)} />

        <Button variant="primary" size="lg" style={{ marginTop: spacing.s5, borderRadius: radii.md }} onPress={save} fullWidth>저장하기</Button>
      </Card>
    </ScreenLayout>
  );
}

// ─── NotificationsScreen ──────────────────────────────────────────────────────

export function NotificationsScreen({ navigation }: any) {
  const { notifications, setNotifications, flash } = useApp();
  const markAll = () => { setNotifications(notifications.map(n => ({ ...n, unread: false }))); flash('모두 읽음 처리했어요'); };
  const clear   = () => { setNotifications([]); flash('알림을 모두 지웠어요'); };
  const today   = notifications.filter(n => /오늘|^\d{2}:/.test(n.time));
  const earlier = notifications.filter(n => !/오늘|^\d{2}:/.test(n.time));

  return (
    <ScreenLayout
      title="알림"
      back
      onBack={() => navigation.goBack()}
      right={
        <View style={{ flexDirection: 'row', gap: spacing.s2 }}>
          <Button variant="ghost" size="sm" onPress={markAll}>모두 읽음</Button>
          <Button variant="ghost" size="sm" onPress={clear}>모두 지우기</Button>
        </View>
      }
      scrollable
    >
      {notifications.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: spacing.s9 }}>
          <Icon name="bell" size={36} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, marginTop: 14 }}>알림이 없어요</Text>
        </Card>
      ) : (
        [{ label: '오늘', items: today }, { label: '이전', items: earlier }].map(g =>
          g.items.length > 0 ? (
            <View key={g.label} style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: typography.fz12, color: colors.muted, paddingHorizontal: spacing.s1, marginBottom: spacing.s2 }}>{g.label}</Text>
              <Card noPadding style={{ overflow: 'hidden' }}>
                {g.items.map((n, i) => (
                  <View key={n.id} style={[s.notifRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }, n.unread && { backgroundColor: colors.accent50 }]}>
                    <View style={s.notifIcon}><Icon name={n.icon} size={14} color={colors.accent700} /></View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.s2 }}>
                        <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, flex: 1 }} numberOfLines={1}>{n.title}</Text>
                        <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{n.time}</Text>
                      </View>
                      <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s1 }}>{n.body}</Text>
                    </View>
                    {n.unread && <View style={{ width: 7, height: 7, borderRadius: radii.pill, backgroundColor: colors.danger, marginTop: spacing.s1, marginLeft: 6 }} />}
                  </View>
                ))}
              </Card>
            </View>
          ) : null
        )
      )}
    </ScreenLayout>
  );
}

// ─── PasswordChangeScreen ─────────────────────────────────────────────────────

export function PasswordChangeScreen({ navigation }: any) {
  const { flash } = useApp();
  const [cur, setCur] = useState('');
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const pwLengthOk = pw.length >= 8 && pw.length <= 20;
  const pwTypesOk  = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length >= 3;
  const matchOk    = !!pw && pw === pw2;
  const canSubmit  = !!cur && pwLengthOk && pwTypesOk && matchOk;

  return (
    <ScreenLayout title="비밀번호 변경" back onBack={() => navigation.goBack()} scrollable>
      <Card>
        {[
          { label: '현재 비밀번호', val: cur, set: setCur },
          { label: '새 비밀번호',  val: pw,  set: setPw },
          { label: '새 비밀번호 확인', val: pw2, set: setPw2 },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s2 }}>{f.label}</Text>
            <Input value={f.val} onChangeText={f.set} secureTextEntry />
          </View>
        ))}
        <View style={{ marginBottom: 14 }}>
          <Rule ok={pwLengthOk}>8자 이상 20자 이하</Rule>
          <Rule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</Rule>
          <Rule ok={matchOk}>새 비밀번호와 확인이 일치</Rule>
        </View>
        <Button
          variant="primary"
          size="lg"
          style={{ borderRadius: radii.md, opacity: canSubmit ? 1 : 0.4 }}
          onPress={() => { flash('비밀번호가 변경되었어요'); navigation.goBack(); }}
          fullWidth
        >변경하기</Button>
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginTop: 14 }}>
        <Icon name="shield" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: spacing.s2 }}>변경 후 다른 기기에서는 다시 로그인해야 해요.</Text>
      </View>
    </ScreenLayout>
  );
}

// ─── DeviceManagementScreen ───────────────────────────────────────────────────

export function DeviceManagementScreen({ navigation }: any) {
  const { flash } = useApp();
  const [devices, setDevices] = useState([
    { id: 'd1', name: 'MacBook Air · Safari', loc: '서울, 한국', at: '지금 사용 중', current: true, icon: 'doc' },
    { id: 'd2', name: 'iPhone 15 · MediPT 앱', loc: '서울, 한국', at: '12시간 전', current: false, icon: 'device' },
    { id: 'd3', name: 'Chrome · Windows', loc: '부산, 한국', at: '3일 전', current: false, icon: 'globe' },
  ]);

  const revoke = (id: string) => { setDevices(prev => prev.filter(d => d.id !== id)); flash('해당 기기에서 로그아웃 했어요'); };

  return (
    <ScreenLayout title="로그인 기기 관리" back onBack={() => navigation.goBack()} scrollable>
      <Card noPadding style={{ overflow: 'hidden', marginBottom: 18 }}>
        {devices.map((d, i) => (
          <View key={d.id} style={[s.rowItem, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={d.icon} size={18} color={colors.accent700} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.s3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s2 }}>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{d.name}</Text>
                {d.current && <Badge variant="success">현재 기기</Badge>}
              </View>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{d.loc} · {d.at}</Text>
            </View>
            {!d.current && (
              <Button variant="ghost" size="sm" onPress={() => revoke(d.id)}>로그아웃</Button>
            )}
          </View>
        ))}
      </Card>
      <Button
        variant="ghost"
        size="sm"
        onPress={() => { setDevices(prev => prev.filter(d => d.current)); flash('다른 기기는 모두 로그아웃 했어요'); }}
        fullWidth
        style={{ paddingVertical: spacing.s3 }}
      >
        <Text style={{ color: colors.danger, fontSize: typography.fz14 }}>다른 모든 기기 로그아웃</Text>
      </Button>
    </ScreenLayout>
  );
}

// ─── ConsentHistoryScreen ────────────────────────────────────────────────────

export function ConsentHistoryScreen({ navigation }: any) {
  const { flash } = useApp();
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
    <ScreenLayout title="약관 동의 내역" back onBack={() => navigation.goBack()} scrollable>
      <View style={[s.banner, { backgroundColor: colors.accent50, marginBottom: 14 }]}>
        <Icon name="info" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: 10 }}>
          필수 약관은 철회 시 회원탈퇴로 이어집니다.{'\n'}선택 약관(마케팅)은 언제든 변경 가능합니다.
        </Text>
      </View>

      <Card noPadding style={{ overflow: 'hidden' }}>
        {consents.map((c, i) => (
          <View key={c.key} style={[{ paddingHorizontal: spacing.s4, paddingVertical: 14 }, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s2, marginBottom: 6 }}>
              <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, flex: 1 }}>{c.name}</Text>
              <Badge variant={c.required ? 'danger' : 'default'}>
                {c.required ? '필수' : '선택'}
              </Badge>
              {c.key === 'marketing' ? (
                <Switch
                  value={marketing}
                  onValueChange={v => { setMarketing(v); flash(v ? '마케팅 수신에 동의했어요' : '마케팅 수신 동의를 철회했어요'); }}
                  trackColor={{ true: colors.accent }}
                />
              ) : (
                <Badge variant="success">동의함</Badge>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                {c.key === 'marketing'
                  ? (marketing ? `동의일: ${c.date}` : '동의 안 함')
                  : `동의일: ${c.date}`}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.s3 }}>
                <TouchableOpacity onPress={() => navigation.navigate('LegalDoc', { docKey: c.docKey })}>
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

      {/* 필수 약관 철회 안내 모달 */}
      {withdrawModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ margin: spacing.s5, width: '85%' }}>
            <Text style={{ fontSize: 16, fontWeight: typography.fw7, marginBottom: 10, color: colors.danger }}>필수 약관 철회 안내</Text>
            <Text style={{ fontSize: typography.fz14, color: colors.ink2, lineHeight: 22, marginBottom: spacing.s5 }}>
              이 약관 철회는 회원탈퇴로 이어집니다.{'\n'}탈퇴를 원하시면 설정 &gt; 회원 탈퇴를 이용해주세요.
            </Text>
            <Button variant="primary" size="lg" style={{ borderRadius: radii.md }} onPress={() => setWithdrawModal(false)} fullWidth>확인</Button>
          </Card>
        </View>
      )}
    </ScreenLayout>
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
  const docKey: string = route?.params?.docKey || 'tos';
  const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.tos;
  return (
    <ScreenLayout title={doc.title} back onBack={() => navigation.goBack()} scrollable>
      <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s4 }}>{doc.version}</Text>
      <Card>
        {doc.sections.map((sec, i) => (
          <View key={i} style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s2 }}>{sec.h}</Text>
            <Text style={{ fontSize: typography.fz14, color: colors.ink2, lineHeight: 22 }}>{sec.b}</Text>
          </View>
        ))}
      </Card>
    </ScreenLayout>
  );
}

// ─── DeleteAccountScreen ──────────────────────────────────────────────────────

export function DeleteAccountScreen({ navigation }: any) {
  const { user, flash } = useApp();
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
        {checked[k] && <Icon name="check" size={11} color={colors.white} />}
      </View>
      <Text style={{ fontSize: typography.fz13, color: colors.ink2, flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout title="회원 탈퇴" back onBack={() => navigation.goBack()} scrollable>
      <View style={[s.banner, s.bannerDanger, { marginBottom: 18 }]}>
        <Icon name="alert" size={16} color={colors.danger} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontWeight: typography.fw7, color: colors.danger }}>탈퇴하면 복구할 수 없어요</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.ink2, marginTop: 2 }}>아래 내용을 꼭 확인해주세요.</Text>
        </View>
      </View>

      <Card>
        {step === 1 ? (
          <>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s3 }}>탈퇴 시 삭제되는 정보</Text>
            {['건강 프로필 (기저질환, 알레르기, 복용약)', '업로드한 처방전·약봉투·진료기록 4건', 'AI 상담 기록 3건', '생성된 복약 가이드 및 알림 설정'].map((item, i) => (
              <Text key={i} style={{ fontSize: typography.fz14, color: colors.ink2, marginBottom: spacing.s1 }}>• {item}</Text>
            ))}
            <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: spacing.s4 }} />
            <CheckRow k="data" label="모든 건강 데이터가 영구 삭제되는 점에 동의합니다." />
            <CheckRow k="irreversible" label="탈퇴 후에는 복구할 수 없다는 점을 이해했습니다." />
            <CheckRow k="alt" label="복약 정보 보관이 필요하다면 데이터 내보내기 후 탈퇴할 수 있다는 점을 알고 있습니다." />
          </>
        ) : (
          <>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s2 }}>최종 확인</Text>
            <Text style={{ fontSize: typography.fz13, color: colors.ink2, marginBottom: 14 }}>
              정말로 탈퇴하시려면 아래 입력란에{' '}
              <Text style={{ fontWeight: typography.fw7, color: colors.danger }}>"회원 탈퇴"</Text>를 입력해주세요.
            </Text>
            <Input placeholder="회원 탈퇴" value={confirm} onChangeText={setConfirm} />
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 10 }}>{user.email} 계정이 삭제됩니다.</Text>
          </>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.s3, marginTop: spacing.s4 }}>
        <Button
          variant="ghost"
          size="lg"
          style={{ flex: 1 }}
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
        >{step === 2 ? '이전' : '취소'}</Button>
        <Button
          variant="danger"
          size="lg"
          style={{ flex: 1, borderRadius: radii.md, opacity: (step === 1 ? allChecked : confirmOk) ? 1 : 0.4 }}
          onPress={proceed}
        >{step === 1 ? '다음' : '탈퇴하기'}</Button>
      </View>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surface2 },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent, borderWidth: 1 },
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s5, paddingVertical: spacing.s4, gap: 14 },
  rowLabel: { flex: 1, fontSize: typography.fz14, fontWeight: typography.fw5, color: colors.ink },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: radii.md },
  bannerDanger: { backgroundColor: colors.danger50 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.s4, gap: spacing.s3 },
  notifIcon: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  timeInput: { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s2, height: 36, fontSize: typography.fz13, color: colors.ink, width: 80, textAlign: 'center' },
});

export default SettingsScreen;
