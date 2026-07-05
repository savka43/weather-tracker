import { useState, type FormEvent } from 'react'
import SearchImage from '../assets/search-weather.svg'
import MainForecast from '../components/dashboard/MainForecast'
import { getWeather } from '../services/weatherApi'
import type { WeatherResponse } from '../types/weather'
import './SearchPage.css'

export default function DashboardPage() {
    const [city, setCity] = useState('')
    const [weather, setWeather] = useState<WeatherResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const nextCity = city.trim()

        if (!nextCity) {
            setError('Enter a city name to get a forecast.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const data = await getWeather(nextCity)
            setWeather(data)
        } catch {
            setError('Could not load weather data. Check that the backend is running.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className={weather ? 'main-forecast-page' : undefined}>
            {!weather ? (
                <div className="container">
                    <img className="search-image" src={SearchImage} alt="" />
                    <h1>AI Weather Analyzer</h1>
                    <p>Enter a city name to get an AI-powered weather dashboard with mock source comparison data.</p>
                    <form className="input-field-container" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter a city name..."
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                        />
                        <button className="search-button" type="submit" disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Analyze Weather'}
                        </button>
                    </form>
                    {error && <p className="form-error">{error}</p>}
                </div>
            ) : (
                <div className="dashboard-page-content">
                    <form className="dashboard-search-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter a city name..."
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                        />
                        <button className="search-button" type="submit" disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Update'}
                        </button>
                    </form>
                    {error && <p className="form-error">{error}</p>}
                    <MainForecast weather={weather} />
                </div>
            )}
        </main>
    )
}
