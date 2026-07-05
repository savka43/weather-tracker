export type WeatherBase = {
    city: string
    temperature: number
    condition: string
    humidity?: number | null
    wind_speed?: number | null
    pressure?: number | null
    visibility?: number | null
}

export type HourlyForecastItem = {
    time: string
    temperature: number
    rain_probability: number
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
    condition: string
    humidity: number
    wind_speed: number
    pressure: number
    rain_probability: number
    confidence: number
    summary: string
    hourly_forecast: HourlyForecastItem[]
    sources: WeatherSourceForecast[]
}

export type ComparisonResponse = {
    city: string
    sources: WeatherSourceForecast[]
}
