import { LoaderCircle, LocateFixed, Moon, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

type MapControlsProps = {
    theme: Theme
    onToggleTheme: () => void
    onLocate: () => void
    isLocating: boolean
}

export default function MapControls({ theme, onToggleTheme, onLocate, isLocating }: MapControlsProps) {
    return (
        <div className="map-controls">
            <button type="button" className="icon-button glass" onClick={onLocate} disabled={isLocating} aria-label="Use my location" title="Use my location">
                {isLocating ? <LoaderCircle className="spin" size={20} /> : <LocateFixed size={20} />}
            </button>
            <button type="button" className="icon-button glass" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
    )
}
