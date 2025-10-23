import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Placement from './pages/Placement.jsx'
import Credit from './pages/Credit.jsx'
import Params from './pages/Params.jsx'
import Sim from './pages/Sim.jsx'
import './styles.css'   // <— AJOUT

const router = createBrowserRouter([
  { path: '/', element: <App/>,
    children: [
      { index: true, element: <Home/> },
      { path: '/sim/placement', element: <Placement/> },
      { path: '/sim/credit', element: <Credit/> },
      { path: '/params', element: <Params/> },
      { path: '/sim', element: <Sim/> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
