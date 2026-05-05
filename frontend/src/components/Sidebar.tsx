import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  MessageSquare,
  BarChart3,
  LogOut,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const logout = useAuthStore((state) => state.logout)

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: FileText, label: t('nav.tenders'), path: '/tenders' },
    { icon: CheckCircle, label: t('nav.evaluation'), path: '/tenders' },
    { icon: MessageSquare, label: t('nav.review'), path: '/review' },
    { icon: BarChart3, label: t('nav.reports'), path: '/tenders' },
    { icon: LogOut, label: t('nav.audit'), path: '/audit' },
  ]

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <motion.div
        className={`fixed md:relative w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto z-50 md:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform`}
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-full flex flex-col">
          {/* Close Button (Mobile) */}
          <div className="md:hidden p-4 border-b border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-6 space-y-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                (item.path === '/tenders' && location.pathname.startsWith('/tenders'))

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-100 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </motion.button>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-6 border-t border-gray-200">
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors font-semibold"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={20} />
              <span>{t('nav.logout')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
