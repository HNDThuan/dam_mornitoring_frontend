'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { vi } from '@/lib/i18n/vi'
import { en } from '@/lib/i18n/en'

const translations = { vi, en }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('vi')

  useEffect(() => {
    const saved = localStorage.getItem('app_locale')
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLocaleState(lang)
      localStorage.setItem('app_locale', lang)
    }
  }

  const toggleLanguage = () => {
    const next = locale === 'vi' ? 'en' : 'vi'
    setLocale(next)
  }

  /**
   * Helper function t(key, params)
   * e.g. t('nav.home') or t('dashboard.viewAllStations', { count: 8 })
   */
  const t = (keyPath, params = {}) => {
    const dict = translations[locale] || vi
    const keys = keyPath.split('.')
    let current = dict

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k]
      } else {
        // Fallback to Vietnamese dictionary if key missing in EN
        let fallback = vi
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk]
          else return keyPath
        }
        current = typeof fallback === 'string' ? fallback : keyPath
        break
      }
    }

    if (typeof current !== 'string') return keyPath

    // Replace params: { count: 8 } -> replace "{count}"
    let result = current
    Object.keys(params).forEach(p => {
      result = result.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p])
    })

    return result
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
