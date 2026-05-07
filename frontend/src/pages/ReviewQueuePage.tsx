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
      const tenderId = localStorage.getItem('current_tender') || 'demo-tender'
      const response = await reviewAPI.getReviewQueue(tenderId)
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
      const tenderId = localStorage.getItem('current_tender') || 'demo-tender'
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

  const formatReasoning = (text: string) => {
    if (!text) return "Pending manual review.";
    
    // Remove technical markers if they leak through
    let clean = text;
    if (clean.includes("Mistral API failed") || clean.includes("System error")) {
      try {
        const jsonMatch = clean.match(/\{.*\}/);
        if (jsonMatch) {
          const err = JSON.parse(jsonMatch[0]);
          if (err.message) clean = err.message;
        }
      } catch (e) {}
      
      if (clean === text) {
        clean = "Automated evaluation encountered a technical discrepancy. Manual check recommended.";
      }
    }

    // Remove the specific requested strings
    clean = clean.replace(/Evaluation Error: /g, "");
    clean = clean.replace(/\. Please review the document manually\./g, ".");
    clean = clean.replace(/Please review the document manually\./g, "");

    return clean;
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
                          <span className="text-warning-600 font-semibold">Make your decision</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-500 mb-1">Assessment:</p>
                      <p className="text-gray-800 font-medium">{item.criterion_description || 'Bidder Overall Assessment'}</p>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm whitespace-pre-line line-clamp-4">
                      {formatReasoning(item.needs_review_reason || item.reasoning)}
                    </p>

                    <motion.button
                      className="text-primary-500 hover:text-primary-600 font-semibold inline-block group"
                      whileHover={{ x: 4 }}
                    >
                      Details →
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
            <DecisionModal 
              item={selectedItem} 
              onClose={() => {
                setSelectedItem(null);
                setNotes('');
              }}
              onSubmit={async (decision, notes) => {
                await handleDecision(selectedItem, decision, notes);
              }}
              t={t}
              formatReasoning={formatReasoning}
            />
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}

function DecisionModal({ item, onClose, onSubmit, t, formatReasoning }: { item: any, onClose: () => void, onSubmit: (decision: 'ELIGIBLE' | 'INELIGIBLE', notes: string) => Promise<void>, t: any, formatReasoning: (t: string) => string }) {
  const [decision, setDecision] = useState<'ELIGIBLE' | 'INELIGIBLE' | ''>('');
  const [notes, setLocalNotes] = useState('');
  const [submitting, setLocalSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    setLocalSubmitting(true);
    await onSubmit(decision, notes);
    setLocalSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{item.bidder_name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Assessment Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">Bidder Overall Assessment</h3>
              <p className="text-gray-700 font-medium text-sm">{item.criterion_description || 'Combined evaluation across all submitted criteria'}</p>
            </div>

            {/* Why Needs Review */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('review.whyNeedsReview')}</h3>
              <p className="text-gray-600 leading-relaxed bg-warning-50 p-3 rounded-lg border border-warning-100 text-warning-900 whitespace-pre-line">
                {formatReasoning(item.needs_review_reason || item.reasoning || "")}
              </p>
            </div>

            {/* AI Reasoning & Evidence */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <div className="space-y-3">
                <p className="text-gray-700 text-sm">{formatReasoning(item.reasoning)}</p>
                {item.extracted_value && (
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    <strong>Extracted Value:</strong> {item.extracted_value}
                  </p>
                )}
                {item.source_text_span && (
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    <strong>Source Text:</strong> "{item.source_text_span}"
                  </p>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Decision Selection */}
            <div>
              <label className="block text-gray-900 font-semibold mb-3">
                Your Final Decision <span className="text-danger-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${decision === 'ELIGIBLE' ? 'border-success-500 bg-success-50 text-success-700 font-bold' : 'border-gray-200 hover:border-success-200 text-gray-600'}`}>
                  <input 
                    type="radio" 
                    name="decision" 
                    value="ELIGIBLE" 
                    checked={decision === 'ELIGIBLE'} 
                    onChange={() => setDecision('ELIGIBLE')} 
                    className="hidden" 
                  />
                  <Check size={20} />
                  Accept (Eligible)
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${decision === 'INELIGIBLE' ? 'border-danger-500 bg-danger-50 text-danger-700 font-bold' : 'border-gray-200 hover:border-danger-200 text-gray-600'}`}>
                  <input 
                    type="radio" 
                    name="decision" 
                    value="INELIGIBLE" 
                    checked={decision === 'INELIGIBLE'} 
                    onChange={() => setDecision('INELIGIBLE')} 
                    className="hidden" 
                  />
                  <X size={20} />
                  Reject (Ineligible)
                </label>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">
                {t('review.notes')} <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder={t('review.addNotes')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!decision || submitting}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {submitting ? (
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : null}
              {t('common.submit')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
