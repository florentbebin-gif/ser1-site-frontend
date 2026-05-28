export interface CabinetSummary {
  id: string;
  name: string;
  themes?: {
    name?: string | null;
  } | null;
}

export interface ThemeSummary {
  id: string;
  name: string;
  palette?: Record<string, string> | null;
  is_system?: boolean;
}

export interface UserSummary {
  id: string;
  email: string;
  role: string;
  cabinet_id?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  total_reports: number;
  unread_reports: number;
}
