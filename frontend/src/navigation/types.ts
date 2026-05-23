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
  DrugSearch: { medicationName?: string };
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
  ChatSession: { chatId: string };
};

export type SettingsStackParams = {
  Settings: undefined;
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
