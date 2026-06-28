import { WeatherIcon, type WeatherType } from './WeatherIcon'

const hourlyForecast: Array<{
    time: string
    temperature: string
    type: WeatherType
    condition: string
}> = [
    { time: '15:00', temperature: '21°', type: 'cloudy', condition: 'Cloudy' },
    { time: '16:00', temperature: '20°', type: 'rain', condition: 'Rain' },
    { time: '17:00', temperature: '19°', type: 'rain', condition: 'Rain' },
    { time: '18:00', temperature: '18°', type: 'fog', condition: 'Fog' },
    { time: '19:00', temperature: '17°', type: 'clear', condition: 'Clear' },
    { time: '20:00', temperature: '16°', type: 'clear', condition: 'Clear' },
    { time: '21:00', temperature: '15°', type: 'cloudy', condition: 'Cloudy' },
    { time: '22:00', temperature: '14°', type: 'fog', condition: 'Fog' },
    { time: '23:00', temperature: '13°', type: 'rain', condition: 'Rain' },
    { time: '00:00', temperature: '12°', type: 'rain', condition: 'Rain' },
    { time: '01:00', temperature: '11°', type: 'thunder', condition: 'Thunderstorm' },
    { time: '02:00', temperature: '10°', type: 'snow', condition: 'Snow' },
]

export default function HourlyForecast() {
    return (
        <section className="hourly-forecast" aria-labelledby="hourly-forecast-title">
            <h2 id="hourly-forecast-title">Hourly Forecast</h2>
            <ul className="forecast-list">
                {hourlyForecast.map((item) => (
                    <li className="forecast-card" key={item.time}>
                        <span className="forecast-time">{item.time}</span>
                        <WeatherIcon type={item.type} className="forecast-svg" title={item.condition} />
                        <span className="forecast-temperature">{item.temperature}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}
