import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import arTranslations from './locales/ar.json'
import enTranslations from './locales/en.json'

const resources = {
  ar: {
    translation: arTranslations
  },
  en: {
    translation: enTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar', // Arabic as default
    lng: 'ar', // Start with Arabic
    debug: false, // Set to false for cleaner output

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

// Set initial document direction
const setDocumentDirection = (language) => {
  const isRTL = language === 'ar'
  document.dir = isRTL ? 'rtl' : 'ltr'
  document.documentElement.lang = language
  
  // Add RTL class to body for additional styling
  if (isRTL) {
    document.body.classList.add('rtl')
    document.body.classList.remove('ltr')
  } else {
    document.body.classList.add('ltr')
    document.body.classList.remove('rtl')
  }
}

// Set initial direction
setDocumentDirection(i18n.language)

// Listen for language changes
i18n.on('languageChanged', setDocumentDirection)

export default i18n
