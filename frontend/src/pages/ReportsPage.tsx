import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'
import { motion } from 'framer-motion'
import { Download, FileText, CheckCircle } from 'lucide-react'
import { reportsAPI } from '@/services/api'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [signOffSubmitting, setSignOffSubmitting] = useState(false)
  const [signOffModal, setSignOffModal] = useState(false)
  const [approverName, setApproverName] = useState('')

  useEffect(() => {
    loadReportData()
  }, [])

  const tenderId = 'demo-tender' // In a real app, this would come from route params

  const loadReportData = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getSummary(tenderId)
      setReportData(response.data)
    } catch (error) {
      console.error('[v0] Failed to load report:', error)
      // Mock data for demo
      setReportData({
        qualified: 1,
        ineligible: 1,
        needs_review: 1,
        total: 3,
        signed_off: false
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      setDownloading(true)
      let response
      if (format === 'pdf') {
        response = await reportsAPI.generatePDF(tenderId)
      } else if (format === 'excel') {
        response = await reportsAPI.generateExcel(tenderId)
      } else {
        response = await reportsAPI.generateJSON(tenderId)
      }
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a') as HTMLAnchorElement
      link.href = url
      link.setAttribute('download', `report.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      if (link.parentNode) link.parentNode.removeChild(link)
    } catch (error) {
      console.error('[v0] Download failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleSignOff = async () => {
    try {
      setSignOffSubmitting(true)
      await reportsAPI.signOff(tenderId, approverName)
      setReportData({ ...reportData, signed_off: true })
      setSignOffModal(false)
      setApproverName('')
    } catch (error) {
      console.error('[v0] Sign off failed:', error)
    } finally {
      setSignOffSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <motion.div
            className="w-12 h-12 mx-auto rounded-full border-4 border-primary-200 border-t-primary-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <p className="text-gray-600 mt-4">{t('common.loading')}</p>
        </div>
      </MainLayout>
    )
  }

  if (!reportData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">{t('reports.noReport')}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600 mt-2">{t('reports.summary')}</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: t('reports.qualified'), value: reportData.qualified, color: 'success' },
            { label: t('reports.notQualified'), value: reportData.ineligible, color: 'danger' },
            { label: t('reports.needsReview'), value: reportData.needs_review, color: 'warning' },
            { label: 'Total', value: reportData.total, color: 'primary' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className={`p-6 rounded-xl border-2 ${
                item.color === 'success'
                  ? 'bg-success-50 border-success-200'
                  : item.color === 'danger'
                  ? 'bg-danger-50 border-danger-200'
                  : item.color === 'warning'
                  ? 'bg-warning-50 border-warning-200'
                  : 'bg-primary-50 border-primary-200'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <p className="text-gray-600 text-sm font-medium mb-2">{item.label}</p>
              <motion.h3
                className={`text-4xl font-bold ${
                  item.color === 'success'
                    ? 'text-success-700'
                    : item.color === 'danger'
                    ? 'text-danger-700'
                    : item.color === 'warning'
                    ? 'text-warning-700'
                    : 'text-primary-700'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.2, duration: 0.8 }}
              >
                {item.value}
              </motion.h3>
            </motion.div>
          ))}
        </div>

        {/* Download Section */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6">{t('reports.download')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { format: 'pdf', label: t('reports.downloadPDF') },
              { format: 'excel', label: t('reports.downloadExcel') },
              { format: 'json', label: t('reports.downloadJSON') }
            ].map((item) => (
              <motion.button
                key={item.format}
                onClick={() => handleDownload(item.format as any)}
                disabled={downloading}
                className="p-4 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={20} />
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Sign Off Section */}
        {!reportData.signed_off ? (
          <motion.div
            className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2">{t('reports.signOff')}</h2>
            <p className="text-gray-600 mb-6">{t('reports.signOffDescription')}</p>
            <motion.button
              onClick={() => setSignOffModal(true)}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle size={20} />
              {t('reports.sign')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="bg-success-50 border-2 border-success-200 rounded-xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-success-700">{t('reports.signOffSuccess')}</h2>
          </motion.div>
        )}

        {/* Sign Off Modal */}
        {signOffModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSignOffModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">{t('reports.signOff')}</h2>
                <p className="text-gray-600 mb-6">{t('reports.readyToSignOff')}</p>

                <div className="mb-6">
                  <label className="block text-gray-900 font-semibold mb-2">
                    {t('reports.approverName')}
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setSignOffModal(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    onClick={handleSignOff}
                    disabled={!approverName || signOffSubmitting}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {signOffSubmitting ? (
                      <motion.div
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {t('reports.sign')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
