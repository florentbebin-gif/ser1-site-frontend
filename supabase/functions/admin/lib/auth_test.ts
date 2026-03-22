/* global Deno */
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { validateAdminAccount } from './auth.ts'

// --- validateAdminAccount (pure, no DB) ---

Deno.test('validateAdminAccount: null → not_found', () => {
  const result = validateAdminAccount(null)
  assertEquals(result.valid, false)
  if (!result.valid) assertEquals(result.reason, 'not_found')
})

Deno.test('validateAdminAccount: status disabled → disabled', () => {
  const result = validateAdminAccount({
    account_kind: 'owner',
    status: 'disabled',
    expires_at: null,
  })
  assertEquals(result.valid, false)
  if (!result.valid) assertEquals(result.reason, 'disabled')
})

Deno.test('validateAdminAccount: expires_at in the past → expired', () => {
  const result = validateAdminAccount({
    account_kind: 'e2e',
    status: 'active',
    expires_at: '2020-01-01T00:00:00Z',
  })
  assertEquals(result.valid, false)
  if (!result.valid) assertEquals(result.reason, 'expired')
})

Deno.test('validateAdminAccount: expires_at in the future → valid', () => {
  const result = validateAdminAccount({
    account_kind: 'dev_admin',
    status: 'active',
    expires_at: '2099-01-01T00:00:00Z',
  })
  assertEquals(result.valid, true)
  if (result.valid) assertEquals(result.accountKind, 'dev_admin')
})

Deno.test('validateAdminAccount: active owner without expiry → valid', () => {
  const result = validateAdminAccount({
    account_kind: 'owner',
    status: 'active',
    expires_at: null,
  })
  assertEquals(result.valid, true)
  if (result.valid) assertEquals(result.accountKind, 'owner')
})
