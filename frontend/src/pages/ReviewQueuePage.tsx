import { useTranslation } from 'react-i18next'
import MainLayout from '@/components/layouts/MainLayout'

export default function ReviewQueuePage() {
  const { t } = useTranslation()

  return (
    <MainLayout>
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">{t('review.title')}</h1>
        <p className="text-gray-600">{t('review.noItems')}</p>
      </div>
    </MainLayout>
  )
}
