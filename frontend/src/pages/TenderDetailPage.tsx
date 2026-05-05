import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'

export default function TenderDetailPage() {
  const { tenderId } = useParams()
  const { t } = useTranslation()

  return (
    <MainLayout>
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Tender #{tenderId}</h1>
        <p className="text-gray-600 mb-8">{t('common.loading')}</p>
      </div>
    </MainLayout>
  )
}
