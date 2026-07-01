import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ToastHost from './components/ToastHost'
import Auth from './pages/Auth'
import Home from './pages/Home'
import OccasionDetail from './pages/OccasionDetail'
import OccasionForm from './pages/OccasionForm'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedRoute>
            <OccasionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/occasion/:id"
        element={
          <ProtectedRoute>
            <OccasionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/occasion/:id/edit"
        element={
          <ProtectedRoute>
            <OccasionForm />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastHost />
      </BrowserRouter>
    </AuthProvider>
  )
}
