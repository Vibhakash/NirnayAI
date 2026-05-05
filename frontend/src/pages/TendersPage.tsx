import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import MainLayout from '@/components/layouts/MainLayout'
import { Upload, FileText, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TendersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [tenders, setTenders] = useState<any[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      setUploading(false)
      // Add mock tender
      setTenders([
        {
          id: Math.random(),
          name: file.name,
          status: 'processing',
          uploadDate: new Date().toLocaleDateString(),
        },
        ...tenders,
      ])
    }, 2000)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900">{t('tenders.title')}</h1>
          <p className="text-gray-600 mt-2">{t('tenders.uploadDescription')}</p>
        </motion.div>

        {/* Upload Zone */}
        <motion.label
          className="block"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="border-2 border-dashed border-primary-300 rounded-xl p-12 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer group">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
            />
            <motion.div
              className="text-center"
              animate={uploading ? { scale: 1.05 } : { scale: 1 }}
            >
              <Upload className="w-16 h-16 mx-auto text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {uploading ? t('tenders.uploading') : t('tenders.dragDropText')}
              </p>
              <p className="text-sm text-gray-600">{t('tenders.supportedFormats')}</p>
            </motion.div>
          </div>
        </motion.label>

        {/* Tenders List */}
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold">{t('tenders.allTenders')}</h2>
          </div>

          {tenders.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">{t('tenders.noTenders')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tenders.map((tender, idx) => (
                <motion.div
                  key={tender.id}
                  className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                  onClick={() => navigate(`/tenders/${tender.id}`)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">
                      {tender.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{tender.uploadDate}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      tender.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {tender.status === 'processing' ? t('tenders.statusProcessing') : t('tenders.statusComplete')}
                    </span>
                    <button
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTenders(tenders.filter(t => t.id !== tender.id))
                      }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}
