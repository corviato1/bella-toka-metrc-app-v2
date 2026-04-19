import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import BiowastePage from './pages/BiowastePage'
import MovePlantsPage from './pages/MovePlantsPage'
import WhereIsWhatPage from './pages/WhereIsWhatPage'
import HistoryPage from './pages/HistoryPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔓 LOGIN */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* 🔐 MAIN APP */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BiowastePage />} />
          <Route path="move" element={<MovePlantsPage />} />
          <Route path="where" element={<WhereIsWhatPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>

        {/* 🔁 FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}