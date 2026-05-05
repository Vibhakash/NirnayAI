import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';
export const SUPPORTED_LANGUAGES = {
    en: 'English',
    hi: 'हिंदी',
    kn: 'ಕನ್ನಡ',
};
const resources = {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations },
    kn: { translation: knTranslations },
};
// Get saved language or use browser language
const getSavedLanguage = () => {
    const saved = localStorage.getItem('language');
    if (saved && Object.keys(SUPPORTED_LANGUAGES).includes(saved)) {
        return saved;
    }
    const browserLang = navigator.language.split('-')[0];
    if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
        return browserLang;
    }
    return 'en';
};
i18n
    .use(initReactI18next)
    .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});
// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});
export default i18n;
