import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/components/layouts/MainLayout';
export default function TenderDetailPage() {
    const { tenderId } = useParams();
    const { t } = useTranslation();
    return (_jsx(MainLayout, { children: _jsxs("div", { className: "text-center py-20", children: [_jsxs("h1", { className: "text-3xl font-bold mb-4", children: ["Tender #", tenderId] }), _jsx("p", { className: "text-gray-600 mb-8", children: t('common.loading') })] }) }));
}
