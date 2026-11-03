import { useState } from 'react'
import { ChevronDown, ChevronUp, Droplets, Gauge, LoaderCircle, MousePointerClick, RotateCw, Sparkles, Umbrella, Wind } from 'lucide-react'
import type { Place, WeatherResponse } from '../../types/weather'
import { WeatherIcon } from '../weather/WeatherIcon'
import { getHourlyWeatherType, getWeatherType } from '../weather/weatherType'

export type ForecastStatus = 'idle' | 'loading' | 'error' | 'ready'

type ForecastPanelProps = {
    place: Place | null
    weather: WeatherResponse | null
    status: ForecastStatus
    collapsed: boolean
    onToggle: () => void
    onRetry: () => void
}

type Tab = 'forecast' | 'sources'

export default function ForecastPanel({ place, weather, status, collapsed, onToggle, onRetry }: ForecastPanelProps) {
    const [tab, setTab] = useState<Tab>('forecast')

    return (
        <aside className={collapsed ? 'forecast-panel glass collapsed' : 'forecast-panel glass'} aria-label="Forecast">
            <header className="panel-header">
                <div className="panel-title">
                    <h1>{place?.name ?? 'AI Weather Analyzer'}</h1>
                    <span>{place ? place.label || `${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}` : 'Pick a place to start'}</span>
                </div>
                <button type="button" className="icon-button" onClick={onToggle} aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}>
                    {collapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </header>

            {!collapsed && (
                <div className="panel-body">
                    {status === 'idle' && (
                        <div className="panel-state">
                            <MousePointerClick size={36} aria-hidden />
                            <p>Click anywhere on the map, search for a city or use your location.</p>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="panel-state">
                            <LoaderCircle className="spin" size={32} aria-hidden />
                            <p>AI is analyzing the forecasts…</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="panel-state">
                            <p>Could not load the forecast. Check that the backend is running.</p>
                            <button type="button" className="primary-button" onClick={onRetry}>
                                <RotateCw size={16} /> Retry
                            </button>
                        </div>
                    )}

                    {status === 'ready' && weather && (
                        <>
                            <div className="tabs" role="tablist">
                                <button type="button" role="tab" aria-selected={tab === 'forecast'} className={tab === 'forecast' ? 'tab active' : 'tab'} onClick={() => setTab('forecast')}>
                                    Forecast
                                </button>
                                <button type="button" role="tab" aria-selected={tab === 'sources'} className={tab === 'sources' ? 'tab active' : 'tab'} onClick={() => setTab('sources')}>
                                    Sources
                                </button>
                            </div>

                            {tab === 'forecast' ? <ForecastTab weather={weather} /> : <SourcesTab weather={weather} />}
                        </>
                    )}
                </div>
            )}
        </aside>
    )
}

function ForecastTab({ weather }: { weather: WeatherResponse }) {
    const details = [
        { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%` },
        { icon: Wind, label: 'Wind', value: `${weather.wind_speed} m/s` },
        { icon: Gauge, label: 'Pressure', value: `${weather.pressure} hPa` },
        { icon: Umbrella, label: 'Rain', value: `${weather.rain_probability}%` },
    ]

    return (
        <div className="tab-content">
            <section className="now">
                <WeatherIcon type={getWeatherType(weather.condition)} className="now-icon" />
                <div>
                    <span className="now-temp">{Math.round(weather.temperature)}°</span>
                    <span className="now-condition">{weather.condition}</span>
                </div>
            </section>

            <ul className="details">
                {details.map(({ icon: Icon, label, value }) => (
                    <li key={label}>
                        <Icon size={16} aria-hidden />
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </li>
                ))}
            </ul>

            <section className="ai-card">
                <div className="ai-card-header">
                    <span><Sparkles size={16} aria-hidden /> AI decision</span>
                    <strong>{weather.confidence}%</strong>
                </div>
                <div className="meter" aria-label={`Confidence ${weather.confidence}%`}>
                    <span style={{ width: `${weather.confidence}%` }} />
                </div>
                <p>{weather.summary}</p>
            </section>

            <section>
                <h2 className="section-title">Next hours</h2>
                <ul className="hourly">
                    {weather.hourly_forecast.map((item) => (
                        <li key={item.time}>
                            <span>{item.time}</span>
                            <WeatherIcon type={getHourlyWeatherType(item)} className="hourly-icon" />
                            <strong>{Math.round(item.temperature)}°</strong>
                            <small>{item.rain_probability}%</small>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}

function SourcesTab({ weather }: { weather: WeatherResponse }) {
    return (
        <div className="tab-content">
            <p className="muted">How each source sees the weather. The AI weighs them to make the final decision.</p>
            <ul className="sources">
                {weather.sources.map((source) => {
                    const isAi = source.source.toLowerCase().includes('ai')

                    return (
                        <li key={source.source} className={isAi ? 'source ai' : 'source'}>
                            <div className="source-head">
                                <strong>{isAi && <Sparkles size={14} aria-hidden />} {source.source}</strong>
                                <span className="source-temp">{Math.round(source.temperature)}°</span>
                            </div>
                            <div className="source-stats">
                                <span><Umbrella size={14} aria-hidden /> {source.rain_probability}%</span>
                                <span><Wind size={14} aria-hidden /> {source.wind_speed} m/s</span>
                            </div>
                            {source.confidence != null && (
                                <div className="meter small" aria-label={`Confidence ${source.confidence}%`}>
                                    <span style={{ width: `${source.confidence}%` }} />
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
