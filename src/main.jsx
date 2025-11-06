// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Placement from './pages/Placement.jsx'
import Credit from './pages/Credit.jsx'
import Params from './pages/Params.jsx'
import Sim from './pages/Sim.jsx'
import Login from './pages/Login.jsx'
import { ParamsProvider } from './context/ParamsProvider.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // zone protégée
      {
        element: <ProtectedRoute />, // protège tout ce qui suit
        children: [
          { index: true, element: <Home /> },               // /
          { path: 'placement', element: <Placement /> },    // /placement
          { path: 'credit', element: <Credit /> },          // /credit
          { path: 'params', element: <Params /> },          // /params
          { path: 'sim/:section', element: <Sim /> },       // /sim/potentiel etc.
        ],
      },

      // public
      { path: 'login', element: <Login /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParamsProvider>
      <RouterProvider router={router} />
    </ParamsProvider>
  </React.StrictMode>
)
