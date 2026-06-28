import HourlyForecast from './HourlyForecast'
import { WeatherIcon, type WeatherType } from './WeatherIcon'
import './MainForecast.css'

const currentWeather: {
    city: string
    condition: string
    temperature: string
    feelsLike: string
    type: WeatherType
    updatedAt: string
} = {
    city: 'Moscow',
    condition: 'Partly cloudy',
    temperature: '21°',
    feelsLike: 'Feels like 19°',
    type: 'cloudy',
    updatedAt: 'Updated 14:00',
}

const details = [
    { label: 'Humidity', value: '68%' },
    { label: 'Wind', value: '12 km/h' },
    { label: 'Pressure', value: '1014 hPa' },
    { label: 'Visibility', value: '9 km' },
]

export default function MainForecast() {
    return (
        <section className="forecast-dashboard" aria-labelledby="main-forecast-title">
            <div className="forecast-header">
                <div>
                    <span className="forecast-eyebrow">Current weather</span>
                    <h1 id="main-forecast-title">{currentWeather.city}</h1>
                </div>
                <span className="forecast-updated">{currentWeather.updatedAt}</span>
            </div>

            <div className="info-container">
                <div className="main-info-container">
                    <WeatherIcon type={currentWeather.type} className="svg-weather" />

                    <div className="temperature-block">
                        <span className="temperature-value">{currentWeather.temperature}</span>
                        <span className="temperature-label">{currentWeather.condition}</span>
                        <span className="temperature-feels">{currentWeather.feelsLike}</span>
                    </div>
                </div>

                <ul className="ul-other-info" aria-label="Weather details">
                    {details.map((item) => (
                        <li className="other-info-item" key={item.label}>
                            <span className="other-info-label">{item.label}</span>
                            <span className="other-info-value">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <HourlyForecast />
        </section>
    )
}
