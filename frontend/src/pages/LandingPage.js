import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle, Shield, Zap, Users } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { motion } from 'framer-motion';
export default function LandingPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
    };
    return (_jsxs("div", { className: "min-h-screen bg-white overflow-hidden", children: [_jsxs("nav", { className: "flex justify-between items-center px-6 md:px-12 py-6 bg-white shadow-sm", children: [_jsx("div", { className: "text-2xl font-bold text-primary-500", children: t('app.name') }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(LanguageSwitcher, {}), _jsx("button", { onClick: () => navigate('/login'), className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors", children: t('auth.login') })] })] }), _jsxs("div", { className: "relative h-screen bg-cover bg-center flex items-center justify-center", style: { backgroundImage: `url(/images/hero-background.jpg)` }, children: [_jsx("div", { className: "absolute inset-0 bg-black/40" }), _jsxs(motion.div, { className: "relative z-10 text-center text-white max-w-3xl px-6", variants: containerVariants, initial: "hidden", animate: "visible", children: [_jsx(motion.h1, { variants: itemVariants, className: "text-5xl md:text-6xl font-bold mb-6 leading-tight", children: t('branding.heroTitle') }), _jsx(motion.p, { variants: itemVariants, className: "text-xl md:text-2xl mb-8 text-gray-100", children: t('branding.heroDescription') }), _jsxs(motion.button, { variants: itemVariants, onClick: () => navigate('/login'), className: "inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg hover:bg-primary-600 transition-all hover:gap-4 animate-pulse-slow", children: [t('branding.getStarted'), _jsx(ArrowRight, { size: 20 })] })] })] }), _jsx("section", { className: "py-20 px-6 md:px-12 bg-gray-50", children: _jsxs(motion.div, { className: "max-w-6xl mx-auto", variants: containerVariants, initial: "hidden", whileInView: "visible", viewport: { once: true }, children: [_jsx("h2", { className: "text-4xl font-bold text-center mb-16", children: t('branding.whatItDoes') }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [
                                {
                                    icon: _jsx(ArrowRight, { className: "text-primary-500", size: 40 }),
                                    title: t('branding.uploadTender'),
                                    desc: t('branding.uploadDesc'),
                                },
                                {
                                    icon: _jsx(CheckCircle, { className: "text-success-500", size: 40 }),
                                    title: t('branding.extractRequirements'),
                                    desc: t('branding.extractDesc'),
                                },
                                {
                                    icon: _jsx(Users, { className: "text-warning-500", size: 40 }),
                                    title: t('branding.evaluateCompanies'),
                                    desc: t('branding.evaluateDesc'),
                                },
                                {
                                    icon: _jsx(Shield, { className: "text-danger-500", size: 40 }),
                                    title: t('branding.makeDecisions'),
                                    desc: t('branding.makeDesc'),
                                },
                                {
                                    icon: _jsx(Zap, { className: "text-primary-500", size: 40 }),
                                    title: t('branding.generateReports'),
                                    desc: t('branding.reportDesc'),
                                },
                            ].map((feature, idx) => (_jsxs(motion.div, { variants: itemVariants, className: "bg-white p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all", children: [_jsx("div", { className: "mb-4", children: feature.icon }), _jsx("h3", { className: "text-xl font-bold mb-3", children: feature.title }), _jsx("p", { className: "text-gray-600", children: feature.desc })] }, idx))) })] }) }), _jsx("section", { className: "py-20 px-6 md:px-12 bg-white", children: _jsxs(motion.div, { className: "max-w-6xl mx-auto", variants: containerVariants, initial: "hidden", whileInView: "visible", viewport: { once: true }, children: [_jsx("h2", { className: "text-4xl font-bold text-center mb-16", children: t('branding.whyTrust') }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-12", children: [
                                {
                                    title: t('branding.transparent'),
                                    desc: t('branding.transparentDesc'),
                                    color: 'bg-blue-100',
                                    icon: '🔍',
                                },
                                {
                                    title: t('branding.secure'),
                                    desc: t('branding.secureDesc'),
                                    color: 'bg-green-100',
                                    icon: '🔒',
                                },
                                {
                                    title: t('branding.fair'),
                                    desc: t('branding.fairDesc'),
                                    color: 'bg-purple-100',
                                    icon: '⚖️',
                                },
                                {
                                    title: t('branding.fast'),
                                    desc: t('branding.fastDesc'),
                                    color: 'bg-orange-100',
                                    icon: '⚡',
                                },
                            ].map((badge, idx) => (_jsxs(motion.div, { variants: itemVariants, className: `p-8 rounded-lg ${badge.color}`, children: [_jsx("div", { className: "text-4xl mb-4", children: badge.icon }), _jsx("h3", { className: "text-2xl font-bold mb-2", children: badge.title }), _jsx("p", { className: "text-gray-700", children: badge.desc })] }, idx))) })] }) }), _jsxs("section", { className: "py-20 px-6 md:px-12 bg-primary-500 text-white relative", style: { backgroundImage: `url(/images/security-trust.jpg)` }, children: [_jsx("div", { className: "absolute inset-0 bg-primary-500/80" }), _jsxs(motion.div, { className: "relative z-10 max-w-4xl mx-auto text-center", variants: containerVariants, initial: "hidden", whileInView: "visible", viewport: { once: true }, children: [_jsx(motion.h2, { variants: itemVariants, className: "text-4xl font-bold mb-6", children: t('branding.smartAssistant') }), _jsx(motion.p, { variants: itemVariants, className: "text-xl mb-8 text-gray-100", children: t('branding.assistantDesc') })] })] }), _jsx("section", { className: "py-20 px-6 md:px-12 bg-gray-50", children: _jsxs(motion.div, { className: "max-w-4xl mx-auto text-center", variants: containerVariants, initial: "hidden", whileInView: "visible", viewport: { once: true }, children: [_jsx(motion.h2, { variants: itemVariants, className: "text-4xl font-bold mb-6", children: t('branding.readyToStart') }), _jsx(motion.p, { variants: itemVariants, className: "text-xl text-gray-600 mb-8", children: t('branding.startDesc') }), _jsxs(motion.button, { variants: itemVariants, onClick: () => navigate('/login'), className: "inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg hover:bg-primary-600 transition-all", children: [t('branding.getStarted'), _jsx(ArrowRight, { size: 20 })] })] }) }), _jsx("footer", { className: "bg-gray-900 text-gray-400 py-12 px-6 md:px-12 text-center", children: _jsx("p", { children: "\u00A9 2024 NirnayAI. All rights reserved." }) })] }));
}
