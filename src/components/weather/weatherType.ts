import type { HourlyForecastItem } from '../../types/weather'
import type { WeatherType } from './WeatherIcon'

export function getWeatherType(condition: string): WeatherType {
    const value = condition.toLowerCase()

    if (value.includes('thunder')) return 'thunder'
    if (value.includes('rain') || value.includes('drizzle')) return 'rain'
    if (value.includes('snow')) return 'snow'
    if (value.includes('fog') || value.includes('mist')) return 'fog'
    if (value.includes('clear') || value.includes('sun')) return 'clear'

    return 'cloudy'
}

export function getHourlyWeatherType(item: HourlyForecastItem): WeatherType {
    if (item.condition) return getWeatherType(item.condition)
    if (item.rain_probability >= 70) return 'rain'
    if (item.rain_probability >= 45) return 'cloudy'

    return 'clear'
}

export function conditionKey(condition: string) {
    return `condition.${getWeatherType(condition)}` as const
}
