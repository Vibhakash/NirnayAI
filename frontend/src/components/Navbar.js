import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';
export default function Navbar({ onMenuClick }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsx("nav", { className: "bg-white border-b border-gray-200 shadow-sm", children: _jsxs("div", { className: "px-4 md:px-8 py-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onMenuClick, className: "md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(Menu, { size: 24 }) }), _jsx("div", { className: "text-xl font-bold text-primary-500", children: t('app.name') })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(LanguageSwitcher, {}), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setUserMenuOpen(!userMenuOpen), className: "flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(User, { size: 20 }), _jsx("span", { className: "hidden sm:inline text-sm", children: user?.full_name })] }), userMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsx("p", { className: "text-sm font-semibold", children: user?.full_name }), _jsx("p", { className: "text-xs text-gray-500", children: user?.email })] }), _jsxs("button", { onClick: handleLogout, className: "block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-danger-500 font-semibold flex items-center gap-2", children: [_jsx(LogOut, { size: 18 }), t('common.logOut')] })] }))] })] })] }) }));
}
