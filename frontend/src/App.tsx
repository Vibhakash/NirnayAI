import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import TendersPage from '@/pages/TendersPage'
import TenderDetailPage from '@/pages/TenderDetailPage'
import EvaluationPage from '@/pages/EvaluationPage'
import ReviewQueuePage from '@/pages/ReviewQueuePage'
import ReportsPage from '@/pages/ReportsPage'
import AuditLogsPage from '@/pages/AuditLogsPage'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tenders" element={<ProtectedRoute><TendersPage /></ProtectedRoute>} />
        <Route path="/tenders/:tenderId" element={<ProtectedRoute><TenderDetailPage /></ProtectedRoute>} />
        <Route path="/evaluate/:tenderId" element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>} />
        <Route path="/review" element={<ProtectedRoute><ReviewQueuePage /></ProtectedRoute>} />
        <Route path="/reports/:tenderId" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}
