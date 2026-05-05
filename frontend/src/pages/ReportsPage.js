import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layouts/MainLayout';
export default function ReportsPage() {
    const { tenderId } = useParams();
    const { t } = useTranslation();
    return (_jsx(MainLayout, { children: _jsxs("div", { className: "text-center py-20", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: t('reports.title') }), _jsx("p", { className: "text-gray-600", children: t('common.loading') })] }) }));
}
