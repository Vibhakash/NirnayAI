import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'
import { motion } from 'framer-motion'
import { Play, Check, X, AlertCircle } from 'lucide-react'
import { evaluationAPI, jobsAPI } from '@/services/api'

export default function EvaluationPage() {
  const { t } = useTranslation()
  const [evaluating, setEvaluating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBidder, setSelectedBidder] = useState<any>(null)
  const tenderId = localStorage.getItem('current_tender') || 'demo-tender'

  useEffect(() => {
    loadEvaluationResults()
  }, [])

  const loadEvaluationResults = async () => {
    try {
      setLoading(true)
      const response = await evaluationAPI.getEvaluationResults(tenderId)
      const mappedResults = (response.data.bidders || []).map((b: any) => {
        const verdicts = b.verdicts || [];
        const total = verdicts.length;
        const passed = verdicts.filter((v: any) => (v.effective_verdict || v.verdict) === 'ELIGIBLE').length;
        const score = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        let overallVerdict = 'ELIGIBLE';
        if (score === 100) overallVerdict = 'ELIGIBLE';
        else if (verdicts.some((v: any) => (v.effective_verdict || v.verdict) === 'INELIGIBLE')) overallVerdict = 'INELIGIBLE';
        else if (verdicts.some((v: any) => (v.effective_verdict || v.verdict) === 'NEEDS_REVIEW')) overallVerdict = 'NEEDS_REVIEW';

        return {
          id: b.bidder_id,
          bidder_name: b.bidder_name || `Bidder ${b.bidder_id.substring(0, 4)}`,
          score,
          verdict: overallVerdict,
          reasoning: 'Evaluated by AI. Click to view criterion details.',
          criteria_results: verdicts.map((v: any) => ({
            id: v.id || v._id || Math.random(),
            name: v.criterion_description || v.criterion_id,
            passed: (v.effective_verdict || v.verdict) === 'ELIGIBLE'
          }))
        };
      });
      setResults(mappedResults)
    } catch (error) {
      console.error('[v0] Failed to load evaluation results:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const startEvaluation = async () => {
    try {
      setEvaluating(true)
      const resp = await evaluationAPI.triggerEvaluation(tenderId)
      
      if (resp.data && resp.data.job_id) {
        await jobsAPI.pollJobStatus(resp.data.job_id);
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      await loadEvaluationResults();
      setEvaluating(false)
    } catch (error: any) {
      console.error('[v0] Evaluation failed:', error)
      alert(error.response?.data?.detail || 'Failed to start evaluation')
      setEvaluating(false)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'ELIGIBLE':
        return <Check className="w-6 h-6 text-success-500" />
      case 'INELIGIBLE':
        return <X className="w-6 h-6 text-danger-500" />
      case 'NEEDS_REVIEW':
        return <AlertCircle className="w-6 h-6 text-warning-500" />
      default:
        return null
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'ELIGIBLE':
        return 'bg-success-50 border-success-200 text-success-700'
      case 'INELIGIBLE':
        return 'bg-danger-50 border-danger-200 text-danger-700'
      case 'NEEDS_REVIEW':
        return 'bg-warning-50 border-warning-200 text-warning-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
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
          <h1 className="text-4xl font-bold text-gray-900">{t('evaluation.title')}</h1>
          <p className="text-gray-600 mt-2">{t('evaluation.evaluationInProgress')}</p>
        </motion.div>

        {/* Start Evaluation Button */}
        {results.length === 0 && !loading && (
          <motion.button
            onClick={startEvaluation}
            disabled={evaluating}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {evaluating ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                {t('evaluation.evaluating')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play size={20} />
                {t('evaluation.startEvaluation')}
              </span>
            )}
          </motion.button>
        )}

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

        {/* Results Table */}
        {!loading && results.length > 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('evaluation.bidder')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('evaluation.score')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('evaluation.verdict')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((result, idx) => (
                    <motion.tr
                      key={result.id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium">{result.bidder_name || `Company ${result.id}`}</td>
                      <td className="px-6 py-4">
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.1 }}
                        >
                          <motion.div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.score}%` }}
                              transition={{ delay: idx * 0.1 + 0.2, duration: 0.8 }}
                            />
                          </motion.div>
                          <span className="text-sm font-semibold text-gray-900">{result.score}%</span>
                        </motion.div>
                      </td>
                      <td className="px-6 py-4">
                        <motion.div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 font-semibold text-sm ${getVerdictColor(result.verdict)}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {getVerdictIcon(result.verdict)}
                          {result.verdict}
                        </motion.div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBidder(result)}
                          className="text-primary-500 hover:text-primary-600 font-semibold text-sm"
                        >
                          {t('evaluation.viewDetails')}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Details Modal */}
        {selectedBidder && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBidder(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{selectedBidder.bidder_name}</h2>
                  <button
                    onClick={() => setSelectedBidder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('evaluation.reasoning')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedBidder.reasoning || 'No additional details available.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('evaluation.results')}</h3>
                    <div className="space-y-3">
                      {selectedBidder.criteria_results?.map((criterion: any) => (
                        <div key={criterion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{criterion.name}</span>
                          <motion.span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              criterion.passed
                                ? 'bg-success-100 text-success-700'
                                : 'bg-danger-100 text-danger-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {criterion.passed ? '✓ Pass' : '✗ Fail'}
                          </motion.span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBidder(null)}
                    className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
