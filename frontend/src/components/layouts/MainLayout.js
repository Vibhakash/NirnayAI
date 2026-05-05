import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
export default function MainLayout({ children }) {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, { isOpen: sidebarOpen, onClose: () => setSidebarOpen(false) }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(Navbar, { onMenuClick: () => setSidebarOpen(!sidebarOpen) }), _jsx("main", { className: "flex-1 overflow-auto bg-gradient-to-br from-white to-gray-50", children: _jsx("div", { className: "p-6 md:p-8 max-w-7xl mx-auto", children: children }) })] })] }));
}
