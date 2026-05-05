import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'
import { reviewAPI } from '@/services/api'

export default function ReviewQueuePage() {
  const { t } = useTranslation()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviewQueue()
  }, [])

  const loadReviewQueue = async () => {
    try {
      setLoading(true)
      const response = await reviewAPI.getReviewQueue()
      setQueue(response.data.items || [])
    } catch (error) {
      console.error('[v0] Failed to load review queue:', error)
      // Mock data for demo
      setQueue([
        {
          id: 1,
          bidder_name: 'Company B',
          score: 58,
          reasoning: 'Experience requirement has some gaps but meets core financial criteria. Decision uncertain.',
          criteria_borderline: [
            { name: 'Experience', status: 'borderline', details: 'Has 8 years, requirement was 10 years' }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (item: any, verdict: 'ELIGIBLE' | 'INELIGIBLE') => {
    if (!selectedItem) return

    try {
      setSubmitting(true)
      const tenderId = 'demo-tender'
      const bidderId = item.id.toString()
      await reviewAPI.overrideVerdict(tenderId, bidderId, verdict, notes)

      // Remove from queue
      setQueue(queue.filter(q => q.id !== item.id))
      setSelectedItem(null)
      setNotes('')
    } catch (error) {
      console.error('[v0] Failed to submit decision:', error)
    } finally {
      setSubmitting(false)
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
          <h1 className="text-4xl font-bold text-gray-900">{t('review.title')}</h1>
          <p className="text-gray-600 mt-2">{t('review.queueDescription')}</p>
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

        {/* Empty State */}
        {!loading && queue.length === 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Check className="w-20 h-20 text-success-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('review.allClear')}</h2>
            <p className="text-gray-600">{t('review.noItems')}</p>
          </motion.div>
        )}

        {/* Review Queue Cards */}
        {!loading && queue.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {queue.map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.bidder_name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="text-warning-500" size={20} />
                          <span className="text-warning-600 font-semibold">{t('review.makeDecision')}</span>
                        </div>
                      </div>
                      <motion.div
                        className="text-4xl font-bold text-warning-500"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2, type: 'spring' }}
                      >
                        {item.score}%
                      </motion.div>
                    </div>

                    <p className="text-gray-600 mb-4">{item.reasoning}</p>

                    <motion.button
                      className="text-primary-500 hover:text-primary-600 font-semibold inline-block group"
                      whileHover={{ x: 4 }}
                    >
                      {t('common.viewDetails')} →
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Decision Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedItem(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{selectedItem.bidder_name}</h2>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Company Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{t('review.companyInfo')}</h3>
                      <p className="text-gray-600">Score: {selectedItem.score}%</p>
                    </div>

                    {/* Why Needs Review */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('review.whyNeedsReview')}</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedItem.reasoning}</p>
                    </div>

                    {/* Borderline Criteria */}
                    {selectedItem.criteria_borderline && selectedItem.criteria_borderline.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Borderline Criteria</h3>
                        <div className="space-y-3">
                          {selectedItem.criteria_borderline.map((criterion: any, idx: number) => (
                            <motion.div
                              key={idx}
                              className="p-3 bg-warning-50 border border-warning-200 rounded-lg"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <p className="font-semibold text-warning-900">{criterion.name}</p>
                              <p className="text-sm text-warning-700 mt-1">{criterion.details}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        {t('review.notes')}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('review.addNotes')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={4}
                      />
                    </div>

                    {/* Decision Buttons */}
                    <div className="flex gap-4">
                      <motion.button
                        onClick={() => handleDecision(selectedItem, 'ELIGIBLE')}
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {submitting ? (
                          <motion.div
                            className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        ) : (
                          <Check size={20} />
                        )}
                        {t('review.accept')}
                      </motion.button>

                      <motion.button
                        onClick={() => handleDecision(selectedItem, 'INELIGIBLE')}
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {submitting ? (
                          <motion.div
                            className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        ) : (
                          <X size={20} />
                        )}
                        {t('review.reject')}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}
