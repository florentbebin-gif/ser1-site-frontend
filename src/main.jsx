import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Placement from "./pages/Placement.jsx";
import Credit from "./pages/Credit.jsx";
import Params from "./pages/Params.jsx";
import Sim from "./pages/Sim.jsx";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx"; // ta page reset qui fait exchangeCodeForSession
import ProtectedRoute from "./ProtectedRoute.jsx";
import { ParamsProvider } from "./context/ParamsProvider.jsx";

import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Routes protégées (affichent Login si pas de session)
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "sim/placement",
        element: (
          <ProtectedRoute>
            <Placement />
          </ProtectedRoute>
        ),
      },
      {
        path: "sim/credit",
        element: (
          <ProtectedRoute>
            <Credit />
          </ProtectedRoute>
        ),
      },
      {
        path: "params",
        element: (
          <ProtectedRoute>
            <Params />
          </ProtectedRoute>
        ),
      },
      {
        path: "sim",
        element: (
          <ProtectedRoute>
            <Sim />
          </ProtectedRoute>
        ),
      },

      // Routes publiques : toujours accessibles
      { path: "login", element: <Login /> },
      { path: "reset", element: <ResetPassword /> },
    ],
  },
  // 404 de secours
  { path: "*", element: <div style={{ padding: 24 }}>Page introuvable</div> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ParamsProvider>
      <RouterProvider router={router} />
    </ParamsProvider>
  </React.StrictMode>
);
