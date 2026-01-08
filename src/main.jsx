import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { waitInitialSession } from './supabaseClient.js'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { ThemeProvider } from './settings/ThemeProvider'
import './styles.css'

// On attend que Supabase ait fini son travail avant de monter React
waitInitialSession().then(() => {
  createRoot(document.getElementById('root')).render(
    // StrictMode double-mount breaks auth listeners in dev
    <React.Fragment>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.Fragment>
  )
})
