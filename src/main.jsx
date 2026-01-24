import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { waitInitialSession } from './supabaseClient.js'
import { ThemeProvider } from './settings/ThemeProvider'
import { AuthProvider } from './auth'
import './styles.css'
import './styles/premium-shared.css'

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
