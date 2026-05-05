import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { tendersAPI } from '@/services/api';
import MainLayout from '@/components/layouts/MainLayout';
import StatCard from '@/components/StatCard';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const [stats, setStats] = useState({
        activeTenders: 0,
        pendingEvaluations: 0,
        needingReview: 0,
    });
    const [loading, setLoading] = useState(true);
    const [tenders, setTenders] = useState([]);
    useEffect(() => {
        loadDashboardData();
    }, []);
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await tendersAPI.getTenders();
            const tendersList = response.data.tenders || [];
            setTenders(tendersList.slice(0, 5));
            // Calculate stats based on tender statuses
            const activeTenders = tendersList.filter((t) => t.status === 'active').length;
            const pendingEvals = tendersList.filter((t) => t.status === 'pending_evaluation').length;
            const needingReview = tendersList.filter((t) => t.status === 'pending_review').length;
            setStats({
                activeTenders,
                pendingEvaluations: pendingEvals,
                needingReview,
            });
        }
        catch (error) {
            console.error('[v0] Failed to load dashboard:', error);
            // Set mock data for demo
            setStats({
                activeTenders: 3,
                pendingEvaluations: 2,
                needingReview: 1,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };
    return (_jsx(MainLayout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("h1", { className: "text-4xl font-bold text-gray-900", children: [t('dashboard.welcome'), ", ", user?.full_name] }), _jsx("p", { className: "text-gray-600 mt-2", children: t('app.tagline') })] }), _jsxs(motion.div, { className: "grid grid-cols-1 md:grid-cols-3 gap-6", variants: containerVariants, initial: "hidden", animate: "visible", children: [_jsx(motion.div, { variants: itemVariants, children: _jsx(StatCard, { title: t('dashboard.activeTenders'), value: stats.activeTenders, icon: _jsx(Plus, { className: "text-primary-500", size: 32 }), color: "primary", animateCount: true }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(StatCard, { title: t('dashboard.pendingEvaluations'), value: stats.pendingEvaluations, icon: _jsx(AlertCircle, { className: "text-warning-500", size: 32 }), color: "warning", animateCount: true }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(StatCard, { title: t('dashboard.needingReview'), value: stats.needingReview, icon: _jsx(CheckCircle, { className: "text-danger-500", size: 32 }), color: "danger", animateCount: true }) })] }), _jsxs(motion.div, { className: "bg-white rounded-xl shadow-lg p-8", variants: itemVariants, initial: "hidden", animate: "visible", transition: { delay: 0.4 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: t('dashboard.quickActions') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { onClick: () => navigate('/tenders'), className: "p-4 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors font-semibold flex items-center justify-center gap-2 group", children: [_jsx(Plus, { size: 20 }), t('dashboard.uploadNew'), _jsx(ArrowRight, { size: 20, className: "opacity-0 group-hover:opacity-100 transition-opacity" })] }), _jsxs("button", { onClick: () => navigate('/review'), className: "p-4 border-2 border-warning-500 text-warning-500 rounded-lg hover:bg-warning-50 transition-colors font-semibold flex items-center justify-center gap-2 group", children: [_jsx(AlertCircle, { size: 20 }), t('dashboard.reviewDecisions'), _jsx(ArrowRight, { size: 20, className: "opacity-0 group-hover:opacity-100 transition-opacity" })] }), _jsxs("button", { onClick: () => navigate('/audit'), className: "p-4 border-2 border-success-500 text-success-500 rounded-lg hover:bg-success-50 transition-colors font-semibold flex items-center justify-center gap-2 group", children: [_jsx(CheckCircle, { size: 20 }), t('dashboard.viewReports'), _jsx(ArrowRight, { size: 20, className: "opacity-0 group-hover:opacity-100 transition-opacity" })] })] })] }), _jsxs(motion.div, { className: "bg-white rounded-xl shadow-lg p-8", variants: itemVariants, initial: "hidden", animate: "visible", transition: { delay: 0.5 }, children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: t('tenders.allTenders') }), _jsxs("button", { onClick: () => navigate('/tenders'), className: "text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-2", children: ["View All ", _jsx(ArrowRight, { size: 20 })] })] }), loading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" }) })) : tenders.length > 0 ? (_jsx("div", { className: "space-y-4", children: tenders.map((tender, idx) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: idx * 0.1 }, className: "flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group", onClick: () => navigate(`/tenders/${tender.id}`), children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-primary-500 transition-colors", children: tender.name || `Tender ${tender.id}` }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: tender.status })] }), _jsx("div", { className: "text-right", children: _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-sm font-semibold ${tender.status === 'active' ? 'bg-success-100 text-success-700' :
                                                tender.status === 'pending_evaluation' ? 'bg-warning-100 text-warning-700' :
                                                    'bg-gray-100 text-gray-700'}`, children: tender.status }) })] }, tender.id))) })) : (_jsx("div", { className: "text-center py-12 text-gray-500", children: _jsx("p", { children: t('tenders.noTenders') }) }))] })] }) }));
}
