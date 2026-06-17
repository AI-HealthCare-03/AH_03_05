import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStore } from '../api/tokenStore';
import { ratingStore } from '../api/ratingStore';
import { usersApi, healthProfileApi } from '../api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { colors } from '../theme';

// 서버 HealthProfile → User 필드 역매핑 (HealthProfileEditScreen과 동일 규칙)
// 주의: 이 파일은 자체 `Record` 인터페이스를 정의하므로 TS 유틸리티 Record<> 사용 불가
const AGE_GROUP_TO_LABEL: { [k: string]: string } = {
  '20s': '20대',
  '30s': '30대',
  '40s': '40대',
  '50s': '50대',
  '60s': '60대+',
};
const GENDER_TO_LABEL: { [k: string]: string } = { F: '여성', M: '남성' };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  nickname: string;
  email: string;
  loggedIn: boolean;
  age: string;
  ageNum: number;
  sex: string;
  conditions: string;
  allergies: string;
  otherMeds: string;
  notes: string;
  pregnant: string;
  smoking: string;
  profileComplete: boolean;
}

export interface Drug {
  id: string;
  name: string;
  maker: string;
  ingredient: string;
  freq: string;
  time: string;
  color: string;
  status: string;
  defaultStatus: string;
}

export interface Record {
  id: string;
  kind: string;
  date: string;
  place: string;
  drugCount: number;
  drugs: string[];
  doctor: string;
  note: string;
}

export interface ChatMessage {
  from: 'user' | 'ai' | 'warn';
  text: string;
  date?: string;
}

export interface Chat {
  id: string;
  title: string;
  preview: string;
  time: string;
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  icon: string;
  title: string;
  time: string;
  date: string;
  body: string;
  unread: boolean;
  type: 'medication' | 'record' | 'guide' | 'chat' | 'info';
  target_id?: string;
}

export interface OcrDrug {
  name: string;
  maker: string;
  time: string;
  confidence: number | null;
  status: 'ok' | 'needsCheck';
  isManual?: boolean;
}

export interface OcrSession {
  fileName: string;
  fileSize: string;
  drugs: OcrDrug[];
}

export interface NotifSettings {
  master: boolean;
  morning: { on: boolean; time: string };
  lunch: { on: boolean; time: string };
  dinner: { on: boolean; time: string };
  newGuide: boolean;
  chatReply: boolean;
  marketing: boolean;
}

interface AppState {
  isReady: boolean;
  isOffline: boolean;
  user: User;
  setUser: (u: User) => void;
  drugs: Drug[];
  setDrugs: (d: Drug[]) => void;
  records: Record[];
  setRecords: (r: Record[]) => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChat: string;
  setActiveChat: (id: string) => void;
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  adherence: number;
  streak: number;
  ocrSession: OcrSession;
  setOcrSession: (s: OcrSession) => void;
  notifSettings: NotifSettings;
  setNotifSettings: (s: NotifSettings) => void;
  flash: (msg: string) => void;
  toast: string | null;
  notifDrawerOpen: boolean;
  setNotifDrawerOpen: (v: boolean) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const defaultNotifSettings: NotifSettings = {
  master: true,
  morning: { on: true, time: '08:30' },
  lunch: { on: false, time: '12:30' },
  dinner: { on: true, time: '19:00' },
  newGuide: true,
  chatReply: true,
  marketing: false,
};

export const defaultUser: User = {
  name: '',
  nickname: '',
  email: '',
  loggedIn: false,
  age: '',
  ageNum: 0,
  sex: '',
  conditions: '',
  allergies: '',
  otherMeds: '',
  notes: '',
  pregnant: '',
  smoking: '',
  profileComplete: false,
};

const seedDrugs: Drug[] = [
  {
    id: 'd1',
    name: '암로디핀정 5mg',
    maker: '한미약품',
    ingredient: 'Amlodipine besylate 5mg',
    freq: '1일 1회',
    time: '아침 식후 30분',
    color: colors.scheduleMorning,
    status: '완료',
    defaultStatus: '아침 식후 30분',
  },
  {
    id: 'd2',
    name: '로수바스타틴 10mg',
    maker: '유한양행',
    ingredient: 'Rosuvastatin 10mg',
    freq: '1일 1회',
    time: '저녁 식후',
    color: colors.scheduleEvening,
    status: '저녁 8시',
    defaultStatus: '저녁 8시',
  },
  {
    id: 'd3',
    name: '메트포르민 500mg',
    maker: 'A제약',
    ingredient: 'Metformin 500mg',
    freq: '1일 2회',
    time: '식후',
    color: colors.scheduleLunch,
    status: '점심 · 저녁',
    defaultStatus: '점심 · 저녁',
  },
];

const seedRecords: Record[] = [
  {
    id: 'r1',
    kind: '처방전',
    date: '2026.05.11',
    place: '서울 내과 의원',
    drugCount: 3,
    drugs: ['암로디핀정 5mg', '로수바스타틴 10mg', '메트포르민 500mg'],
    doctor: '김민수',
    note: '고혈압·당뇨 정기 처방, 14일분',
  },
  {
    id: 'r2',
    kind: '약봉투',
    date: '2026.04.22',
    place: '건강약국 (강남점)',
    drugCount: 2,
    drugs: ['타이레놀 500mg', '베나치오'],
    doctor: '—',
    note: '약사 조제, 감기 증상 5일분',
  },
  {
    id: 'r3',
    kind: '진료기록',
    date: '2026.04.15',
    place: '강남삼성내과',
    drugCount: 3,
    drugs: ['암로디핀정 5mg', '로수바스타틴 10mg', '메트포르민 500mg'],
    doctor: '박서연',
    note: '혈압 130/85, HbA1c 6.9 — 약 유지',
  },
  {
    id: 'r4',
    kind: '진료기록',
    date: '2026.03.15',
    place: '건강검진 결과',
    drugCount: 0,
    drugs: [],
    doctor: '—',
    note: '공복혈당 128, LDL 142 — 식이 권고',
  },
];

const seedChats: Chat[] = [
  {
    id: 'c1',
    title: '혈압약 부작용 문의',
    preview: '혈압약 먹는데 사우나...',
    time: '오늘',
    messages: [
      {
        from: 'ai',
        text: '안녕하세요, 김오즈님 👋\n생활습관 관련 궁금한 점을 편하게 물어보세요.',
        date: '2026년 5월 12일',
      },
      { from: 'user', text: '혈압약 먹는데 사우나 가도 되나요?' },
      {
        from: 'ai',
        text: '혈압약 복용 중에는 사우나 이용 시 주의가 필요해요.\n급격한 온도 변화로 혈압이 갑자기 떨어질 수 있어서, 15분 이내로 짧게 이용하고 수분 보충을 꼭 해주세요.',
      },
      { from: 'user', text: '약을 끊어도 될 것 같은데요' },
      { from: 'warn', text: '복약 중단·변경은 반드시 담당 의사와 상담해야 해요.' },
    ],
  },
  {
    id: 'c2',
    title: '메트포르민과 음주',
    preview: '와인 한 잔 정도는...',
    time: '어제',
    messages: [],
  },
  {
    id: 'c3',
    title: '고지혈증 식단',
    preview: '어떤 음식이 좋을까요?',
    time: '5월 1일',
    messages: [],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isOffline } = useNetworkStatus();
  const [user, setUserState] = useState<User>(defaultUser);
  const [drugs, setDrugs] = useState<Drug[]>(seedDrugs);
  const [records, setRecords] = useState<Record[]>(seedRecords);
  const [chats, setChats] = useState<Chat[]>(seedChats);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [unreadCountState, setUnreadCountState] = useState(0);
  const [activeChat, setActiveChat] = useState('c1');
  const [notifSettings, setNotifSettingsState] = useState<NotifSettings>(defaultNotifSettings);
  const [ocrSession, setOcrSession] = useState<OcrSession>({
    fileName: '처방전.jpg',
    fileSize: '1.8MB',
    drugs: [
      {
        name: '암로디핀정 5mg',
        maker: '한미약품',
        time: '1일 1회 · 아침 식후 30분 · 30일',
        confidence: 95,
        status: 'ok',
      },
      {
        name: '로수바스타틴 10mg',
        maker: '유한양행',
        time: '1일 1회 · 저녁 식후 · 30일',
        confidence: 92,
        status: 'ok',
      },
      {
        name: '메트포르?정 500mg',
        maker: '제조사 미확인',
        time: '—',
        confidence: 52,
        status: 'needsCheck',
      },
    ],
  });
  const [isReady, setIsReady] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const streakCountedRef = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // guard: don't persist until the initial AsyncStorage load is complete
  const isLoaded = useRef(false);

  // Persist user to AsyncStorage — skipped on the very first render
  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('medipt_user', JSON.stringify(user)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('medipt_notif_settings', JSON.stringify(notifSettings)).catch(() => {});
  }, [notifSettings]);

  // Load tokens + user on mount
  useEffect(() => {
    (async () => {
      const [stored, storedNotif] = await Promise.all([
        AsyncStorage.getItem('medipt_user'),
        AsyncStorage.getItem('medipt_notif_settings'),
        tokenStore.load(),
        ratingStore.load(),
      ]);
      const hasToken = !!tokenStore.accessToken;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserState({ ...parsed, loggedIn: hasToken });
        } catch {}
      } else {
        setUserState(prev => ({ ...prev, loggedIn: hasToken }));
      }
      if (storedNotif) {
        try {
          setNotifSettingsState({ ...defaultNotifSettings, ...JSON.parse(storedNotif) });
        } catch {}
      }
      isLoaded.current = true;
      setIsReady(true);

      if (hasToken) {
        usersApi.getMe().then(me => {
          setUserState(prev => ({
            ...prev,
            name: me.name,
            nickname: me.nickname ?? me.name,
            email: me.email,
          }));
        }).catch((e: any) => {
          if (e?.response?.status === 401) {
            tokenStore.triggerUnauthorized();
          }
        });
      }
    })();

    tokenStore.registerUnauthorizedHandler(() => {
      AsyncStorage.removeItem('medipt_user').catch(() => {});
      setUserState({ ...defaultUser, loggedIn: false });
    });
  }, []);

  // 로그인 상태가 되면 서버에서 건강프로필을 받아 user에 hydrate한다.
  // medipt_user는 로그아웃 시 삭제되므로 로컬 저장에만 의존하면 재로그인 후 프로필이
  // 초기화된다 → 서버를 단일 출처로 삼아 복원. (매핑은 HealthProfileEditScreen과 동일)
  useEffect(() => {
    if (!user.loggedIn) return;
    let cancelled = false;
    healthProfileApi
      .getHealthProfile()
      .then(p => {
        if (cancelled) return;
        setUserState(prev => ({
          ...prev,
          age: AGE_GROUP_TO_LABEL[p.age_group ?? ''] ?? prev.age,
          sex: GENDER_TO_LABEL[p.gender ?? ''] ?? prev.sex,
          conditions: p.chronic_diseases.join(', '),
          allergies: p.allergies.join(', '),
          otherMeds: p.current_medications.join(', '),
          notes: p.medical_history ?? prev.notes,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user.loggedIn]);

  useEffect(() => {
    if (drugs.length === 0) return;
    const allDone = drugs.every(d => d.status === '완료');
    if (allDone && !streakCountedRef.current) {
      streakCountedRef.current = true;
      setStreak(s => s + 1);
    } else if (!allDone) {
      streakCountedRef.current = false;
    }
  }, [drugs]);

  const setUser = useCallback((u: User) => setUserState(u), []);
  const setNotifSettings = useCallback((s: NotifSettings) => setNotifSettingsState(s), []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const setNotifications = useCallback((n: Notification[]) => {
    setNotificationsState(n);
    setUnreadCountState(n.filter(x => x.unread).length);
  }, []);

  const setUnreadCount = useCallback((n: number) => {
    setUnreadCountState(n);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotificationsState(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
    setUnreadCountState(prev => Math.max(0, prev - 1));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      isReady,
      isOffline,
      user,
      setUser,
      drugs,
      setDrugs,
      records,
      setRecords,
      chats,
      setChats,
      activeChat,
      setActiveChat,
      notifications,
      setNotifications,
      adherence:
        drugs.length > 0
          ? Math.round((drugs.filter(d => d.status === '완료').length / drugs.length) * 100)
          : 0,
      streak,
      ocrSession,
      setOcrSession,
      notifSettings,
      setNotifSettings,
      flash,
      toast,
      notifDrawerOpen,
      setNotifDrawerOpen,
      markNotificationRead,
      unreadCount: unreadCountState,
      setUnreadCount,
    }),
    [
      isReady,
      isOffline,
      user,
      drugs,
      records,
      chats,
      activeChat,
      notifications,
      unreadCountState,
      streak,
      ocrSession,
      notifSettings,
      toast,
      notifDrawerOpen,
      markNotificationRead,
      setNotifSettings,
      setNotifications,
      setUnreadCount,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
