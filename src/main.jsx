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
import ResetPassword from './pages/ResetPassword.jsx'           // <= AJOUT
import { ParamsProvider } from './context/ParamsProvider.jsx'   // <= si déjà créé
import './styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App/>,
    children: [
      { index: true, element: <Home/> },
      { path: '/sim/placement', element: <Placement/> },
      { path: '/sim/credit', element: <Credit/> },
      { path: '/params', element: <Params/> },
      { path: '/sim', element: <Sim/> },
      { path: '/login', element: <Login/> },
      { path: '/reset', element: <ResetPassword/> },            // <= AJOUT
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
