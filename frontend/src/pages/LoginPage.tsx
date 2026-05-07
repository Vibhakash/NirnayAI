import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await login(formData.username, formData.password)
      navigate('/dashboard')
    } catch {
      // error is handled in store
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4 py-12">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="text-4xl font-bold text-primary-500 mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            {t('app.name')}
          </motion.div>
          <p className="text-gray-600">{t('app.tagline')}</p>
          <h1 className="text-xl font-bold text-gray-800 mt-4">Welcome back</h1>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Demo Credentials Info */}
          <motion.div
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Username: <span className="font-mono">officer</span></p>
            <p>Password: <span className="font-mono">Officer@123</span></p>
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                {t('auth.signingIn')}
              </>
            ) : (
              <>
                <LogIn size={20} />
                {t('auth.signIn')}
              </>
            )}
          </motion.button>
        </form>

        {/* Footer — Register link */}
        <motion.div
          className="text-center mt-8 pt-8 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
