import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { notificationsApi, recordsApi } from '../../api';
import type { Notification } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParams, RootStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<HomeStackParams, 'Home'>;
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import SectionHeader from '../../components/SectionHeader';
import ScreenLayout from '../../components/ScreenLayout';
import BellButton from '../../components/BellButton';
import ProgressBar from '../../components/ProgressBar';
import EmptyState from '../../components/EmptyState';

// ─── Month calendar helpers ───────────────────────────────────────────────────

type DayStatus = 'today' | 'done' | 'missed' | 'future';

function useMonthData(y: number, m: number): { day: number; status: DayStatus }[] {
  const days = new Date(y, m, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const today = now.getDate();
  const arr = [];
  for (let d = 1; d <= days; d++) {
    let status: DayStatus = 'future';
    if (isCurrentMonth) {
      if (d < today) status = d % 7 === 1 || d === 5 || d === 11 || d === 19 ? 'missed' : 'done';
      else if (d === today) status = 'today';
    } else if (m < now.getMonth() + 1 || y < now.getFullYear()) {
      status = d % 7 === 1 || d % 13 === 0 ? 'missed' : 'done';
    }
    arr.push({ day: d, status });
  }
  return arr;
}

type MonthCalendarProps = {
  y: number;
  m: number;
  data: { day: number; status: 'today' | 'done' | 'missed' | 'future' }[];
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (day: number) => void;
  selectedDay: number;
  showTodayBtn: boolean;
  onToday: () => void;
};

function MonthCalendar({
  y,
  m,
  data,
  onPrev,
  onNext,
  onDayClick,
  selectedDay,
  showTodayBtn,
  onToday,
}: MonthCalendarProps) {
  const firstDay = new Date(y, m - 1, 1).getDay();
  const weekHeads = ['일', '월', '화', '수', '목', '금', '토'];
  const blanks = Array.from({ length: firstDay });
  const colorFor = (s: DayStatus) =>
    s === 'done'
      ? colors.success
      : s === 'missed'
        ? colors.danger
        : s === 'today'
          ? colors.accent
          : colors.hairlineStrong;

  return (
    <View>
      <View style={s.calHeader}>
        <TouchableOpacity onPress={onPrev} style={s.iconBtn} accessibilityLabel="이전 달">
          <Icon name="chevron-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s10 }}>
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>
            {y}년 {m}월
          </Text>
          {showTodayBtn && (
            <TouchableOpacity onPress={onToday} style={s.chipSmall}>
              <Text style={{ fontSize: typography.fz11, color: colors.accent700 }}>오늘</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onNext} style={s.iconBtn} accessibilityLabel="다음 달">
          <Icon name="chevron-right" size={16} color={colors.ink2} />
        </TouchableOpacity>
      </View>
      <View style={s.calGrid}>
        {weekHeads.map((d, i) => (
          <Text
            key={d}
            style={[
              s.calWeekHead,
              { color: i === 0 ? colors.danger : i === 6 ? colors.accent700 : colors.muted },
            ]}
          >
            {d}
          </Text>
        ))}
        {blanks.map((_, i) => (
          <View key={'b' + i} style={s.calCell} />
        ))}
        {data.map(({ day, status }) => {
          const dow = (firstDay + day - 1) % 7;
          const isToday = status === 'today';
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[s.calCell, isToday && s.calToday, isSelected && !isToday && s.calSelected]}
              onPress={() => onDayClick(day)}
            >
              <Text
                style={[
                  s.calDayText,
                  isToday && { color: colors.white },
                  isSelected && !isToday && { color: colors.accent700, fontWeight: typography.fw7 },
                  dow === 0 && !isToday && { color: colors.danger },
                  dow === 6 && !isToday && { color: colors.accent700 },
                ]}
              >
                {day}
              </Text>
              <View
                style={{
                  width: status === 'missed' ? 4 : 16,
                  height: 3,
                  borderRadius: radii.pill,
                  marginTop: spacing.s4,
                  backgroundColor: isToday ? colors.onAccent60 : colorFor(status),
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: { navigation: NavProp }) {
  const {
    user,
    drugs,
    setDrugs,
    adherence,
    streak,
    chats,
    flash,
    setNotifications,
    setUnreadCount,
  } = useApp();
  const { isTabletOrAbove } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [drugsLoading, setDrugsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      notificationsApi
        .getUnreadCount()
        .then(res => {
          setUnreadCount(res.unread_count);
        })
        .catch(() => flash('알림 개수를 불러오지 못했어요'));

      notificationsApi
        .getNotifications()
        .then(res => {
          const mapped: Notification[] = res.items.map(item => {
            const d = item.created_at ? new Date(item.created_at) : new Date();
            return {
              id: String(item.notification_id),
              type: 'info' as const,
              title: item.title,
              body: item.message ?? '',
              date: d.toISOString(),
              time: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
              icon: 'bell',
              unread: !item.is_read,
            };
          });
          setNotifications(mapped);
        })
        .catch(() => flash('알림 목록을 불러오지 못했어요'));

      recordsApi
        .getRecords({ size: 1 })
        .then(res => {
          const latestRecord = res.items[0];
          if (!latestRecord) return;
          recordsApi
            .getRecordGuide(latestRecord.record_id)
            .then(guide => {
              if (guide) setRecentGuideId(guide.guide_id);
            })
            .catch(() => {});
        })
        .catch(() => flash('최근 기록을 불러오지 못했어요'));
    }, [])
  );

  const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const monthData = useMonthData(viewY, viewM);

  const isOnRealToday =
    viewY === now.getFullYear() && viewM === now.getMonth() + 1 && selectedDay === now.getDate();
  const selectedStatus = monthData.find(x => x.day === selectedDay)?.status || 'future';

  // 달성률: 현재 월 기준 지난 날(done+missed) 중 done 비율
  const pastDays = monthData.filter(d => d.status === 'done' || d.status === 'missed');
  const doneDays = monthData.filter(d => d.status === 'done');
  const computedAdherence =
    pastDays.length > 0 ? Math.round((doneDays.length / pastDays.length) * 100) : adherence;

  const shiftMonth = (delta: number) => {
    let m = viewM + delta,
      y = viewY;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setViewY(y);
    setViewM(m);
    const isCurrentM = y === now.getFullYear() && m === now.getMonth() + 1;
    setSelectedDay(isCurrentM ? now.getDate() : 1);
  };

  const markDose = (id: string) => {
    const target = drugs.find(d => d.id === id);
    if (!target) return;
    const isDone = target.status === '완료';
    setDrugs(
      drugs.map(d => (d.id === id ? { ...d, status: isDone ? d.defaultStatus : '완료' } : d))
    );
    flash(isDone ? '복약 체크 취소했어요' : '복약 체크 완료 🎉');
  };

  const drugsForDay =
    selectedStatus === 'today'
      ? drugs
      : selectedStatus === 'done'
        ? drugs.map(d => ({ ...d, status: '완료' }))
        : selectedStatus === 'missed'
          ? drugs.map((d, i) => ({ ...d, status: i === 1 ? '미복용' : '완료' }))
          : drugs.map(d => ({ ...d, status: '예정' }));

  const dayCompleted = drugsForDay.filter(d => d.status === '완료').length;
  const recentChat = chats[0];
  const lastAiMsg = recentChat?.messages.filter(m => m.from === 'ai').slice(-1)[0]?.text || '';

  const dateStr = `${viewY}.${String(viewM).padStart(2, '0')}.${String(selectedDay).padStart(2, '0')}`;
  const donePastDay = selectedStatus === 'done' && !isOnRealToday;
  const missedPastDay = selectedStatus === 'missed' && !isOnRealToday;
  const [recentGuideId, setRecentGuideId] = useState<number | undefined>(undefined);

  return (
    <View style={{ flex: 1 }}>
      <ScreenLayout
        noHeader
        scrollable
        scrollPadding={false}
        contentStyle={{
          padding: spacing.s20,
          paddingTop: Math.max(insets.top, spacing.safeTop) + spacing.s20,
        }}
      >
        {/* 인사 + 컨디션 칩 */}
        <Text
          style={{
            fontSize: typography.fz26,
            fontWeight: typography.fw7,
            color: colors.ink,
            marginBottom: spacing.s8,
          }}
        >
          안녕하세요{user.nickname || user.name ? `, ${user.nickname || user.name}` : ''}님 👋
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.s20 }}>
          {user.conditions ? (
            user.conditions
              .split(/,\s*/)
              .filter(Boolean)
              .slice(0, 4)
              .map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    if (recentGuideId != null)
                      navigation.navigate('GuideResult', { guideId: recentGuideId });
                  }}
                  disabled={recentGuideId == null}
                  style={[s.conditionChip, recentGuideId == null && { opacity: 0.55 }]}
                >
                  <Text
                    style={{
                      fontSize: typography.fz12,
                      color: colors.accent700,
                      fontWeight: typography.fw5,
                    }}
                  >
                    {c} 관리
                  </Text>
                </TouchableOpacity>
              ))
          ) : (
            <View style={[s.conditionChip, { borderStyle: 'dashed', opacity: 0.7 }]}>
              <Text
                style={{
                  fontSize: typography.fz12,
                  color: colors.muted,
                  fontWeight: typography.fw5,
                }}
              >
                건강 정보 미입력
              </Text>
            </View>
          )}
        </View>

        {/* 프로필 미완료 배너 */}
        {!user.profileComplete && (
          <Card
            shadow
            style={{
              marginBottom: spacing.s14,
              backgroundColor: colors.accent50,
              borderColor: colors.accent100,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radii.pill,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="info" size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.fz14,
                    fontWeight: typography.fw7,
                    color: colors.ink,
                    marginBottom: spacing.s2,
                  }}
                >
                  건강 프로필을 완성해주세요
                </Text>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                  건강 정보를 입력할수록 맞춤형 가이드 정확도가 높아져요.
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.s12 }}
              onPress={() =>
                (navigation as unknown as NativeStackNavigationProp<RootStackParams>).navigate(
                  'Onboarding'
                )
              }
            >
              건강 정보 입력하기
            </Button>
          </Card>
        )}

        {/* 복약 달성률 + 최근 상담 */}
        <View
          style={{
            flexDirection: isTabletOrAbove ? 'row' : 'column',
            gap: spacing.s12,
            marginBottom: spacing.s14,
          }}
        >
          <View style={isTabletOrAbove ? { flex: 2 } : undefined}>
            <Card style={{ backgroundColor: colors.accent, borderColor: 'transparent', flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.s10,
                }}
              >
                <Text style={{ fontSize: typography.fz13, color: colors.onAccent85 }}>
                  {viewM}월 복약 달성률
                </Text>
                <View style={s.streakBadge}>
                  <Text style={{ fontSize: typography.fz12 }}>🔥</Text>
                  <Text
                    style={{
                      fontSize: typography.fz12,
                      color: colors.warningText,
                      marginLeft: spacing.s4,
                    }}
                  >
                    {streak}일 연속 달성 중
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: typography.fw7,
                  color: colors.white,
                  marginBottom: spacing.s4,
                }}
              >
                {computedAdherence}%
              </Text>
              <Text
                style={{
                  fontSize: typography.fz12,
                  color: colors.onAccent75,
                  marginBottom: spacing.s10,
                }}
              >
                총 {doneDays.length}일 완료 · 미복용 {pastDays.length - doneDays.length}일
              </Text>
              <ProgressBar
                progress={computedAdherence}
                color={colors.white}
                trackColor={colors.onAccent25}
              />
            </Card>
          </View>

          <View style={isTabletOrAbove ? { flex: 1 } : undefined}>
            <Card
              shadow
              containerStyle={{ flex: 1 }}
              style={{ flex: 1 }}
              onPress={() => {
                if (!recentChat) return;
                navigation
                  .getParent()
                  ?.navigate('ChatTab', {
                    screen: 'ChatList',
                    params: { sessionId: recentChat.id },
                  });
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.s6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
                  <Icon name="chat" size={14} color={colors.accent700} />
                  <Text
                    style={{
                      fontSize: typography.fz12,
                      fontWeight: typography.fw6,
                      color: colors.ink,
                    }}
                  >
                    최근 상담 {recentChat ? `(${recentChat.time})` : ''}
                  </Text>
                </View>
                <Icon name="chevron-right" size={13} color={colors.muted2} />
              </View>
              <View style={{ minHeight: 52 }}>
                {recentChat ? (
                  <>
                    <Text
                      style={{
                        fontSize: typography.fz13,
                        fontWeight: typography.fw6,
                        color: colors.ink,
                        marginBottom: spacing.s4,
                      }}
                      numberOfLines={2}
                    >
                      "{recentChat.title}"
                    </Text>
                    <Text
                      style={{ fontSize: typography.fz11, color: colors.muted, lineHeight: 16 }}
                      numberOfLines={2}
                    >
                      {lastAiMsg ? `AI: ${lastAiMsg}` : ''}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{ fontSize: typography.fz12, color: colors.muted }}
                    numberOfLines={2}
                  >
                    아직 상담 내역이 없어요
                  </Text>
                )}
              </View>
            </Card>
          </View>
        </View>

        {/* 빠른 액션 */}
        <View style={{ flexDirection: 'row', gap: spacing.s12, marginBottom: spacing.s20 }}>
          <View style={{ flex: 1 }}>
            <Card
              shadow
              containerStyle={{ flex: 1 }}
              style={{ flex: 1 }}
              onPress={() =>
                (navigation as unknown as NativeStackNavigationProp<RootStackParams>).navigate(
                  'UploadModal'
                )
              }
            >
              <View style={s.quickIcon}>
                <Icon name="file" size={18} color={colors.accent700} />
              </View>
              <Text
                style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}
              >
                의료 문서 업로드
              </Text>
              <Text
                style={{ fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 }}
                numberOfLines={1}
              >
                처방전·약봉투·진료기록 분석
              </Text>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card
              shadow
              containerStyle={{ flex: 1 }}
              style={{ flex: 1 }}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate('GuideTab', {
                    screen: 'GuideResult',
                    params: { guideId: recentGuideId },
                  })
              }
            >
              <View style={s.quickIcon}>
                <Icon name="doc" size={22} color={colors.accent700} />
              </View>
              <Text
                style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}
              >
                최근 가이드
              </Text>
              <Text
                style={{ fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 }}
                numberOfLines={1}
              >
                복약·생활습관 안내
              </Text>
            </Card>
          </View>
        </View>

        {/* 달력 */}
        <Card shadow style={{ marginBottom: spacing.s14 }}>
          <MonthCalendar
            y={viewY}
            m={viewM}
            data={monthData}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onDayClick={setSelectedDay}
            selectedDay={selectedDay}
            showTodayBtn={!isOnRealToday}
            onToday={() => {
              setViewY(now.getFullYear());
              setViewM(now.getMonth() + 1);
              setSelectedDay(now.getDate());
            }}
          />
          {/* 범례 */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.s16,
              paddingTop: spacing.s12,
              marginTop: spacing.s8,
              borderTopWidth: 0.5,
              borderTopColor: colors.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: radii.pill,
                  backgroundColor: colors.success,
                }}
              />
              <Text style={{ fontSize: typography.fz11, color: colors.muted }}>복약 완료</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: radii.pill,
                  backgroundColor: colors.danger,
                }}
              />
              <Text style={{ fontSize: typography.fz11, color: colors.muted }}>미복용</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
              <View
                style={{
                  width: 14,
                  height: 4,
                  borderRadius: radii.r2,
                  backgroundColor: colors.hairlineStrong,
                }}
              />
              <Text style={{ fontSize: typography.fz11, color: colors.muted }}>예정</Text>
            </View>
          </View>
          {(donePastDay || missedPastDay) && (
            <View
              style={{
                marginTop: spacing.s12,
                paddingTop: spacing.s12,
                borderTopWidth: 0.5,
                borderTopColor: colors.hairline,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.s8,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.fz15,
                    fontWeight: typography.fw7,
                    color: colors.ink,
                  }}
                >
                  {viewM}월 {selectedDay}일 기록
                </Text>
                {donePastDay ? (
                  <Badge variant="success" size="md">
                    복약 완료
                  </Badge>
                ) : (
                  <Badge variant="danger" size="md">
                    미복용 있음
                  </Badge>
                )}
              </View>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>
                {donePastDay
                  ? '처방된 약을 모두 복용했어요. 좋은 흐름을 이어가세요!'
                  : '일부 복약이 미복용됐어요. 꾸준히 이어가 보세요!'}
              </Text>
            </View>
          )}
        </Card>

        {/* 복약 현황 */}
        <Card shadow>
          <SectionHeader
            icon="link"
            label={
              <Text
                style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }}
              >
                {selectedStatus === 'today'
                  ? '오늘 복약 현황'
                  : selectedStatus === 'future'
                    ? '예정된 복약'
                    : '복약 기록'}
                <Text style={{ color: colors.muted, fontWeight: typography.fw4 }}>
                  {' '}
                  · {dateStr}
                </Text>{' '}
                ({dayCompleted}/{drugsForDay.length})
              </Text>
            }
            action={
              selectedStatus === 'missed' ? (
                <Badge variant="danger">미복용 있음</Badge>
              ) : selectedStatus === 'done' ? (
                <Badge variant="success">모두 복약</Badge>
              ) : undefined
            }
            mb={spacing.s14}
          />

          {drugsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.s24 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : drugsForDay.length === 0 ? (
            <EmptyState
              icon="link"
              message="복약 정보가 없어요. 처방전을 업로드하면 복약 현황을 확인할 수 있어요."
              action={{ label: '처방전 업로드', onPress: () => (navigation as unknown as any).navigate('UploadModal') }}
            />
          ) : (
            drugsForDay.map((d, i) => (
              <View
                key={d.id}
                style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
              >
                <View
                  style={{ width: 4, height: 32, borderRadius: radii.r2, backgroundColor: d.color }}
                />
                <View style={{ flex: 1, marginLeft: spacing.s12 }}>
                  <Text
                    style={{
                      fontSize: typography.fz14,
                      fontWeight: typography.fw6,
                      color: colors.ink,
                    }}
                  >
                    {d.name}
                  </Text>
                  <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                    {d.freq} · {d.time}
                  </Text>
                </View>
                {d.status === '완료' ? (
                  <TouchableOpacity
                    disabled={selectedStatus !== 'today'}
                    onPress={() => markDose(d.id)}
                    activeOpacity={0.6}
                  >
                    <Badge variant="success">완료</Badge>
                  </TouchableOpacity>
                ) : d.status === '미복용' ? (
                  <Badge variant="danger">미복용</Badge>
                ) : d.status === '예정' ? (
                  <Text style={{ fontSize: typography.fz12, color: colors.muted }}>예정</Text>
                ) : (
                  <TouchableOpacity style={s.chipBtn} onPress={() => markDose(d.id)}>
                    <Text style={{ fontSize: typography.fz12, color: colors.accent700 }}>
                      복약 체크
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Card>
      </ScreenLayout>
      <BellButton />
    </View>
  );
}

const s = StyleSheet.create({
  conditionChip: {
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s6,
    borderRadius: radii.pill,
    backgroundColor: colors.accent50,
    borderWidth: 1,
    borderColor: colors.accent100,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning50,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s8,
    paddingVertical: spacing.s4,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.bubble,
    backgroundColor: colors.accent100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s12,
  },
  drugRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s14 },
  chipBtn: {
    borderWidth: 1,
    borderColor: colors.accent100,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s6,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s14,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSmall: {
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent100,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calWeekHead: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: typography.fz11,
    paddingVertical: spacing.s4,
  },
  calCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.s6,
    borderRadius: radii.sm,
  },
  calToday: { backgroundColor: colors.accent },
  calSelected: { backgroundColor: colors.accent100 },
  calDayText: { fontSize: typography.fz13, color: colors.ink },
});
