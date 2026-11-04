import type { Lang } from '../i18n/translations'
import type { Place, WeatherResponse } from '../types/weather'
import { getStaticForecast } from './staticForecast'

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal })

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
}

export function getWeatherForPlace(place: Place, lang: Lang, signal?: AbortSignal): Promise<WeatherResponse> {
    if (STATIC_MODE) return getStaticForecast(place, lang, signal)

    const params = new URLSearchParams({
        lat: place.lat.toFixed(4),
        lon: place.lon.toFixed(4),
        name: place.name,
        lang,
    })

    return request<WeatherResponse>(`${API_BASE_URL}/weather?${params}`, signal)
}
