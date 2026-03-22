/* global Deno */
import { assertEquals, assertRejects } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import {
  HttpError,
  loadCabinetOrThrow,
  loadIssueReportOrThrow,
  loadLogoOrThrow,
  loadThemeOrThrow,
  loadUserOrThrow,
} from './loaders.ts'
import type { SupabaseClient } from './auth.ts'

// --- Mock factories ---

function mockWithUser(user: unknown) {
  return {
    auth: { admin: { getUserById: async () => ({ data: { user }, error: null }) } },
  } as unknown as SupabaseClient
}

function mockWithNoUser() {
  return {
    auth: { admin: { getUserById: async () => ({ data: null, error: { message: 'not found' } }) } },
  } as unknown as SupabaseClient
}

function mockWithRow(row: unknown) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: row, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

function mockWithNoRow() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'not found', code: 'PGRST116' } }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

// --- loadUserOrThrow ---

Deno.test('loadUserOrThrow: user found → returns user', async () => {
  const user = { id: 'u1', email: 'a@b.com', app_metadata: { role: 'user' } }
  const result = await loadUserOrThrow(mockWithUser(user), 'u1')
  assertEquals(result.id, 'u1')
})

Deno.test('loadUserOrThrow: user not found → HttpError 404', async () => {
  await assertRejects(
    () => loadUserOrThrow(mockWithNoUser(), 'bad-id'),
    HttpError,
    'Utilisateur non trouvé',
  )
})

// --- loadThemeOrThrow ---

Deno.test('loadThemeOrThrow: theme found → returns theme', async () => {
  const theme = { id: 't1', name: 'Thème Test', is_system: false }
  const result = await loadThemeOrThrow(mockWithRow(theme), 't1')
  assertEquals(result.id, 't1')
  assertEquals(result.is_system, false)
})

Deno.test('loadThemeOrThrow: theme not found → HttpError 404', async () => {
  await assertRejects(
    () => loadThemeOrThrow(mockWithNoRow(), 'bad-id'),
    HttpError,
    'Thème non trouvé',
  )
})

// --- loadLogoOrThrow ---

Deno.test('loadLogoOrThrow: logo found → returns logo', async () => {
  const logo = { id: 'l1', sha256: 'abc123', storage_path: '/logos/l1.png' }
  const result = await loadLogoOrThrow(mockWithRow(logo), 'l1')
  assertEquals(result.id, 'l1')
})

Deno.test('loadLogoOrThrow: logo not found → HttpError 404', async () => {
  await assertRejects(
    () => loadLogoOrThrow(mockWithNoRow(), 'bad-id'),
    HttpError,
  )
})

// --- loadCabinetOrThrow ---

Deno.test('loadCabinetOrThrow: cabinet found → returns cabinet', async () => {
  const cabinet = { id: 'c1', name: 'Cabinet Dupont' }
  const result = await loadCabinetOrThrow(mockWithRow(cabinet), 'c1')
  assertEquals(result.id, 'c1')
})

Deno.test('loadCabinetOrThrow: cabinet not found → HttpError 404', async () => {
  await assertRejects(
    () => loadCabinetOrThrow(mockWithNoRow(), 'bad-id'),
    HttpError,
  )
})

// --- loadIssueReportOrThrow ---

Deno.test('loadIssueReportOrThrow: report found → returns report', async () => {
  const report = { id: 'r1', user_id: 'u1', created_at: '2025-01-01T00:00:00Z', admin_read_at: null }
  const result = await loadIssueReportOrThrow(mockWithRow(report), 'r1')
  assertEquals(result.id, 'r1')
  assertEquals(result.admin_read_at, null)
})

Deno.test('loadIssueReportOrThrow: report not found → HttpError 404', async () => {
  await assertRejects(
    () => loadIssueReportOrThrow(mockWithNoRow(), 'bad-id'),
    HttpError,
  )
})

// --- update_user_role owner-only: tested via validateAdminAccount in auth_test.ts ---
// The owner-only guard in updateUserRole uses ctx.principal.accountKind === 'owner'.
// This is exercised in auth_test.ts via validateAdminAccount / buildAdminPrincipal tests.
