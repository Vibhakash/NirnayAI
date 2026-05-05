import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle } from 'lucide-react';
export default function LoginPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [formData, setFormData] = useState({
        email: 'officer@example.com', // Demo credentials
        password: 'password123',
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearError();
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        }
        catch (error) {
            console.error('[v0] Login failed:', error);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4 py-12", children: [_jsx("div", { className: "absolute top-6 right-6", children: _jsx(LanguageSwitcher, {}) }), _jsxs(motion.div, { className: "w-full max-w-md bg-white rounded-2xl shadow-xl p-8", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(motion.div, { className: "text-4xl font-bold text-primary-500 mb-2", initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring' }, children: t('app.name') }), _jsx("p", { className: "text-gray-600", children: t('app.tagline') })] }), error && (_jsxs(motion.div, { className: "mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, children: [_jsx(AlertCircle, { className: "text-danger-500 flex-shrink-0 mt-0.5", size: 20 }), _jsx("p", { className: "text-danger-700 text-sm", children: error })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 }, children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-semibold text-gray-700 mb-2", children: t('auth.email') }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all", placeholder: "you@example.com", disabled: isLoading })] }), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-semibold text-gray-700 mb-2", children: t('auth.password') }), _jsx("input", { type: "password", id: "password", name: "password", value: formData.password, onChange: handleChange, required: true, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: isLoading })] }), _jsxs(motion.div, { className: "p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, children: [_jsx("p", { className: "font-semibold mb-1", children: "Demo Credentials:" }), _jsx("p", { children: "Email: officer@example.com" }), _jsx("p", { children: "Password: password123" })] }), _jsx(motion.button, { type: "submit", disabled: isLoading, className: "w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 mt-6", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6 }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" }), t('auth.signingIn')] })) : (_jsxs(_Fragment, { children: [_jsx(LogIn, { size: 20 }), t('auth.signIn')] })) })] }), _jsx(motion.div, { className: "text-center mt-8 pt-8 border-t border-gray-200", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.7 }, children: _jsx("p", { className: "text-gray-600 text-sm", children: t('branding.startDesc') }) })] })] }));
}
