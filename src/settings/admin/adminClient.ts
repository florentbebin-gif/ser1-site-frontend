/**
 * adminClient — API admin typée, unique point d'entrée vers la Edge Function admin.
 *
 * Les consommateurs (pages, composants) doivent importer ce module.
 * L'import direct de `invokeAdmin` depuis les pages/composants est interdit.
 * Voir docs/CONTRIBUTING.md
 */

import { invokeAdmin } from './invokeAdmin';

// ─── Types publics ────────────────────────────────────────────────────

export type AdminAccountKind = 'owner' | 'dev_admin' | 'e2e';

export interface UserRecord {
  id: string;
  email: string;
  role: string;
  cabinet_id?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  total_reports: number;
  unread_reports: number;
  account_kind?: AdminAccountKind | null;
  is_test_account?: boolean;
}

export interface CabinetRecord {
  id: string;
  name: string;
  default_theme_id?: string | null;
  logo_id?: string | null;
  logo_placement?: string | null;
  themes?: { name?: string | null } | null;
  logos?: { storage_path?: string | null } | null;
}

export interface ThemeRecord {
  id: string;
  name: string;
  palette?: Record<string, string> | null;
  is_system?: boolean;
}

export interface ReportRecord {
  id: string;
  created_at: string;
  page?: string | null;
  title?: string | null;
  description?: string | null;
  admin_read_at?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface LogoRecord {
  id: string;
  sha256: string;
  storage_path: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
}

// ─── Helpers internes ─────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

async function invoke<T>(
  action: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await invokeAdmin(action, payload);
  if (error) throw new Error(error.message);
  return data as T;
}

// ─── API publique ─────────────────────────────────────────────────────

export const adminClient = {

  // ── Utilisateurs ──────────────────────────────────────────────────

  async listUsers(opts?: { includeTestAccounts?: boolean }): Promise<UserRecord[]> {
    const payload = opts?.includeTestAccounts ? { include_test_accounts: true } : undefined;
    const data = await invoke<unknown>('list_users', payload);
    const users = asRecord(data)?.users;
    return Array.isArray(users) ? (users as UserRecord[]) : [];
  },

  async createUserInvite(cmd: { email: string; cabinetId?: string }): Promise<void> {
    const payload: Record<string, unknown> = { email: cmd.email };
    if (cmd.cabinetId) payload.cabinet_id = cmd.cabinetId;
    await invoke('create_user_invite', payload);
  },

  async assignUserCabinet(cmd: { userId: string; cabinetId: string | null }): Promise<void> {
    await invoke('assign_user_cabinet', {
      user_id: cmd.userId,
      cabinet_id: cmd.cabinetId,
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await invoke('delete_user', { userId });
  },

  async resetPassword(cmd: { userId: string; email: string }): Promise<void> {
    await invoke('reset_password', { userId: cmd.userId, email: cmd.email });
  },

  // ── Cabinets ──────────────────────────────────────────────────────

  async listCabinets(): Promise<CabinetRecord[]> {
    const data = await invoke<unknown>('list_cabinets');
    const cabinets = asRecord(data)?.cabinets;
    return Array.isArray(cabinets) ? (cabinets as CabinetRecord[]) : [];
  },

  async createCabinet(cmd: {
    name: string;
    defaultThemeId?: string | null;
  }): Promise<CabinetRecord> {
    const data = await invoke<unknown>('create_cabinet', {
      name: cmd.name,
      default_theme_id: cmd.defaultThemeId ?? null,
    });
    return asRecord(data)?.cabinet as CabinetRecord;
  },

  async updateCabinet(cmd: {
    id: string;
    name?: string;
    defaultThemeId?: string | null;
    logoId?: string | null;
    logoPlacement?: string | null;
  }): Promise<void> {
    const payload: Record<string, unknown> = { id: cmd.id };
    if (cmd.name !== undefined) payload.name = cmd.name;
    if (cmd.defaultThemeId !== undefined) payload.default_theme_id = cmd.defaultThemeId;
    if (cmd.logoId !== undefined) payload.logo_id = cmd.logoId;
    if (cmd.logoPlacement !== undefined) payload.logo_placement = cmd.logoPlacement;
    await invoke('update_cabinet', payload);
  },

  async deleteCabinet(id: string): Promise<void> {
    await invoke('delete_cabinet', { id });
  },

  // ── Thèmes ────────────────────────────────────────────────────────

  async listThemes(): Promise<ThemeRecord[]> {
    const data = await invoke<unknown>('list_themes');
    const themes = asRecord(data)?.themes;
    return Array.isArray(themes) ? (themes as ThemeRecord[]) : [];
  },

  async createTheme(cmd: {
    name: string;
    palette: Record<string, string>;
  }): Promise<ThemeRecord> {
    const data = await invoke<unknown>('create_theme', cmd as Record<string, unknown>);
    return asRecord(data)?.theme as ThemeRecord;
  },

  async updateTheme(cmd: {
    id: string;
    name?: string;
    palette?: Record<string, string>;
  }): Promise<void> {
    await invoke('update_theme', cmd as Record<string, unknown>);
  },

  async deleteTheme(id: string): Promise<void> {
    await invoke('delete_theme', { id });
  },

  // ── Signalements ──────────────────────────────────────────────────

  async listIssueReports(cmd: { userId: string }): Promise<ReportRecord[]> {
    const data = await invoke<unknown>('list_issue_reports', { user_id: cmd.userId });
    // La réponse peut avoir data.reports ou data.data.reports (réponse wrappée)
    const top = asRecord(data);
    const reports = Array.isArray(top?.reports)
      ? top.reports
      : Array.isArray(asRecord(top?.data)?.reports)
        ? (asRecord(top?.data)?.reports as unknown[])
        : [];
    return reports as ReportRecord[];
  },

  async markIssueRead(reportId: string): Promise<void> {
    await invoke('mark_issue_read', { reportId });
  },

  async deleteIssue(reportId: string): Promise<void> {
    await invoke('delete_issue', { reportId });
  },

  async deleteAllIssuesForUser(userId: string): Promise<void> {
    await invoke('delete_all_issues_for_user', { userId });
  },

  // ── Logos ─────────────────────────────────────────────────────────

  async checkLogoExists(
    sha256Hash: string,
  ): Promise<{ exists: boolean; logo?: LogoRecord | null }> {
    const data = await invoke<unknown>('check_logo_exists', { sha256: sha256Hash });
    return (asRecord(data) ?? { exists: false }) as { exists: boolean; logo?: LogoRecord | null };
  },

  async createLogo(cmd: {
    sha256: string;
    storagePath: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
  }): Promise<LogoRecord> {
    const data = await invoke<unknown>('create_logo', {
      sha256: cmd.sha256,
      storage_path: cmd.storagePath,
      mime: cmd.mime,
      width: cmd.width,
      height: cmd.height,
      bytes: cmd.bytes,
    });
    return asRecord(data)?.logo as LogoRecord;
  },

  async assignCabinetLogo(cmd: {
    cabinetId: string;
    logoId: string | null;
  }): Promise<void> {
    await invoke('assign_cabinet_logo', {
      cabinet_id: cmd.cabinetId,
      logo_id: cmd.logoId,
    });
  },
};
