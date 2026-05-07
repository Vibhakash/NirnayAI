import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'
import { motion } from 'framer-motion'
import { ChevronDown, Calendar, Filter } from 'lucide-react'
import { auditAPI } from '@/services/api'

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('')

  useEffect(() => {
    loadAuditLogs()
  }, [filterAction])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const params = filterAction ? { action_type: filterAction } : {}
      const response = await auditAPI.getAuditLogs(params)
      setLogs(response.data.entries || [])
    } catch (error) {
      console.error('[v0] Failed to load audit logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const actionTypes = [
    { value: 'TENDER_CREATED', label: t('audit.actionTypes.upload') || 'Tender Created' },
    { value: 'CRITERION_ADDED', label: t('audit.actionTypes.criteria_added') || 'Criterion Added' },
    { value: 'EVALUATION_STARTED', label: t('audit.actionTypes.evaluation_started') || 'Evaluation Started' },
    { value: 'REPORT_SIGNED_OFF', label: t('audit.actionTypes.sign_off') || 'Sign Off' }
  ]

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'criteria_added':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'evaluation_started':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'sign_off':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900">{t('audit.title')}</h1>
          <p className="text-gray-600 mt-2">{t('audit.description')}</p>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter size={20} />
              <span className="font-semibold">{t('audit.filterByAction')}:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                onClick={() => setFilterAction('')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterAction === ''
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                All
              </motion.button>
              {actionTypes.map((type) => (
                <motion.button
                  key={type.value}
                  onClick={() => setFilterAction(type.value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filterAction === type.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <motion.div
              className="w-12 h-12 mx-auto rounded-full border-4 border-primary-200 border-t-primary-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p className="text-gray-600 mt-4">{t('common.loading')}</p>
          </div>
        )}

        {/* Logs List */}
        {!loading && logs.length > 0 && (
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <motion.div
                key={log.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full p-6 hover:bg-gray-50 transition-colors text-left flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <motion.span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getActionColor(log.action_type)}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {log.description || log.action_type}
                      </motion.span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-semibold">{log.user_name || 'System'}</span>
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedLog === log.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="text-gray-500 group-hover:text-primary-500 transition-colors" size={24} />
                  </motion.div>
                </button>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <motion.div
                    className="px-6 pb-6 border-t border-gray-200 bg-gray-50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{t('audit.details')}</h4>
                        <pre className="bg-white p-4 rounded-lg overflow-x-auto text-xs text-gray-600 font-mono border border-gray-200">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">ID:</span>
                          <p className="text-gray-900 font-semibold">{log.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Timestamp:</span>
                          <p className="text-gray-900 font-semibold">
                            {new Date(log.timestamp).toISOString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-gray-600">{t('audit.noLogs')}</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
