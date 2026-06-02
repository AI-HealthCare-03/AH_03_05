import type { DrugSearchResult } from '../api/types';

export type AuthStackParams = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParams = {
  OnboardingStep: { step?: number };
};

export type HomeStackParams = {
  Home: undefined;
  OCRProcessing: { recordId?: number };
  OCRResult: { recordId?: number; inputMethod?: string };
  DrugCandidate: { medicationName?: string; drugIndex?: number };
  DrugDosage: { drugIndex?: number; selectedDrug?: DrugSearchResult; medicationId?: number } | undefined;
  DrugDetail: { drugId: number };
  GuideLoading: { recordId?: number };
  GuideResult: { guideId?: number };
};

export type RecordsStackParams = {
  RecordList: undefined;
  RecordDetail: { recordId: number };
  DrugDosage: { drugIndex?: number; selectedDrug?: DrugSearchResult; medicationId?: number } | undefined;
  DrugDetail: { drugId: number };
};

export type GuideStackParams = {
  GuideResult: { guideId?: number };
  GuideLoading: { recordId?: number };
};

export type ChatStackParams = {
  ChatList: { sessionId?: string } | undefined;
  ChatSession: { sessionId: string; guideId?: string; title?: string; subtitle?: string };
};

export type SettingsStackParams = {
  Settings: undefined;
  NotificationSettings: undefined;
  HealthProfileEdit: undefined;
  Notifications: undefined;
  PasswordChange: undefined;
  DeviceManagement: undefined;
  LegalDoc: { docKey: 'tos' | 'privacy' | 'sensitive' };
  DeleteAccount: undefined;
  ConsentHistory: undefined;
  HealthProfileHistory: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Onboarding: undefined;
  Main: { screen?: string; params?: { screen?: string; params?: Record<string, unknown> } } | undefined;
  UploadModal: undefined;
  MedicationAlarm: { meal?: 'morning' | 'lunch' | 'dinner' };
};
