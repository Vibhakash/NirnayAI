import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layouts/MainLayout';
export default function AuditLogsPage() {
    const { t } = useTranslation();
    return (_jsx(MainLayout, { children: _jsxs("div", { className: "text-center py-20", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: t('audit.title') }), _jsx("p", { className: "text-gray-600", children: t('audit.noLogs') })] }) }));
}
