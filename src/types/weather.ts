export type Condition = 'Clear' | 'Cloudy' | 'Fog' | 'Rain' | 'Snow' | 'Thunderstorm'

export type AiError =
    | 'timeout'
    | 'rate_limited'
    | 'provider_error'
    | 'auth_error'
    | 'billing_error'
    | 'network_error'
    | 'invalid_json'
    | 'out_of_range'
    | 'not_configured'

export type HourlyForecastItem = {
    time: string
    temperature: number
    rain_probability: number
    condition?: Condition | null
}

export type WeatherSourceForecast = {
    source: string
    temperature: number
    rain_probability: number
    wind_speed: number
    confidence?: number | null
}

export type WeatherResponse = {
    city: string
    country?: string | null
    temperature: number
    condition: Condition
    humidity: number
    wind_speed: number
    pressure: number
    rain_probability: number
    confidence: number | null
    trusted_sources: string[]
    reasoning: string | null
    recommendations: string[]
    hourly_forecast: HourlyForecastItem[]
    sources: WeatherSourceForecast[]
    ai_failed: boolean
    ai_error: AiError | null
}

export type Place = {
    name: string
    label: string
    lat: number
    lon: number
}
