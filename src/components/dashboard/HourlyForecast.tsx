import type { HourlyForecastItem } from '../../types/weather'
import { WeatherIcon, type WeatherType } from './WeatherIcon'

type HourlyForecastProps = {
    items: HourlyForecastItem[]
}

function getHourlyWeatherType(item: HourlyForecastItem): WeatherType {
    if (item.rain_probability >= 70) {
        return 'rain'
    }

    if (item.rain_probability >= 45) {
        return 'cloudy'
    }

    return 'clear'
}

export default function HourlyForecast({ items }: HourlyForecastProps) {
    return (
        <section className="hourly-forecast" aria-labelledby="hourly-forecast-title">
            <h2 id="hourly-forecast-title">Hourly Forecast</h2>
            <ul className="forecast-list">
                {items.map((item) => (
                    <li className="forecast-card" key={item.time}>
                        <span className="forecast-time">{item.time}</span>
                        <WeatherIcon type={getHourlyWeatherType(item)} className="forecast-svg" title={`${item.rain_probability}% rain`} />
                        <span className="forecast-temperature">{Math.round(item.temperature)}°</span>
                        <span className="forecast-rain">{item.rain_probability}%</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}
