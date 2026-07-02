import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useOccasions } from './hooks/useOccasions'
import { requestNotificationPermissions, syncReminders } from './lib/localNotifications'
import ToastHost from './components/ToastHost'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import OccasionDetail from './pages/OccasionDetail'
import OccasionForm from './pages/OccasionForm'
import NotificationGuide from './pages/NotificationGuide'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  const { occasions, loading } = useOccasions()

  useEffect(() => {
    if (!user || loading) return
    void requestNotificationPermissions().then(() => syncReminders(occasions))
  }, [user, loading, occasions])

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      <Route
        path="/notification-guide"
        element={
          <ProtectedRoute>
            <NotificationGuide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
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
