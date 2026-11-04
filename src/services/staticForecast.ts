// Режим без бэкенда (GitHub Pages): Open-Meteo напрямую из браузера + тот же fallback, что на сервере.
import type { Lang } from '../i18n/translations'
import type { Condition, HourlyForecastItem, Place, WeatherResponse } from '../types/weather'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const HOURS = 6
const MAX_TIPS = 4
const RAIN_THRESHOLD = 50

type OpenMeteoResponse = {
    current: {
        temperature_2m: number
        relative_humidity_2m: number
        weather_code: number
        wind_speed_10m: number
        pressure_msl: number
    }
    hourly: {
        time: string[]
        temperature_2m: number[]
        precipitation_probability?: (number | null)[]
        weather_code?: (number | null)[]
    }
}

function conditionFromWmo(code: number): Condition {
    if (code === 0 || code === 1) return 'Clear'
    if (code === 2 || code === 3) return 'Cloudy'
    if (code === 45 || code === 48) return 'Fog'
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
    if (code >= 95) return 'Thunderstorm'
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain'
    return 'Cloudy'
}

const round1 = (value: number) => Math.round(value * 10) / 10

const TEXTS = {
    ru: {
        rain_now: 'Возьми зонт: дождь вероятен уже сейчас',
        rain_later: 'Возьми зонт: дождь вероятен с {time}',
        snow: 'Возможен снег — обувь с нескользящей подошвой',
        storm: 'Возможна гроза — по возможности переждать в помещении',
        fog: 'Туман — на дороге будь внимательнее',
        frost: 'Сильный мороз: тёплая куртка, шапка и перчатки',
        cold: 'Холодно: тёплая куртка, шапка и перчатки',
        cool: 'Прохладно: куртка не помешает',
        mild: 'Лёгкая куртка или кофта',
        hot: 'Жарко: пей больше воды и избегай солнца днём',
        strong_wind: 'Сильный ветер — осторожнее на улице',
        wind: 'Ветрено — пригодится ветровка',
        cooling: 'К {time} похолодает до {temperature}° — возьми лишний слой',
        nice: 'Комфортная погода — особых рекомендаций нет',
    },
    en: {
        rain_now: 'Take an umbrella: rain is likely right now',
        rain_later: 'Take an umbrella: rain is likely from {time}',
        snow: 'Snow is possible — wear shoes with good grip',
        storm: 'Thunderstorms are possible — better stay indoors',
        fog: 'Fog — take extra care on the road',
        frost: 'Hard frost: warm coat, hat and gloves',
        cold: 'Cold: warm coat, hat and gloves',
        cool: 'Chilly: a jacket will help',
        mild: 'A light jacket or sweater',
        hot: 'Hot: drink more water and avoid the midday sun',
        strong_wind: 'Strong wind — be careful outside',
        wind: 'Windy — a windbreaker will come in handy',
        cooling: 'It will cool down to {temperature}° by {time} — take an extra layer',
        nice: 'Comfortable weather — no special advice',
    },
}

function format(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]))
}

function buildTips(
    temperature: number,
    condition: Condition,
    windSpeed: number,
    rainProbability: number,
    hourly: HourlyForecastItem[],
    lang: Lang,
): string[] {
    const text = TEXTS[lang] ?? TEXTS.en
    const conditions = new Set<string>([condition, ...hourly.flatMap((item) => (item.condition ? [item.condition] : []))])
    const tips: string[] = []

    if (conditions.has('Thunderstorm')) tips.push(text.storm)

    if (rainProbability >= RAIN_THRESHOLD) {
        tips.push(text.rain_now)
    } else {
        const rainy = hourly.find((item) => item.rain_probability >= RAIN_THRESHOLD)
        if (rainy) tips.push(format(text.rain_later, { time: rainy.time }))
    }

    if (conditions.has('Snow')) tips.push(text.snow)

    if (temperature <= -10) tips.push(text.frost)
    else if (temperature <= 5) tips.push(text.cold)
    else if (temperature <= 12) tips.push(text.cool)
    else if (temperature <= 18) tips.push(text.mild)
    else if (temperature >= 28) tips.push(text.hot)

    const coldest = hourly.reduce<HourlyForecastItem | null>(
        (min, item) => (min === null || item.temperature < min.temperature ? item : min),
        null,
    )
    if (coldest && coldest.temperature <= temperature - 4) {
        tips.push(format(text.cooling, { time: coldest.time, temperature: Math.round(coldest.temperature) }))
    }

    if (windSpeed >= 10) tips.push(text.strong_wind)
    else if (windSpeed >= 7) tips.push(text.wind)

    if (conditions.has('Fog')) tips.push(text.fog)

    return tips.length ? tips.slice(0, MAX_TIPS) : [text.nice]
}

export async function getStaticForecast(place: Place, lang: Lang, signal?: AbortSignal): Promise<WeatherResponse> {
    const params = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl',
        hourly: 'temperature_2m,precipitation_probability,weather_code',
        forecast_hours: String(HOURS),
        timezone: 'auto',
        wind_speed_unit: 'ms',
    })

    const response = await fetch(`${FORECAST_URL}?${params}`, { signal })
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
    const { current, hourly } = (await response.json()) as OpenMeteoResponse

    const probabilities = (hourly.precipitation_probability ?? []).map((value) => value ?? 0)
    const codes = hourly.weather_code ?? []
    const hourlyForecast: HourlyForecastItem[] = hourly.time.map((time, index) => ({
        time: time.slice(11, 16),
        temperature: round1(hourly.temperature_2m[index]),
        rain_probability: Math.round(probabilities[index] ?? 0),
        condition: codes[index] != null ? conditionFromWmo(codes[index]) : null,
    }))

    const temperature = round1(current.temperature_2m)
    const condition = conditionFromWmo(current.weather_code)
    const windSpeed = round1(current.wind_speed_10m)
    const rainProbability = Math.round(probabilities[0] ?? 0)

    return {
        city: place.name.trim() || `${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}`,
        country: null,
        temperature,
        condition,
        humidity: Math.round(current.relative_humidity_2m),
        wind_speed: windSpeed,
        pressure: Math.round(current.pressure_msl),
        rain_probability: rainProbability,
        confidence: null,
        trusted_sources: [],
        reasoning: null,
        recommendations: buildTips(temperature, condition, windSpeed, rainProbability, hourlyForecast, lang),
        hourly_forecast: hourlyForecast,
        sources: [{ source: 'Open-Meteo', temperature, rain_probability: rainProbability, wind_speed: windSpeed }],
        ai_failed: true,
        ai_error: 'not_configured',
    }
}
