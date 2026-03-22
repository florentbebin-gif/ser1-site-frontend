import type { SupabaseClient } from './auth.ts'

// Erreur HTTP contrôlée — capturée dans index.ts pour retourner le bon statut
export class HttpError extends Error {
  readonly status: number
  constructor(message: string, status = 404) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export interface AuthUser {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

export interface CabinetRow {
  id: string
  name: string
  [key: string]: unknown
}

export interface ThemeRow {
  id: string
  name: string
  is_system: boolean
  palette?: unknown
  [key: string]: unknown
}

export interface IssueReportRow {
  id: string
  user_id: string
  created_at: string
  admin_read_at: string | null
  [key: string]: unknown
}

export interface LogoRow {
  id: string
  sha256: string
  storage_path: string
  [key: string]: unknown
}

export async function loadUserOrThrow(supabase: SupabaseClient, userId: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) throw new HttpError('Utilisateur non trouvé', 404)
  return data.user as AuthUser
}

export async function loadCabinetOrThrow(supabase: SupabaseClient, cabinetId: string): Promise<CabinetRow> {
  const { data, error } = await supabase
    .from('cabinets').select('*').eq('id', cabinetId).single()
  if (error || !data) throw new HttpError('Cabinet non trouvé', 404)
  return data as CabinetRow
}

export async function loadThemeOrThrow(supabase: SupabaseClient, themeId: string): Promise<ThemeRow> {
  const { data, error } = await supabase
    .from('themes').select('*').eq('id', themeId).single()
  if (error || !data) throw new HttpError('Thème non trouvé', 404)
  return data as ThemeRow
}

export async function loadIssueReportOrThrow(supabase: SupabaseClient, reportId: string): Promise<IssueReportRow> {
  const { data, error } = await supabase
    .from('issue_reports').select('*').eq('id', reportId).single()
  if (error || !data) throw new HttpError('Signalement non trouvé', 404)
  return data as IssueReportRow
}

export async function loadLogoOrThrow(supabase: SupabaseClient, logoId: string): Promise<LogoRow> {
  const { data, error } = await supabase
    .from('logos').select('*').eq('id', logoId).single()
  if (error || !data) throw new HttpError('Logo non trouvé', 404)
  return data as LogoRow
}
