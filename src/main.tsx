import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { waitInitialSession } from './supabaseClient.ts'
import { ThemeProvider, DEFAULT_COLORS, type ThemeColors } from './settings/ThemeProvider'
import { AuthProvider } from './auth'
import AppErrorFallback from './components/AppErrorFallback'
import './styles/index.css'
import './styles/app/index.css'
import './styles/premium-shared.css'

const THEME_CACHE_KEY_PREFIX = 'ser1_theme_cache_'
const CABINET_THEME_CACHE_KEY_PREFIX = 'ser1_cabinet_theme_cache_'
const CABINET_BRANDING_KEY_BY_USER_PREFIX = 'ser1_cabinet_branding_key_'

type AuthStoragePayload = {
  user?: { id?: string }
  currentSession?: { user?: { id?: string } }
}

// 🚨 CRITICAL: Apply CSS variables BEFORE React renders anything
// This prevents FOUC on refresh by using localStorage cache only (no RPC)
function applyThemeBootstrap(): void {
  if (typeof window !== 'undefined' && window.__ser1ThemeBootstrap?.colors) {
    return
  }
  const root = document.documentElement
  const userId = getUserIdFromAuthStorage()
  const cabinetBrandingKey = userId ? getCabinetBrandingKeyFromStorage(userId) : null
  const themeSourceKey = `themeSource:${cabinetBrandingKey || 'cabinet:none'}`
  const themeSource = localStorage.getItem(themeSourceKey) === 'custom' ? 'custom' : 'cabinet'
  const cacheScopeKey = themeSource === 'cabinet' ? cabinetBrandingKey : userId
  const cachePrefix = themeSource === 'cabinet' ? CABINET_THEME_CACHE_KEY_PREFIX : THEME_CACHE_KEY_PREFIX
  const cachedColors = cacheScopeKey
    ? readCachedColors(cachePrefix, cacheScopeKey)
    : null
  const colors = cachedColors || DEFAULT_COLORS
  applyCSSVariables(root, colors)
}

function applyCSSVariables(root: HTMLElement, colors: ThemeColors): void {
  root.style.setProperty('--color-c1', colors.c1)
  root.style.setProperty('--color-c2', colors.c2)
  root.style.setProperty('--color-c3', colors.c3)
  root.style.setProperty('--color-c4', colors.c4)
  root.style.setProperty('--color-c5', colors.c5)
  root.style.setProperty('--color-c6', colors.c6)
  root.style.setProperty('--color-c7', colors.c7)
  root.style.setProperty('--color-c8', colors.c8)
  root.style.setProperty('--color-c9', colors.c9)
  root.style.setProperty('--color-c10', colors.c10)
}

function readCachedColors(prefix: string, scopeKey: string): ThemeColors | null {
  try {
    const raw = localStorage.getItem(`${prefix}${scopeKey}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !('colors' in parsed)) return null
    const colors = (parsed as { colors?: Partial<ThemeColors> }).colors
    return colors ? { ...DEFAULT_COLORS, ...colors } : null
  } catch {
    return null
  }
}

function getCabinetBrandingKeyFromStorage(userId: string): string | null {
  try {
    return localStorage.getItem(`${CABINET_BRANDING_KEY_BY_USER_PREFIX}${userId}`)
  } catch {
    return null
  }
}

function getUserIdFromAuthStorage(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key || !key.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as AuthStoragePayload
      const userId = parsed.user?.id || parsed.currentSession?.user?.id
      if (userId) return userId
    }
  } catch {
    return null
  }
  return null
}

// Apply IMMEDIATELY - before any async work
applyThemeBootstrap()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root container "#root" not found.')
}

const root = createRoot(rootElement)

// On attend que Supabase ait fini son travail avant de monter React
waitInitialSession()
  .then(() => {
    root.render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>
    )
  })
  .catch((error: unknown) => {
    const fatalError = error instanceof Error ? error : new Error(String(error))
    // Cas critique : Supabase mal configuré ou inaccessible au boot
    console.error('[Fatal] App initialization failed:', fatalError)
    root.render(
      <StrictMode>
        <AppErrorFallback error={fatalError} type="config" />
      </StrictMode>
    )
  })

