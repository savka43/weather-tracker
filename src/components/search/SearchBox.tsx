import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { useI18n } from '../../i18n/context'
import { searchPlaces } from '../../services/geocoding'
import type { Place } from '../../types/weather'

type SearchBoxProps = {
    onSelect: (place: Place) => void
}

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

export default function SearchBox({ onSelect }: SearchBoxProps) {
    const { lang, t } = useI18n()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Place[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const rootRef = useRef<HTMLDivElement>(null)
    const skipSearchRef = useRef(false)

    useEffect(() => {
        const trimmed = query.trim()

        if (trimmed.length < MIN_QUERY_LENGTH || skipSearchRef.current) {
            skipSearchRef.current = false
            return
        }

        const controller = new AbortController()

        const timer = window.setTimeout(async () => {
            try {
                const places = await searchPlaces(trimmed, lang, controller.signal)
                setResults(places)
                setActiveIndex(places.length ? 0 : -1)
            } catch {
                if (!controller.signal.aborted) setResults([])
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }, DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [query, lang])

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [])

    function choose(place: Place) {
        onSelect(place)
        skipSearchRef.current = place.name !== query
        setQuery(place.name)
        setIsLoading(false)
        setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown' && results.length) {
            event.preventDefault()
            setIsOpen(true)
            setActiveIndex((index) => (index + 1) % results.length)
        } else if (event.key === 'ArrowUp' && results.length) {
            event.preventDefault()
            setActiveIndex((index) => (index - 1 + results.length) % results.length)
        } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault()
            choose(results[activeIndex])
        } else if (event.key === 'Escape') {
            setIsOpen(false)
        }
    }

    const trimmedLength = query.trim().length
    const showDropdown = isOpen && trimmedLength >= MIN_QUERY_LENGTH

    return (
        <div className="search-box glass" ref={rootRef}>
            <div className="search-input-row">
                <Search className="search-icon" size={18} aria-hidden />
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('search.placeholder')}
                    value={query}
                    onChange={(event) => {
                        const value = event.target.value
                        setQuery(value)
                        setIsOpen(true)
                        setIsLoading(value.trim().length >= MIN_QUERY_LENGTH)
                        if (value.trim().length < MIN_QUERY_LENGTH) setResults([])
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls="search-results"
                    aria-autocomplete="list"
                />
                {isLoading && <LoaderCircle className="spin search-status" size={18} aria-label={t('search.searching')} />}
                {query && !isLoading && (
                    <button
                        type="button"
                        className="icon-button search-clear"
                        aria-label={t('search.clear')}
                        onClick={() => {
                            setQuery('')
                            setResults([])
                            setIsLoading(false)
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showDropdown && (
                <ul className="search-results" id="search-results" role="listbox">
                    {results.map((place, index) => (
                        <li key={`${place.lat},${place.lon}`} role="option" aria-selected={index === activeIndex}>
                            <button
                                type="button"
                                className={index === activeIndex ? 'search-result active' : 'search-result'}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => choose(place)}
                            >
                                <MapPin size={16} aria-hidden />
                                <span>
                                    <strong>{place.name}</strong>
                                    {place.label && <small>{place.label}</small>}
                                </span>
                            </button>
                        </li>
                    ))}
                    {!isLoading && results.length === 0 && <li className="search-empty">{t('search.empty')}</li>}
                </ul>
            )}
        </div>
    )
}
