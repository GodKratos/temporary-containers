import { PreferencesSchema, Permissions, StorageLocal, Tab } from '../../types';

export interface AppState {
  initialized: boolean;
  preferences: PreferencesSchema | null;
  permissions: Permissions | null;
  statistics: any | null; // TODO: Define proper statistics type
  domainRules: any[]; // TODO: Define proper domain rules type
  activeSection: string;
  themeMode: 'light' | 'dark';
  storage: StorageLocal | null;
}

export interface PopupState extends AppState {
  popup: true;
  currentTab: Tab | null;
  activeTab: Tab | null;
}

export interface PageProps {
  state: AppState | PopupState;
  onSave?: (preferences: Partial<PreferencesSchema>) => Promise<void>;
  onReset?: () => Promise<void>;
  onPermissionRequest?: (permission: string) => Promise<boolean>;
}

export interface Message {
  type: 'error' | 'success' | 'info';
  text: string;
}

export interface GlossaryItem {
  title: string;
  content: string;
}
