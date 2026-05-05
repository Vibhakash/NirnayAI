import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
export default function TendersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [tenders, setTenders] = useState([]);
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        // Simulate upload
        setTimeout(() => {
            setUploading(false);
            // Add mock tender
            setTenders([
                {
                    id: Math.random(),
                    name: file.name,
                    status: 'processing',
                    uploadDate: new Date().toLocaleDateString(),
                },
                ...tenders,
            ]);
        }, 2000);
    };
    return (_jsx(MainLayout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900", children: t('tenders.title') }), _jsx("p", { className: "text-gray-600 mt-2", children: t('tenders.uploadDescription') })] }), _jsx(motion.label, { className: "block", initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.1 }, children: _jsxs("div", { className: "border-2 border-dashed border-primary-300 rounded-xl p-12 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer group", children: [_jsx("input", { type: "file", onChange: handleFileUpload, disabled: uploading, className: "hidden", accept: ".pdf,.docx,.png,.jpg,.jpeg" }), _jsxs(motion.div, { className: "text-center", animate: uploading ? { scale: 1.05 } : { scale: 1 }, children: [_jsx(Upload, { className: "w-16 h-16 mx-auto text-primary-500 mb-4 group-hover:scale-110 transition-transform" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 mb-2", children: uploading ? t('tenders.uploading') : t('tenders.dragDropText') }), _jsx("p", { className: "text-sm text-gray-600", children: t('tenders.supportedFormats') })] })] }) }), _jsxs(motion.div, { className: "bg-white rounded-xl shadow-lg overflow-hidden", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("h2", { className: "text-2xl font-bold", children: t('tenders.allTenders') }) }), tenders.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(FileText, { className: "w-16 h-16 mx-auto text-gray-300 mb-4" }), _jsx("p", { className: "text-gray-600", children: t('tenders.noTenders') })] })) : (_jsx("div", { className: "divide-y divide-gray-200", children: tenders.map((tender, idx) => (_jsxs(motion.div, { className: "p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer", onClick: () => navigate(`/tenders/${tender.id}`), initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: idx * 0.1 }, children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-primary-500 transition-colors", children: tender.name }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: tender.uploadDate })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-sm font-semibold ${tender.status === 'processing'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-green-100 text-green-700'}`, children: tender.status === 'processing' ? t('tenders.statusProcessing') : t('tenders.statusComplete') }), _jsx("button", { className: "p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all", onClick: (e) => {
                                                    e.stopPropagation();
                                                    setTenders(tenders.filter(t => t.id !== tender.id));
                                                }, children: _jsx(Trash2, { size: 20 }) })] })] }, tender.id))) }))] })] }) }));
}
