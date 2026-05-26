/* global Deno */
import { assertEquals, assertRejects } from '@std/assert'
import type { AdminActionContext } from '../lib/http.ts'
import { fetchAllAuthUsers, userActionHandlers } from './users.ts'

interface TestAuthUser {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string
  app_metadata?: Record<string, unknown>
}

interface InFilter {
  table: string
  column: string
  values: string[]
}

interface ListUsersParams {
  page?: number
  perPage?: number
}

Deno.test('fetchAllAuthUsers concatene toutes les pages Auth', async () => {
  const calls: Array<{ page?: number; perPage?: number }> = []
  const pages: TestAuthUser[][] = [
    [
      { id: 'user-1', email: 'one@test.local' },
      { id: 'user-2', email: 'two@test.local' },
    ],
    [
      { id: 'user-3', email: 'three@test.local' },
      { id: 'user-4', email: 'four@test.local' },
    ],
    [{ id: 'user-5', email: 'five@test.local' }],
  ]

  const users: TestAuthUser[] = await fetchAllAuthUsers({
    listUsers: (params?: ListUsersParams) => {
      calls.push(params ?? {})
      return Promise.resolve({
        data: { users: pages[(params?.page ?? 1) - 1] ?? [] },
        error: null,
      })
    },
  }, 2)

  assertEquals(users.map((user) => user.id), [
    'user-1',
    'user-2',
    'user-3',
    'user-4',
    'user-5',
  ])
  assertEquals(calls, [
    { page: 1, perPage: 2 },
    { page: 2, perPage: 2 },
    { page: 3, perPage: 2 },
  ])
})

Deno.test('fetchAllAuthUsers propage les erreurs Supabase', async () => {
  await assertRejects(
    () =>
      fetchAllAuthUsers({
        listUsers: () =>
          Promise.resolve({
            data: { users: [] },
            error: new Error('auth indisponible'),
          }),
      }, 2),
    Error,
    'auth indisponible',
  )
})

Deno.test('list_users conserve la reponse users et exclut les comptes e2e', async () => {
  const inFilters: InFilter[] = []
  const authUsers: TestAuthUser[] = [
    {
      id: 'user-real',
      email: 'client@example.com',
      created_at: '2026-01-01T00:00:00.000Z',
      last_sign_in_at: '2026-01-02T00:00:00.000Z',
      app_metadata: { role: 'user' },
    },
    {
      id: 'user-e2e',
      email: 'e2e@test.local',
      created_at: '2026-01-01T00:00:00.000Z',
      app_metadata: { role: 'user' },
    },
  ]

  const supabase = {
    auth: {
      admin: {
        listUsers: (params?: { page?: number; perPage?: number }) =>
          Promise.resolve({
            data: { users: params?.page === 1 ? authUsers : [] },
            error: null,
          }),
      },
    },
    from(table: string) {
      const state = { table, inColumn: '', inValues: [] as string[] }
      const dataByTable: Record<string, Array<Record<string, unknown>>> = {
        admin_accounts: [
          { user_id: 'user-e2e', account_kind: 'e2e' },
        ],
        profiles: [
          { id: 'user-real', cabinet_id: 'cabinet-1' },
          { id: 'user-e2e', cabinet_id: 'cabinet-e2e' },
        ],
        issue_reports: [
          {
            user_id: 'user-real',
            created_at: '2026-02-01T00:00:00.000Z',
            admin_read_at: null,
            id: 'report-1',
          },
          {
            user_id: 'user-e2e',
            created_at: '2026-02-02T00:00:00.000Z',
            admin_read_at: null,
            id: 'report-e2e',
          },
        ],
      }

      const builder = {
        select: () => builder,
        in: (column: string, values: string[]) => {
          state.inColumn = column
          state.inValues = values
          inFilters.push({ table, column, values })
          return builder
        },
        then: <T>(
          resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => T,
          reject?: (reason: unknown) => T,
        ) => {
          let rows = dataByTable[table] ?? []
          if (state.inColumn) {
            rows = rows.filter((row) => state.inValues.includes(String(row[state.inColumn])))
          }
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
        },
      }

      return builder
    },
  }

  const response = await userActionHandlers.list_users({
    supabase,
    payload: {},
    principal: {
      userId: 'admin-user',
      role: 'admin',
      accountKind: 'owner',
      requestId: 'rid-test',
    },
    requestId: 'rid-test',
    responseHeaders: {},
    req: new Request('https://ser1.test/api/admin'),
    origin: 'https://ser1.test',
    hasAuthHeader: true,
    reqStart: Date.now(),
  } as unknown as AdminActionContext)

  const body = await response.json()

  assertEquals(response.status, 200)
  assertEquals(body, {
    users: [
      {
        id: 'user-real',
        email: 'client@example.com',
        created_at: '2026-01-01T00:00:00.000Z',
        last_sign_in_at: '2026-01-02T00:00:00.000Z',
        role: 'user',
        cabinet_id: 'cabinet-1',
        account_kind: null,
        is_test_account: false,
        total_reports: 1,
        unread_reports: 1,
        latest_report_id: 'report-1',
        latest_report_is_unread: true,
      },
    ],
  })
  assertEquals(inFilters, [
    { table: 'profiles', column: 'id', values: ['user-real'] },
    { table: 'issue_reports', column: 'user_id', values: ['user-real'] },
  ])
})

Deno.test('update_user_role refuse un role inconnu avant toute mutation', async () => {
  let authUpdateCalled = false
  let profileUpsertCalled = false

  const supabase = {
    auth: {
      admin: {
        updateUserById: () => {
          authUpdateCalled = true
          return Promise.resolve({ error: null })
        },
        getUserById: () =>
          Promise.resolve({
            data: { user: { id: 'user-1', app_metadata: { role: 'user' } } },
            error: null,
          }),
      },
    },
    from() {
      return {
        upsert: () => {
          profileUpsertCalled = true
          return Promise.resolve({ error: null })
        },
      }
    },
  }

  const response = await userActionHandlers.update_user_role({
    supabase,
    payload: { userId: 'user-1', role: 'super-admin' },
    principal: {
      userId: 'owner-user',
      role: 'admin',
      accountKind: 'owner',
      requestId: 'rid-role',
    },
    requestId: 'rid-role',
    responseHeaders: {},
    req: new Request('https://ser1.test/api/admin'),
    origin: 'https://ser1.test',
    hasAuthHeader: true,
    reqStart: Date.now(),
  } as unknown as AdminActionContext)

  const body = await response.json()

  assertEquals(response.status, 400)
  assertEquals(body.error, 'Rôle invalide')
  assertEquals(authUpdateCalled, false)
  assertEquals(profileUpsertCalled, false)
})
