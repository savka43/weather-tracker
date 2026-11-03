import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MapControls from './components/MapControls'
import WeatherMap, { type FlyTarget, type LatLon } from './components/map/WeatherMap'
import ForecastPanel, { type ForecastStatus } from './components/panel/ForecastPanel'
import SearchBox from './components/search/SearchBox'
import { useTheme } from './hooks/useTheme'
import { reverseGeocode } from './services/geocoding'
import { getWeatherForPlace } from './services/weatherApi'
import type { Place, WeatherResponse } from './types/weather'
import './App.css'

function placeFromParams(params: URLSearchParams): Place | null {
    const lat = Number(params.get('lat'))
    const lon = Number(params.get('lon'))

    if (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null

    return { lat, lon, name: params.get('name') || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, label: params.get('label') ?? '' }
}

export default function App() {
    const { theme, toggleTheme } = useTheme()
    const [searchParams, setSearchParams] = useSearchParams()

    const [place, setPlace] = useState<Place | null>(() => placeFromParams(searchParams))
    const [marker, setMarker] = useState<LatLon | null>(place)
    const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(() => (place ? { ...place, id: 0 } : null))

    const [weather, setWeather] = useState<WeatherResponse | null>(null)
    const [status, setStatus] = useState<ForecastStatus>(place ? 'loading' : 'idle')
    const [reloadKey, setReloadKey] = useState(0)

    const [collapsed, setCollapsed] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [notice, setNotice] = useState('')

    const reverseRef = useRef<AbortController | null>(null)

    // Загружаем прогноз при смене места
    useEffect(() => {
        if (!place) return

        const controller = new AbortController()

        getWeatherForPlace(place, controller.signal)
            .then((data) => {
                setWeather(data)
                setStatus('ready')
            })
            .catch(() => {
                if (!controller.signal.aborted) setStatus('error')
            })

        return () => controller.abort()
    }, [place, reloadKey])

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(''), 4000)
        return () => window.clearTimeout(timer)
    }, [notice])

    const selectPlace = useCallback(
        (next: Place, fly: boolean) => {
            reverseRef.current?.abort()
            setPlace(next)
            setMarker(next)
            setStatus('loading')
            setCollapsed(false)
            if (fly) setFlyTarget({ lat: next.lat, lon: next.lon, id: Date.now() })
            setSearchParams(
                { lat: next.lat.toFixed(4), lon: next.lon.toFixed(4), name: next.name, ...(next.label ? { label: next.label } : {}) },
                { replace: true },
            )
        },
        [setSearchParams],
    )

    const pickOnMap = useCallback(
        async (point: LatLon, fly = false) => {
            reverseRef.current?.abort()
            const controller = new AbortController()
            reverseRef.current = controller

            setMarker(point)
            setStatus('loading')
            setCollapsed(false)

            try {
                const resolved = await reverseGeocode(point.lat, point.lon, controller.signal)
                if (!controller.signal.aborted) selectPlace(resolved, fly)
            } catch {
                // запрос отменён новым кликом
            }
        },
        [selectPlace],
    )

    const locate = useCallback(() => {
        if (!navigator.geolocation) {
            setNotice('Geolocation is not supported by this browser.')
            return
        }

        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false)
                void pickOnMap({ lat: position.coords.latitude, lon: position.coords.longitude }, true)
            },
            () => {
                setIsLocating(false)
                setNotice('Could not get your location. Check browser permissions.')
            },
            { enableHighAccuracy: false, timeout: 10000 },
        )
    }, [pickOnMap])

    return (
        <div className="app">
            <WeatherMap marker={marker} flyTarget={flyTarget} onPick={pickOnMap} />

            <div className="top-bar">
                <SearchBox onSelect={(next) => selectPlace(next, true)} />
                <MapControls theme={theme} onToggleTheme={toggleTheme} onLocate={locate} isLocating={isLocating} />
            </div>

            <ForecastPanel
                place={place}
                weather={weather}
                status={status}
                collapsed={collapsed}
                onToggle={() => setCollapsed((value) => !value)}
                onRetry={() => {
                    setStatus('loading')
                    setReloadKey((key) => key + 1)
                }}
            />

            {notice && (
                <div className="toast glass" role="status">
                    {notice}
                </div>
            )}
        </div>
    )
}
