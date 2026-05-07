import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'
import { tendersAPI, criteriaAPI, biddersAPI } from '@/services/api'
import { FileText, ArrowLeft, Plus, Check, Edit2, Trash2, X, Building2, Upload } from 'lucide-react'

export default function TenderDetailPage() {
  const { tenderId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [tender, setTender] = useState<any>(null)
  const [bidders, setBidders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isAddCriterionModalOpen, setIsAddCriterionModalOpen] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<any>(null)
  const [criterionForm, setCriterionForm] = useState({ description: '', criterion_type: 'Technical', is_mandatory: true })
  
  const [isAddBidderModalOpen, setIsAddBidderModalOpen] = useState(false)
  const [bidderForm, setBidderForm] = useState<{ name: string, file: File | null }>({ name: '', file: null })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadTenderData = async () => {
      try {
        if (!tenderId || tenderId === 'undefined') {
          setLoading(false)
          return
        }
        const response = await tendersAPI.getTenderById(tenderId)
        setTender(response.data)
        
        try {
          const biddersRes = await biddersAPI.getBidders(tenderId)
          setBidders(biddersRes.data || [])
        } catch(err) {
          console.error('Failed to load bidders:', err)
        }
      } catch (error) {
        console.error('Failed to load tender:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTenderData()
  }, [tenderId])

  const handleConfirmCriteria = async () => {
    try {
      setIsSubmitting(true)
      await criteriaAPI.confirmCriteria(tenderId!)
      const response = await tendersAPI.getTenderById(tenderId!)
      setTender(response.data)
    } catch(err) {
      console.error('Failed to confirm criteria', err)
      alert('Failed to confirm criteria')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveCriterion = async () => {
    if (!criterionForm.description) return
    try {
      setIsSubmitting(true)
      if (editingCriterion) {
        await criteriaAPI.updateCriteria(tenderId!, editingCriterion.criterion_id, criterionForm)
      } else {
        await criteriaAPI.addCriteria(tenderId!, criterionForm)
      }
      setIsAddCriterionModalOpen(false)
      setEditingCriterion(null)
      setCriterionForm({ description: '', criterion_type: 'Technical', is_mandatory: true })
      
      const response = await tendersAPI.getTenderById(tenderId!)
      setTender(response.data)
    } catch(err) {
      console.error('Failed to save criterion', err)
      alert('Failed to save criterion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCriterion = async (criterionId: string) => {
    if (!window.confirm('Are you sure you want to delete this criterion?')) return
    try {
      await criteriaAPI.deleteCriteria(tenderId!, criterionId)
      const response = await tendersAPI.getTenderById(tenderId!)
      setTender(response.data)
    } catch(err) {
      console.error('Failed to delete criterion', err)
      alert('Failed to delete criterion')
    }
  }

  const handleAddBidder = async () => {
    if (!bidderForm.name || !bidderForm.file) {
      alert('Please provide a name and a document')
      return
    }
    try {
      setIsSubmitting(true)
      await biddersAPI.addBidder(tenderId!, bidderForm.name, bidderForm.file)
      setIsAddBidderModalOpen(false)
      setBidderForm({ name: '', file: null })
      
      const biddersRes = await biddersAPI.getBidders(tenderId!)
      setBidders(biddersRes.data || [])
    } catch(err) {
      console.error('Failed to add bidder', err)
      alert('Failed to add bidder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <button 
          onClick={() => navigate('/tenders')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </button>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        ) : tender ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex items-start gap-6">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <FileText className="w-10 h-10 text-primary-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {tender.title || tender.name || `Tender #${tender.id}`}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">Created:</span>
                    {new Date(tender.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    tender.status === 'processing' ? 'bg-warning-100 text-warning-700' : 
                    tender.status === 'active' || tender.status === 'completed' ? 'bg-success-100 text-success-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {tender.status}
                  </span>
                  {tender.confirmed_by && (
                    <span className="flex items-center gap-1 text-success-600 font-semibold px-3 py-1 bg-success-50 rounded-full">
                      <Check size={16} /> Criteria Confirmed
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-10">
              {tender.description && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{tender.description}</p>
                </div>
              )}
              
              {/* Criteria Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Extracted Criteria 
                    <span className="ml-3 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-bold">
                      {tender.criteria?.length || 0}
                    </span>
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingCriterion(null)
                        setCriterionForm({ description: '', criterion_type: 'Technical', is_mandatory: true })
                        setIsAddCriterionModalOpen(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <Plus size={16} /> Add Criterion
                    </button>
                    {!tender.confirmed_by && tender.criteria?.length > 0 && (
                      <button
                        onClick={handleConfirmCriteria}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        <Check size={16} /> Confirm Requirements
                      </button>
                    )}
                  </div>
                </div>

                {tender.criteria?.length > 0 ? (
                  <div className="grid gap-4">
                    {tender.criteria.map((c: any) => (
                      <div key={c.criterion_id} className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingCriterion(c)
                              setCriterionForm({ description: c.description, criterion_type: c.criterion_type, is_mandatory: c.is_mandatory })
                              setIsAddCriterionModalOpen(true)
                            }}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCriterion(c.criterion_id)}
                            className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="font-medium text-gray-900 text-lg mb-3 pr-20">{c.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg font-medium border border-gray-200">
                            Type: {c.criterion_type}
                          </span>
                          <span className={`px-3 py-1 rounded-lg font-medium border ${
                            c.is_mandatory 
                              ? 'bg-danger-50 text-danger-700 border-danger-200' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {c.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium text-lg">No criteria extracted yet.</p>
                    <p className="text-gray-400 mt-2">They will appear here once processing is complete.</p>
                  </div>
                )}
              </div>

              {/* Bidders Section */}
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="text-primary-500" /> Companies / Bidders
                    <span className="ml-3 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-bold">
                      {bidders.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsAddBidderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm"
                  >
                    <Plus size={16} /> Add a Company
                  </button>
                </div>
                
                {bidders.length > 0 ? (
                  <div className="grid gap-4">
                     {bidders.map(b => (
                       <div key={b.id} className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                         <div>
                           <p className="font-bold text-gray-900 text-lg">{b.name}</p>
                           <p className="text-sm text-gray-500 mt-1 capitalize font-medium px-2 py-0.5 bg-gray-100 rounded inline-block">Status: {b.status}</p>
                         </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium text-lg">No companies have submitted bids yet.</p>
                    <p className="text-gray-400 mt-2">Click "Add a Company" to submit a bid.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Tender Not Found</h1>
            <p className="text-gray-500 text-lg">The requested tender could not be found or there was an error loading it.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Criterion Modal */}
      {isAddCriterionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingCriterion ? 'Edit Criterion' : 'Add Criterion'}</h2>
              <button onClick={() => setIsAddCriterionModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  value={criterionForm.description}
                  onChange={e => setCriterionForm({...criterionForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none h-24"
                  placeholder="Enter requirement description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select 
                    value={criterionForm.criterion_type}
                    onChange={e => setCriterionForm({...criterionForm, criterion_type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Financial">Financial</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select 
                    value={criterionForm.is_mandatory ? 'mandatory' : 'optional'}
                    onChange={e => setCriterionForm({...criterionForm, is_mandatory: e.target.value === 'mandatory'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleSaveCriterion}
                disabled={isSubmitting || !criterionForm.description.trim()}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Criterion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bidder Modal */}
      {isAddBidderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add a Company</h2>
              <button onClick={() => setIsAddBidderModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                <input 
                  type="text"
                  value={bidderForm.name}
                  onChange={e => setBidderForm({...bidderForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Submission Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                  <input 
                    type="file"
                    onChange={e => setBidderForm({...bidderForm, file: e.target.files?.[0] || null})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    {bidderForm.file ? bidderForm.file.name : 'Click or drag file to upload'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleAddBidder}
                disabled={isSubmitting || !bidderForm.name.trim() || !bidderForm.file}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : 'Submit Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
