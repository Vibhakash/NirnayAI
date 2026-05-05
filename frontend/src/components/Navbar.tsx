import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Menu, LogOut, User } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Left Side - Menu & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="text-xl font-bold text-primary-500">{t('app.name')}</div>
        </div>

        {/* Right Side - Language & User */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={20} />
              <span className="hidden sm:inline text-sm">{user?.full_name}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-semibold">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-danger-500 font-semibold flex items-center gap-2"
                >
                  <LogOut size={18} />
                  {t('common.logOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
