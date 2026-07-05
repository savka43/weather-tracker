import { useState, type FormEvent } from 'react'
import { getWeatherComparison } from '../services/weatherApi'
import type { ComparisonResponse } from '../types/weather'
import './ForecastComparisonPage.css'

export default function ForecastComparisonPage() {
    const [city, setCity] = useState('')
    const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const nextCity = city.trim()

        if (!nextCity) {
            setError('Enter a city name to compare forecasts.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const data = await getWeatherComparison(nextCity)
            setComparison(data)
        } catch {
            setError('Could not load comparison data. Check that the backend is running.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="comparison-page">
            <section className="comparison-container">
                <div className="comparison-header">
                    <div>
                        <span className="comparison-eyebrow">Source comparison</span>
                        <h1>Forecast Comparison</h1>
                    </div>
                    {comparison && <span className="comparison-city">{comparison.city}</span>}
                </div>

                <form className="comparison-search-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter a city name..."
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                    />
                    <button className="search-button" type="submit" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Compare'}
                    </button>
                </form>

                {error && <p className="form-error">{error}</p>}

                {!comparison ? (
                    <div className="comparison-empty-state">
                        <h2>Compare weather sources</h2>
                        <p>Search for a city to compare Open-Meteo, OpenWeather, WeatherAPI and the AI Model forecast.</p>
                    </div>
                ) : (
                    <div className="comparison-grid">
                        {comparison.sources.map((source) => (
                            <article className="comparison-card" key={source.source}>
                                <h2>{source.source}</h2>
                                <dl>
                                    <div>
                                        <dt>Temperature</dt>
                                        <dd>{Math.round(source.temperature)}°</dd>
                                    </div>
                                    <div>
                                        <dt>Rain</dt>
                                        <dd>{source.rain_probability}%</dd>
                                    </div>
                                    <div>
                                        <dt>Wind</dt>
                                        <dd>{source.wind_speed} m/s</dd>
                                    </div>
                                    {source.confidence != null && (
                                        <div>
                                            <dt>Confidence</dt>
                                            <dd>{source.confidence}%</dd>
                                        </div>
                                    )}
                                </dl>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
