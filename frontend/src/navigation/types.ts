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
  OCRResult: { recordId?: number };
  DrugCandidate: { medicationName?: string; drugIndex?: number };
  DrugDosage: undefined;
  DrugDetail: { drugId: number };
  GuideLoading: { recordId?: number };
  GuideResult: { guideId?: number };
};

export type RecordsStackParams = {
  RecordList: undefined;
  RecordDetail: { recordId: number };
  DrugDosage: undefined;
  DrugDetail: { drugId: number };
};

export type GuideStackParams = {
  GuideResult: { guideId?: number };
  GuideLoading: { recordId?: number };
};

export type ChatStackParams = {
  ChatList: undefined;
  ChatSession: { sessionId: string; guideId?: string };
};

export type SettingsStackParams = {
  Settings: undefined;
  MyPage: undefined;
  NotificationSettings: undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  PasswordChange: undefined;
  DeviceManagement: undefined;
  LegalDoc: { docKey: 'tos' | 'privacy' | 'sensitive' };
  DeleteAccount: undefined;
  ConsentHistory: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  UploadModal: undefined;
};
