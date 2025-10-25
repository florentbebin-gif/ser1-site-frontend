import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ParamsProvider } from './context/ParamsProvider.jsx'
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParamsProvider>
      <App/>
    </ParamsProvider>
  </React.StrictMode>
)
