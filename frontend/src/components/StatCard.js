import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
export default function StatCard({ title, value, icon, color, animateCount }) {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        if (!animateCount) {
            setDisplayValue(value);
            return;
        }
        let start = 0;
        const increment = Math.ceil(value / 30);
        const interval = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayValue(value);
                clearInterval(interval);
            }
            else {
                setDisplayValue(start);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [value, animateCount]);
    const colorClasses = {
        primary: 'bg-blue-50 border-blue-200 text-primary-500',
        warning: 'bg-yellow-50 border-yellow-200 text-warning-500',
        danger: 'bg-red-50 border-red-200 text-danger-500',
        success: 'bg-green-50 border-green-200 text-success-500',
    };
    return (_jsx(motion.div, { className: `border-2 ${colorClasses[color]} rounded-xl p-6 hover:shadow-lg transition-shadow`, whileHover: { scale: 1.05 }, transition: { duration: 0.3 }, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-gray-600 text-sm font-medium mb-2", children: title }), _jsx(motion.p, { className: "text-4xl font-bold", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: displayValue })] }), _jsx(motion.div, { className: "text-5xl opacity-20", initial: { scale: 0, rotate: -20 }, animate: { scale: 1, rotate: 0 }, transition: { delay: 0.2, type: 'spring' }, children: icon })] }) }));
}
