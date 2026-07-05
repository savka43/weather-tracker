import type { WeatherResponse } from '../../types/weather'
import { WeatherIcon, type WeatherType } from './WeatherIcon'

type WeatherMainCardProps = {
    weather: WeatherResponse
}

function getWeatherType(condition: string): WeatherType {
    const normalizedCondition = condition.toLowerCase()

    if (normalizedCondition.includes('rain')) {
        return 'rain'
    }

    if (normalizedCondition.includes('snow')) {
        return 'snow'
    }

    if (normalizedCondition.includes('thunder')) {
        return 'thunder'
    }

    if (normalizedCondition.includes('fog')) {
        return 'fog'
    }

    if (normalizedCondition.includes('clear')) {
        return 'clear'
    }

    return 'cloudy'
}

export default function WeatherMainCard({ weather }: WeatherMainCardProps) {
    return (
        <div className="main-info-container">
            <WeatherIcon type={getWeatherType(weather.condition)} className="svg-weather" />

            <div className="temperature-block">
                <span className="temperature-city">{weather.city}</span>
                <span className="temperature-value">{Math.round(weather.temperature)}°</span>
                <span className="temperature-label">{weather.condition}</span>
                <span className="temperature-feels">{weather.rain_probability}% chance of rain</span>
            </div>
        </div>
    )
}
