import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자가 채팅 답변에 남긴 별점을 기기 로컬에 영속한다. BE GET messages가 my_rating을
// 돌려주지 않아 재마운트/새로고침 시 별점이 사라지던 문제를 FE 단독으로 보존하기 위함.
// (기기 간 동기화는 BE my_rating 도입 시 대체)

const KEY = 'medipt_message_ratings';
type Rating = 1 | 2 | 3 | 4 | 5;

let _ratings: Record<number, Rating> = {};

export const ratingStore = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) _ratings = JSON.parse(raw);
    } catch {
      _ratings = {};
    }
  },

  get(messageId: number): Rating | null {
    return _ratings[messageId] ?? null;
  },

  async set(messageId: number, rating: Rating) {
    _ratings[messageId] = rating;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(_ratings));
    } catch {}
  },
};
