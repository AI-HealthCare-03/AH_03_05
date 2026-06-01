import React, { useState } from "react";
import { View, Text } from "react-native";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import Card from "../../components/Card";
import ScreenLayout from "../../components/ScreenLayout";
import SearchBar from "../../components/SearchBar";
import { colors, radii, spacing, typography } from "../../theme";
import { drugsApi } from "../../api";
import type { DrugSearchResult } from "../../api";
import EmptyState from "../../components/EmptyState";


export function DrugCandidateScreen({ navigation, route }: any) {
  const drugIndex: number | undefined = route?.params?.drugIndex;
  const [query, setQuery] = useState(route?.params?.medicationName ?? "");
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchError('');
    try {
      const res = await drugsApi.searchDrugs({ keyword: query.trim(), limit: 10 });
      setResults(res.results);
    } catch {
      setResults([]);
      setSearchError('검색 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="식약처 약품 검색" back onBack={() => navigation.goBack()} scrollable scrollPadding={false} contentStyle={{ padding: spacing.s20 }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="약품명으로 검색"
        onSubmit={doSearch}
        autoFocus
        action={{ label: '검색', onPress: doSearch, loading }}
        style={{ marginBottom: spacing.s14 }}
      />

      {searched && !loading && !searchError && <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: 10 }}>검색 결과 {results.length}건</Text>}
      {searchError ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8, backgroundColor: colors.danger50, borderRadius: radii.sm, padding: spacing.s12, marginBottom: 10 }}>
          <Icon name="alert" size={13} color={colors.danger} />
          <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{searchError}</Text>
        </View>
      ) : null}

      {results.map((c, i) => (
        <Card shadow key={i} style={{ marginBottom: spacing.s12 }}>
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginBottom: spacing.s4 }}>{c.drug_name}</Text>
          {c.ingredient_name ? <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s4 }}>성분: {c.ingredient_name}</Text> : null}
          {c.manufacturer ? <Text style={{ fontSize: typography.fz12, color: colors.accent, marginBottom: spacing.s12 }}>{c.manufacturer}</Text> : null}
          <Button variant="primary" size="md" borderRadius={radii.pill} onPress={() => navigation.navigate("DrugDosage", { drugIndex, selectedDrug: c })}>
            이 약품 선택
          </Button>
        </Card>
      ))}

      {searched && !loading && results.length === 0 && (
        <EmptyState icon="search" title="검색 결과가 없어요" message="다른 이름으로 검색해보세요." />
      )}
    </ScreenLayout>
  );
}

export default DrugCandidateScreen;
