import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type TranslateFn } from './context'
import { LANGS, translations, type Lang } from './translations'

const STORAGE_KEY = 'weather-lang'

function getInitialLang(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved && (LANGS as string[]).includes(saved)) {
        return saved as Lang
    }

    return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export default function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>(getInitialLang)

    useEffect(() => {
        document.documentElement.lang = lang
        localStorage.setItem(STORAGE_KEY, lang)
    }, [lang])

    const t = useCallback<TranslateFn>(
        (key, vars) => {
            let text = translations[lang][key]

            for (const [name, value] of Object.entries(vars ?? {})) {
                text = text.replace(`{${name}}`, String(value))
            }

            return text
        },
        [lang],
    )

    const value = useMemo(
        () => ({ lang, setLang, toggleLang: () => setLang((current) => (current === 'ru' ? 'en' : 'ru')), t }),
        [lang, t],
    )

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
