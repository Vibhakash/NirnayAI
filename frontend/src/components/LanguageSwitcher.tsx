import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '@/i18n/config'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Globe size={20} />
        <span className="hidden sm:inline">{SUPPORTED_LANGUAGES[i18n.language as keyof typeof SUPPORTED_LANGUAGES]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                i18n.language === code ? 'bg-blue-50 text-primary-500 font-semibold' : ''
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
