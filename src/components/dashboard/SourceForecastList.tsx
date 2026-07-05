import type { WeatherSourceForecast } from '../../types/weather'

type SourceForecastListProps = {
    sources: WeatherSourceForecast[]
}

export default function SourceForecastList({ sources }: SourceForecastListProps) {
    return (
        <section className="dashboard-card source-forecast-card" aria-labelledby="source-forecast-title">
            <h2 id="source-forecast-title">Source Forecasts</h2>
            <ul className="source-forecast-list">
                {sources.map((source) => (
                    <li className="source-forecast-item" key={source.source}>
                        <div>
                            <strong>{source.source}</strong>
                            <span>{Math.round(source.temperature)}° · {source.rain_probability}% rain</span>
                        </div>
                        <span>{source.wind_speed} m/s</span>
                        {source.confidence != null && <span>{source.confidence}%</span>}
                    </li>
                ))}
            </ul>
        </section>
    )
}
