import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { waitInitialSession } from './supabaseClient.js'
import { ThemeProvider, DEFAULT_COLORS } from './settings/ThemeProvider'
import { AuthProvider } from './auth'
import './styles.css'
import './styles/premium-shared.css'

// 🚨 CRITICAL: Apply CSS variables BEFORE React renders anything
// This prevents FOUC on direct refresh of lazy routes like /sim/placement
// Variables are applied synchronously before createRoot, guaranteeing they exist
// before any component (including lazy chunks) paints
function applyDefaultCSSVariables() {
  const root = document.documentElement;
  root.style.setProperty('--color-c1', DEFAULT_COLORS.c1);
  root.style.setProperty('--color-c2', DEFAULT_COLORS.c2);
  root.style.setProperty('--color-c3', DEFAULT_COLORS.c3);
  root.style.setProperty('--color-c4', DEFAULT_COLORS.c4);
  root.style.setProperty('--color-c5', DEFAULT_COLORS.c5);
  root.style.setProperty('--color-c6', DEFAULT_COLORS.c6);
  root.style.setProperty('--color-c7', DEFAULT_COLORS.c7);
  root.style.setProperty('--color-c8', DEFAULT_COLORS.c8);
  root.style.setProperty('--color-c9', DEFAULT_COLORS.c9);
  root.style.setProperty('--color-c10', DEFAULT_COLORS.c10);
}

// Apply IMMEDIATELY - before any async work
applyDefaultCSSVariables();

// On attend que Supabase ait fini son travail avant de monter React
waitInitialSession().then(() => {
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
