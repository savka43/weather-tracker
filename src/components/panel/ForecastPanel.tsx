import { useState } from 'react'
import { ChevronDown, ChevronUp, Droplets, Gauge, LoaderCircle, MousePointerClick, RotateCw, Sparkles, Umbrella, Wind } from 'lucide-react'
import { useI18n } from '../../i18n/context'
import type { Place, WeatherResponse } from '../../types/weather'
import { WeatherIcon } from '../weather/WeatherIcon'
import { conditionKey, getHourlyWeatherType, getWeatherType } from '../weather/weatherType'

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
    const { t } = useI18n()

    return (
        <aside className={collapsed ? 'forecast-panel glass collapsed' : 'forecast-panel glass'} aria-label={t('panel.label')}>
            <header className="panel-header">
                <div className="panel-title">
                    <h1>{place?.name ?? t('app.title')}</h1>
                    <span>{place ? place.label || `${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}` : t('panel.hint')}</span>
                </div>
                <button type="button" className="icon-button" onClick={onToggle} aria-label={collapsed ? t('panel.expand') : t('panel.collapse')}>
                    {collapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </header>

            {!collapsed && (
                <div className="panel-body">
                    {status === 'idle' && (
                        <div className="panel-state">
                            <MousePointerClick size={36} aria-hidden />
                            <p>{t('state.idle')}</p>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="panel-state">
                            <LoaderCircle className="spin" size={32} aria-hidden />
                            <p>{t('state.loading')}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="panel-state">
                            <p>{t('state.error')}</p>
                            <button type="button" className="primary-button" onClick={onRetry}>
                                <RotateCw size={16} /> {t('state.retry')}
                            </button>
                        </div>
                    )}

                    {status === 'ready' && weather && (
                        <>
                            <div className="tabs" role="tablist">
                                <button type="button" role="tab" aria-selected={tab === 'forecast'} className={tab === 'forecast' ? 'tab active' : 'tab'} onClick={() => setTab('forecast')}>
                                    {t('tab.forecast')}
                                </button>
                                <button type="button" role="tab" aria-selected={tab === 'sources'} className={tab === 'sources' ? 'tab active' : 'tab'} onClick={() => setTab('sources')}>
                                    {t('tab.sources')}
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
    const { t } = useI18n()
    const condition = t(conditionKey(weather.condition))
    const details = [
        { icon: Droplets, label: t('detail.humidity'), value: `${weather.humidity}%` },
        { icon: Wind, label: t('detail.wind'), value: `${weather.wind_speed} ${t('unit.speed')}` },
        { icon: Gauge, label: t('detail.pressure'), value: `${weather.pressure} ${t('unit.pressure')}` },
        { icon: Umbrella, label: t('detail.rain'), value: `${weather.rain_probability}%` },
    ]

    return (
        <div className="tab-content">
            <section className="now">
                <WeatherIcon type={getWeatherType(weather.condition)} className="now-icon" title={condition} />
                <div>
                    <span className="now-temp">{Math.round(weather.temperature)}°</span>
                    <span className="now-condition">{condition}</span>
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

            {weather.ai_failed ? (
                <section className="ai-card ai-card-off">
                    <div className="ai-card-header">
                        <span><Sparkles size={16} aria-hidden /> {t('ai.off')}</span>
                        {weather.confidence != null && <strong>{weather.confidence}%</strong>}
                    </div>
                    <p>{t(weather.sources.length > 1 ? 'ai.offAverage' : 'ai.offSingle')}</p>
                </section>
            ) : (
                <section className="ai-card">
                    <div className="ai-card-header">
                        <span><Sparkles size={16} aria-hidden /> {t('ai.decision')}</span>
                        {weather.confidence != null && <strong>{weather.confidence}%</strong>}
                    </div>
                    {weather.confidence != null && (
                        <div className="meter" aria-label={t('ai.confidence', { value: weather.confidence })}>
                            <span style={{ width: `${weather.confidence}%` }} />
                        </div>
                    )}
                    {weather.summary && <p>{weather.summary}</p>}
                </section>
            )}

            <section>
                <h2 className="section-title">{t('hourly.title')}</h2>
                <ul className="hourly">
                    {weather.hourly_forecast.map((item) => (
                        <li key={item.time}>
                            <span>{item.time}</span>
                            <WeatherIcon type={getHourlyWeatherType(item)} className="hourly-icon" title={t('hourly.rain', { value: item.rain_probability })} />
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
    const { t } = useI18n()
    return (
        <div className="tab-content">
            <p className="muted">{t('sources.hint')}</p>
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
                                <span><Wind size={14} aria-hidden /> {source.wind_speed} {t('unit.speed')}</span>
                            </div>
                            {source.confidence != null && (
                                <div className="meter small" aria-label={t('ai.confidence', { value: source.confidence })}>
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
