import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자가 약품 검색으로 선택한 약품명/제조사와 입력한 복용기간(duration)을 기기 로컬에 영속한다.
// BE가 verify 시 medication.drug_name을 갱신하지 않고, ocr-result 응답에 duration 필드가 없어
// 재조회 시 선택 약품·기간이 사라지던 문제를 FE 단독으로 보존하기 위함(ratingStore와 동일 패턴).
// 근본 해결(search→DrugReference upsert·verify drug_name 갱신·candidate DTO duration)은 BE 후속.

const KEY = 'medipt_med_overrides';

export type MedicationOverride = {
  drugName?: string;
  manufacturer?: string;
  duration?: string;
};

let _overrides: Record<number, MedicationOverride> = {};

export const medicationOverrideStore = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) _overrides = JSON.parse(raw);
    } catch {
      _overrides = {};
    }
  },

  get(medicationId: number): MedicationOverride | null {
    return _overrides[medicationId] ?? null;
  },

  async set(medicationId: number, override: MedicationOverride) {
    // 기존 값과 병합 — duration만 저장해도 이전 drugName이 유지되도록.
    _overrides[medicationId] = { ..._overrides[medicationId], ...override };
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(_overrides));
    } catch {}
  },
};
