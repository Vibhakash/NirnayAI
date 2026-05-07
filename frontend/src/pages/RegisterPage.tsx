import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'procurement_officer',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearError()
    setValidationError(null)
  }

  const validate = (): boolean => {
    if (!formData.full_name.trim()) {
      setValidationError('Full name is required.')
      return false
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setValidationError('Username must be at least 3 characters.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Please enter a valid email address.')
      return false
    }
    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters.')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await register({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch {
      // error is already set in store
    }
  }

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white text-gray-900 placeholder-gray-400'

  const displayError = validationError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <motion.div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="text-4xl font-bold text-primary-500 mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            NirnayAI
          </motion.div>
          <p className="text-gray-500 text-sm">Your Smart Tender Review Assistant</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details below to get started</p>
        </div>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
              <p className="text-green-700 text-sm font-medium">
                Account created! Redirecting to dashboard…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{displayError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. Priya Sharma"
              disabled={isLoading}
            />
          </motion.div>

          {/* Username */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. priya_sharma"
              disabled={isLoading}
            />
          </motion.div>

          {/* Email */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </motion.div>

          {/* Password */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                className={`${inputClass} pr-12`}
                placeholder="Min. 8 characters"
                disabled={isLoading}
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
            {/* Password strength indicator */}
            {formData.password && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = Math.min(
                    4,
                    (formData.password.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(formData.password) ? 1 : 0) +
                      (/[0-9]/.test(formData.password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0)
                  )
                  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        level <= strength ? colors[strength - 1] : 'bg-gray-200'
                      }`}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`${inputClass} pr-12 ${
                  formData.confirmPassword && formData.confirmPassword !== formData.password
                    ? 'border-red-400 focus:ring-red-400'
                    : formData.confirmPassword && formData.confirmPassword === formData.password
                    ? 'border-green-400 focus:ring-green-400'
                    : ''
                }`}
                placeholder="Re-enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Creating account…
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.div
          className="text-center mt-6 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
