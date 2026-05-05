import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import TendersPage from '@/pages/TendersPage';
import TenderDetailPage from '@/pages/TenderDetailPage';
import EvaluationPage from '@/pages/EvaluationPage';
import ReviewQueuePage from '@/pages/ReviewQueuePage';
import ReportsPage from '@/pages/ReportsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
export default function App() {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/tenders", element: _jsx(ProtectedRoute, { children: _jsx(TendersPage, {}) }) }), _jsx(Route, { path: "/tenders/:tenderId", element: _jsx(ProtectedRoute, { children: _jsx(TenderDetailPage, {}) }) }), _jsx(Route, { path: "/evaluate/:tenderId", element: _jsx(ProtectedRoute, { children: _jsx(EvaluationPage, {}) }) }), _jsx(Route, { path: "/review", element: _jsx(ProtectedRoute, { children: _jsx(ReviewQueuePage, {}) }) }), _jsx(Route, { path: "/reports/:tenderId", element: _jsx(ProtectedRoute, { children: _jsx(ReportsPage, {}) }) }), _jsx(Route, { path: "/audit", element: _jsx(ProtectedRoute, { children: _jsx(AuditLogsPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard" }) })] }) }));
}
