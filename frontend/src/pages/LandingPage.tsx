import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle, Shield, Zap, Users } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 bg-white shadow-sm">
        <div className="text-2xl font-bold text-primary-500">{t('app.name')}</div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {t('auth.login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className="relative h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(/images/hero-background.jpg)` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <motion.div
          className="relative z-10 text-center text-white max-w-3xl px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            {t('branding.heroTitle')}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl mb-8 text-gray-100"
          >
            {t('branding.heroDescription')}
          </motion.p>
          <motion.button
            variants={itemVariants}
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg hover:bg-primary-600 transition-all hover:gap-4 animate-pulse-slow"
          >
            {t('branding.getStarted')}
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* What It Does Section */}
      <section className="py-20 px-6 md:px-12 bg-gray-50">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-center mb-16">{t('branding.whatItDoes')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ArrowRight className="text-primary-500" size={40} />,
                title: t('branding.uploadTender'),
                desc: t('branding.uploadDesc'),
              },
              {
                icon: <CheckCircle className="text-success-500" size={40} />,
                title: t('branding.extractRequirements'),
                desc: t('branding.extractDesc'),
              },
              {
                icon: <Users className="text-warning-500" size={40} />,
                title: t('branding.evaluateCompanies'),
                desc: t('branding.evaluateDesc'),
              },
              {
                icon: <Shield className="text-danger-500" size={40} />,
                title: t('branding.makeDecisions'),
                desc: t('branding.makeDesc'),
              },
              {
                icon: <Zap className="text-primary-500" size={40} />,
                title: t('branding.generateReports'),
                desc: t('branding.reportDesc'),
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why Trust Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-center mb-16">{t('branding.whyTrust')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
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
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`p-8 rounded-lg ${badge.color}`}
              >
                <div className="text-4xl mb-4">{badge.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{badge.title}</h3>
                <p className="text-gray-700">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Smart Assistant Section */}
      <section
        className="py-20 px-6 md:px-12 bg-primary-500 text-white relative"
        style={{ backgroundImage: `url(/images/security-trust.jpg)` }}
      >
        <div className="absolute inset-0 bg-primary-500/80"></div>
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl font-bold mb-6"
          >
            {t('branding.smartAssistant')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl mb-8 text-gray-100"
          >
            {t('branding.assistantDesc')}
          </motion.p>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-gray-50">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl font-bold mb-6"
          >
            {t('branding.readyToStart')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 mb-8"
          >
            {t('branding.startDesc')}
          </motion.p>
          <motion.button
            variants={itemVariants}
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg hover:bg-primary-600 transition-all"
          >
            {t('branding.getStarted')}
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 md:px-12 text-center">
        <p>&copy; 2024 NirnayAI. All rights reserved.</p>
      </footer>
    </div>
  )
}
