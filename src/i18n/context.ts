import { createContext, useContext } from 'react'
import type { Lang, TranslationKey } from './translations'

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string

export type I18nValue = {
    lang: Lang
    setLang: (lang: Lang) => void
    toggleLang: () => void
    t: TranslateFn
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
    const value = useContext(I18nContext)

    if (!value) {
        throw new Error('useI18n must be used inside I18nProvider')
    }

    return value
}
