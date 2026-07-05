import type { ComparisonResponse, WeatherResponse } from '../types/weather'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

async function request<T>(url: string): Promise<T> {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
}

export function getWeather(city: string): Promise<WeatherResponse> {
    return request<WeatherResponse>(`${API_BASE_URL}/weather/${encodeURIComponent(city)}`)
}

export function getWeatherComparison(city: string): Promise<ComparisonResponse> {
    return request<ComparisonResponse>(`${API_BASE_URL}/weather/${encodeURIComponent(city)}/comparison`)
}
