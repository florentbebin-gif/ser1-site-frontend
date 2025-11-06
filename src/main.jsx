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
import ProtectedRoute from './ProtectedRoute.jsx'
import './styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Home /> },           
          { path: 'placement', element: <Placement /> },
          { path: 'credit', element: <Credit /> },
          { path: 'params', element: <Params /> },
          { path: 'sim/:section', element: <Sim /> },
        ],
      },

      { path: 'login', element: <Login /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParamsProvider>
      <RouterProvider router={router} />
    </ParamsProvider>
  </React.StrictMode>
);
