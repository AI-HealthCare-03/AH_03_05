import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { feedbacksApi, extractApiError } from '../../api';
import type { FeedbackSummaryResponse } from '../../api';
import ScreenLayout from '../../components/ScreenLayout';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, typography } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'FeedbackSummary'>;

const RATING_LABELS: Record<string, string> = {
  '1': '⭐ 1점',
  '2': '⭐⭐ 2점',
  '3': '⭐⭐⭐ 3점',
  '4': '⭐⭐⭐⭐ 4점',
  '5': '⭐⭐⭐⭐⭐ 5점',
};

export function FeedbackSummaryScreen({ navigation }: { navigation: NavProp }) {
  const [summary, setSummary] = useState<FeedbackSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    feedbacksApi
      .getFeedbackSummary()
      .then(setSummary)
      .catch(e => setError(extractApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenLayout
      title="피드백 통계"
      back
      onBack={() =>
        navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')
      }
      scrollable
    >
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.s48 }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <EmptyState icon="alert" title="통계를 불러오지 못했어요" message={error} />
      ) : !summary || summary.total_count === 0 ? (
        <EmptyState icon="star" title="아직 피드백이 없어요" message="가이드나 채팅 답변에 별점을 남겨주세요." />
      ) : (
        <>
          {/* 요약 카드 */}
          <Card shadow style={{ marginBottom: spacing.s16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center', gap: spacing.s4 }}>
                <Text style={{ fontSize: typography.fz26, fontWeight: typography.fw7, color: colors.ink }}>
                  {summary.total_count}
                </Text>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>총 피드백</Text>
              </View>
              <View style={{ alignItems: 'center', gap: spacing.s4 }}>
                <Text style={{ fontSize: typography.fz26, fontWeight: typography.fw7, color: colors.accent }}>
                  {summary.average_rating != null ? summary.average_rating.toFixed(1) : '—'}
                </Text>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>평균 별점</Text>
              </View>
              <View style={{ alignItems: 'center', gap: spacing.s4 }}>
                <Text style={{ fontSize: typography.fz26, fontWeight: typography.fw7, color: summary.report_count > 0 ? colors.danger : colors.ink }}>
                  {summary.report_count}
                </Text>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>신고 건수</Text>
              </View>
            </View>
          </Card>

          {/* 별점 분포 */}
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, marginBottom: spacing.s8 }}>
            별점 분포
          </Text>
          <Card shadow noPadding style={{ marginBottom: spacing.s16, overflow: 'hidden' }}>
            {['5', '4', '3', '2', '1'].map((star, i) => {
              const count = summary.rating_distribution[star] ?? 0;
              const ratio = summary.total_count > 0 ? count / summary.total_count : 0;
              return (
                <View
                  key={star}
                  style={[
                    { paddingHorizontal: spacing.s16, paddingVertical: spacing.s10, flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
                    i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
                  ]}
                >
                  <Text style={{ fontSize: typography.fz13, color: colors.ink2, width: 80 }}>
                    {RATING_LABELS[star]}
                  </Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.surface2, borderRadius: 3 }}>
                    <View
                      style={{
                        width: `${Math.round(ratio * 100)}%`,
                        height: 6,
                        backgroundColor: colors.accent,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: typography.fz12, color: colors.muted, width: 28, textAlign: 'right' }}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </Card>

          {/* 개선 필요 항목 */}
          {summary.low_rated_items.length > 0 && (
            <>
              <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, marginBottom: spacing.s8 }}>
                개선 필요 항목 ({summary.low_rated_items.length}건)
              </Text>
              <Card shadow noPadding style={{ overflow: 'hidden' }}>
                {summary.low_rated_items.map((item, i) => (
                  <View
                    key={item.feedback_id}
                    style={[
                      { paddingHorizontal: spacing.s16, paddingVertical: spacing.s12 },
                      i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8, marginBottom: spacing.s4 }}>
                      <Text style={{ fontSize: typography.fz12, color: colors.danger }}>
                        {'⭐'.repeat(item.rating ?? 1)} {item.rating}점
                      </Text>
                      <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                        {item.guide_id ? `가이드 #${item.guide_id}` : `채팅 #${item.chat_message_id}`}
                      </Text>
                    </View>
                    {item.comment ? (
                      <Text style={{ fontSize: typography.fz13, color: colors.ink2 }} numberOfLines={2}>
                        {item.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

export default FeedbackSummaryScreen;
