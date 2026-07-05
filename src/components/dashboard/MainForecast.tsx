import HourlyForecast from './HourlyForecast'
import type { WeatherResponse } from '../../types/weather'
import AiSummaryCard from './AiSummaryCard'
import ConfidenceCard from './ConfidenceCard'
import SourceForecastList from './SourceForecastList'
import WeatherMainCard from './WeatherMainCard'
import './MainForecast.css'

type MainForecastProps = {
    weather: WeatherResponse
}

export default function MainForecast({ weather }: MainForecastProps) {
    const details = [
        { label: 'Humidity', value: `${weather.humidity}%` },
        { label: 'Wind', value: `${weather.wind_speed} m/s` },
        { label: 'Pressure', value: `${weather.pressure} hPa` },
        { label: 'Rain', value: `${weather.rain_probability}%` },
    ]

    return (
        <section className="forecast-dashboard" aria-labelledby="main-forecast-title">
            <div className="forecast-header">
                <div>
                    <span className="forecast-eyebrow">Current weather</span>
                    <h1 id="main-forecast-title">AI Forecast Dashboard</h1>
                </div>
                <span className="forecast-updated">{weather.country ?? 'Mock data'}</span>
            </div>

            <div className="info-container">
                <WeatherMainCard weather={weather} />

                <ul className="ul-other-info" aria-label="Weather details">
                    {details.map((item) => (
                        <li className="other-info-item" key={item.label}>
                            <span className="other-info-label">{item.label}</span>
                            <span className="other-info-value">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="dashboard-secondary-grid">
                <ConfidenceCard confidence={weather.confidence} />
                <AiSummaryCard summary={weather.summary} />
            </div>

            <HourlyForecast items={weather.hourly_forecast} />
            <SourceForecastList sources={weather.sources} />
        </section>
    )
}
