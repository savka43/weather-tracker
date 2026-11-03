import type { Place } from '../types/weather'

type OpenMeteoResult = {
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
}

type NominatimResult = {
    name?: string
    display_name?: string
    address?: Record<string, string | undefined>
}

const uiLanguage = navigator.language.split('-')[0] || 'en'

/** Поиск мест по названию — геокодер Open-Meteo (бесплатно, без ключа). */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
    const params = new URLSearchParams({ name: query, count: '6', language: uiLanguage, format: 'json' })
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal })

    if (!response.ok) {
        throw new Error(`Geocoding failed with status ${response.status}`)
    }

    const data = (await response.json()) as { results?: OpenMeteoResult[] }

    return (data.results ?? []).map((item) => ({
        name: item.name,
        label: [item.admin1, item.country].filter(Boolean).join(', '),
        lat: item.latitude,
        lon: item.longitude,
    }))
}

/** Название места по координатам — Nominatim (OSM). Лимит: 1 запрос в секунду. */
export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<Place> {
    const fallback: Place = { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, label: '', lat, lon }

    try {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            format: 'jsonv2',
            zoom: '10',
            'accept-language': uiLanguage,
        })
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal })

        if (!response.ok) {
            return fallback
        }

        const data = (await response.json()) as NominatimResult
        const address = data.address ?? {}
        const name = address.city ?? address.town ?? address.village ?? address.county ?? address.state ?? data.name

        if (!name) {
            return fallback
        }

        return { name, label: [address.state, address.country].filter((part) => part && part !== name).join(', '), lat, lon }
    } catch (error) {
        if (signal?.aborted) {
            throw error
        }

        return fallback
    }
}
