/* global Deno */
import { assert, assertEquals } from '@std/assert'
import type { AdminActionContext } from '../lib/http.ts'
import { themeActionHandlers, validateThemePalette } from './themes.ts'

const HEX_PREFIX = String.fromCharCode(35)
const hex = (value: string) => `${HEX_PREFIX}${value}`

const VALID_PALETTE = {
  c1: hex('1F2937'),
  c2: hex('2563EB'),
  c3: hex('059669'),
  c4: hex('ECFDF5'),
  c5: hex('64748B'),
  c6: hex('B45309'),
  c7: hex('FFFFFF'),
  c8: hex('E5E7EB'),
  c9: hex('6B7280'),
  c10: hex('111827'),
}

Deno.test('validateThemePalette accepte une palette c1-c10 hex stricte', () => {
  assertEquals(validateThemePalette(VALID_PALETTE), {
    ok: true,
    palette: VALID_PALETTE,
  })
})

Deno.test('validateThemePalette refuse une couleur manquante', () => {
  const { c10: _removed, ...palette } = VALID_PALETTE
  const result = validateThemePalette(palette)

  assert(!result.ok)
  assertEquals(result.missing, ['c10'])
})

Deno.test('validateThemePalette refuse une couleur extra', () => {
  const result = validateThemePalette({ ...VALID_PALETTE, c11: hex('000000') })

  assert(!result.ok)
  assertEquals(result.extra, ['c11'])
})

Deno.test('validateThemePalette refuse un hex invalide', () => {
  const result = validateThemePalette({ ...VALID_PALETTE, c2: hex('2563EBFF') })

  assert(!result.ok)
  assertEquals(result.invalid, ['c2'])
})

Deno.test('validateThemePalette refuse une valeur non-string', () => {
  const result = validateThemePalette({ ...VALID_PALETTE, c3: 42 })

  assert(!result.ok)
  assertEquals(result.invalid, ['c3'])
})

Deno.test('create_theme refuse une palette null avant mutation', async () => {
  let fromCalled = false
  const response = await themeActionHandlers.create_theme({
    supabase: {
      from() {
        fromCalled = true
        return {}
      },
    },
    payload: { name: 'Theme test', palette: null },
    principal: {
      userId: 'admin-user',
      role: 'admin',
      accountKind: 'owner',
      requestId: 'rid-theme',
    },
    requestId: 'rid-theme',
    responseHeaders: {},
    req: new Request('https://ser1.test/api/admin'),
    origin: 'https://ser1.test',
    hasAuthHeader: true,
    reqStart: Date.now(),
  } as unknown as AdminActionContext)
  const body = await response.json()

  assertEquals(response.status, 400)
  assertEquals(body.error, 'Objet palette requis')
  assertEquals(fromCalled, false)
})
