import clearIcon from '../../assets/weather/clear.svg'
import cloudyIcon from '../../assets/weather/cloudy.svg'
import fogIcon from '../../assets/weather/fog.svg'
import rainIcon from '../../assets/weather/rain.svg'
import snowIcon from '../../assets/weather/snow.svg'
import thunderIcon from '../../assets/weather/thunder.svg'

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog'

type WeatherIconProps = {
    type: WeatherType
    className?: string
    title?: string
}

const weatherTitle: Record<WeatherType, string> = {
    clear: 'Clear weather',
    cloudy: 'Cloudy weather',
    rain: 'Rainy weather',
    snow: 'Snowy weather',
    thunder: 'Thunderstorm',
    fog: 'Foggy weather',
}

const weatherIconSrc: Record<WeatherType, string> = {
    clear: clearIcon,
    cloudy: cloudyIcon,
    rain: rainIcon,
    snow: snowIcon,
    thunder: thunderIcon,
    fog: fogIcon,
}

export function WeatherIcon({ type, className = '', title }: WeatherIconProps) {
    const label = title ?? weatherTitle[type]
    const classNames = ['weather-icon', className].filter(Boolean).join(' ')

    return <img className={classNames} src={weatherIconSrc[type]} alt={label} />
}
