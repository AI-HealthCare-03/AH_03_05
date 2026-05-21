import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { drugsApi } from '../../api';
import type { DrugSearchResult } from '../../api';

export function DrugSearchScreen({ navigation, route }: any) {
  const [query, setQuery] = useState(route?.params?.medicationName ?? '');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await drugsApi.searchDrugs({ q: query.trim(), size: 10 });
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="식약처 약품 검색"
      back
      onBack={() => navigation.goBack()}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s20 }}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8, marginBottom: 14 }}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          style={{ flex: 1, fontSize: typography.fz14, color: colors.ink, height: 40 }}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
          autoFocus
        />
        <Button variant="primary" onPress={doSearch} loading={loading}>검색</Button>
      </Card>

      {searched && !loading && (
        <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: 10 }}>
          검색 결과 {results.length}건
        </Text>
      )}

      {results.map((c, i) => (
        <Card key={i} style={{ marginBottom: spacing.s12 }}>
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginBottom: spacing.s4 }}>{c.drug_name}</Text>
          {c.ingredient_name ? (
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s4 }}>성분: {c.ingredient_name}</Text>
          ) : null}
          {c.manufacturer ? (
            <Text style={{ fontSize: typography.fz12, color: colors.accent, marginBottom: spacing.s12 }}>{c.manufacturer}</Text>
          ) : null}
          <Button variant="primary" size="md" style={{ borderRadius: radii.md }} onPress={() => navigation.navigate('DrugDosage')}>이 약품 선택</Button>
        </Card>
      ))}

      {searched && !loading && results.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: spacing.s40 }}>
          <Icon name="search" size={32} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s12 }}>검색 결과가 없어요.</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted2, marginTop: spacing.s4 }}>다른 이름으로 검색해보세요.</Text>
        </View>
      )}
    </ScreenLayout>
  );
}

export default DrugSearchScreen;
