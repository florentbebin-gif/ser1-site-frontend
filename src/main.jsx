import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { waitInitialSession } from './supabaseClient.ts'
import { ThemeProvider, DEFAULT_COLORS } from './settings/ThemeProvider'
import { AuthProvider } from './auth'
import './styles.css'
import './styles/premium-shared.css'

const THEME_CACHE_KEY_PREFIX = 'ser1_theme_cache_'
const CABINET_THEME_CACHE_KEY_PREFIX = 'ser1_cabinet_theme_cache_'

// 🚨 CRITICAL: Apply CSS variables BEFORE React renders anything
// This prevents FOUC on refresh by using localStorage cache only (no RPC)
function applyThemeBootstrap() {
  if (typeof window !== 'undefined' && window.__ser1ThemeBootstrap?.colors) {
    return
  }
  const root = document.documentElement
  const themeSource = localStorage.getItem('themeSource') === 'custom' ? 'custom' : 'cabinet'
  const userId = getUserIdFromAuthStorage()
  const cachedColors = userId
    ? readCachedColors(themeSource === 'cabinet' ? CABINET_THEME_CACHE_KEY_PREFIX : THEME_CACHE_KEY_PREFIX, userId)
    : null
  const colors = cachedColors || DEFAULT_COLORS
  applyCSSVariables(root, colors)
}

function applyCSSVariables(root, colors) {
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

function readCachedColors(prefix, userId) {
  try {
    const raw = localStorage.getItem(`${prefix}${userId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.colors) return null
    return { ...DEFAULT_COLORS, ...parsed.colors }
  } catch {
    return null
  }
}

function getUserIdFromAuthStorage() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key || !key.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const userId = parsed?.user?.id || parsed?.currentSession?.user?.id
      if (userId) return userId
    }
  } catch {
    return null
  }
  return null
}

import AppErrorFallback from './components/AppErrorFallback'

// Apply IMMEDIATELY - before any async work
applyThemeBootstrap()

// On attend que Supabase ait fini son travail avant de monter React
waitInitialSession()
  .then(() => {
    createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    )
  })
  .catch((error) => {
    // Cas critique : Supabase mal configuré ou inaccessible au boot
    console.error('[Fatal] App initialization failed:', error)
    createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <AppErrorFallback error={error} type="config" />
      </React.StrictMode>
    )
  })
