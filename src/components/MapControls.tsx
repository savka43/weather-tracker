import { LoaderCircle, LocateFixed, Moon, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import { useI18n } from '../i18n/context'
import type { Lang } from '../i18n/translations'

type MapControlsProps = {
    theme: Theme
    onToggleTheme: () => void
    lang: Lang
    onToggleLang: () => void
    onLocate: () => void
    isLocating: boolean
}

export default function MapControls({ theme, onToggleTheme, lang, onToggleLang, onLocate, isLocating }: MapControlsProps) {
    const { t } = useI18n()

    return (
        <div className="map-controls">
            <button type="button" className="icon-button glass" onClick={onLocate} disabled={isLocating} aria-label={t('controls.locate')} title={t('controls.locate')}>
                {isLocating ? <LoaderCircle className="spin" size={20} /> : <LocateFixed size={20} />}
            </button>
            <button type="button" className="icon-button glass" onClick={onToggleTheme} aria-label={t('controls.theme')} title={t('controls.theme')}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button type="button" className="icon-button glass lang-button" onClick={onToggleLang} aria-label={t('controls.language')} title={t('controls.language')}>
                {lang === 'ru' ? 'EN' : 'RU'}
            </button>
        </div>
    )
}
