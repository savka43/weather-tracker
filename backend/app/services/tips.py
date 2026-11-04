"""Советы по простым правилам — когда ИИ не подключён или не ответил."""

from app.schemas.weather import HourlyForecastItem

MAX_TIPS = 4
RAIN_THRESHOLD = 50

TEXTS = {
    "ru": {
        "rain_now": "Возьми зонт: дождь вероятен уже сейчас",
        "rain_later": "Возьми зонт: дождь вероятен с {time}",
        "snow": "Возможен снег — обувь с нескользящей подошвой",
        "storm": "Возможна гроза — по возможности переждать в помещении",
        "fog": "Туман — на дороге будь внимательнее",
        "frost": "Сильный мороз: тёплая куртка, шапка и перчатки",
        "cold": "Холодно: тёплая куртка, шапка и перчатки",
        "cool": "Прохладно: куртка не помешает",
        "mild": "Лёгкая куртка или кофта",
        "hot": "Жарко: пей больше воды и избегай солнца днём",
        "strong_wind": "Сильный ветер — осторожнее на улице",
        "wind": "Ветрено — пригодится ветровка",
        "cooling": "К {time} похолодает до {temperature}° — возьми лишний слой",
        "nice": "Комфортная погода — особых рекомендаций нет",
    },
    "en": {
        "rain_now": "Take an umbrella: rain is likely right now",
        "rain_later": "Take an umbrella: rain is likely from {time}",
        "snow": "Snow is possible — wear shoes with good grip",
        "storm": "Thunderstorms are possible — better stay indoors",
        "fog": "Fog — take extra care on the road",
        "frost": "Hard frost: warm coat, hat and gloves",
        "cold": "Cold: warm coat, hat and gloves",
        "cool": "Chilly: a jacket will help",
        "mild": "A light jacket or sweater",
        "hot": "Hot: drink more water and avoid the midday sun",
        "strong_wind": "Strong wind — be careful outside",
        "wind": "Windy — a windbreaker will come in handy",
        "cooling": "It will cool down to {temperature}° by {time} — take an extra layer",
        "nice": "Comfortable weather — no special advice",
    },
}


def build_tips(
    temperature: float,
    condition: str,
    wind_speed: float,
    rain_probability: int,
    hourly: list[HourlyForecastItem],
    lang: str,
) -> list[str]:
    text = TEXTS.get(lang, TEXTS["en"])
    conditions = {condition, *(item.condition for item in hourly if item.condition)}
    tips: list[str] = []

    if "Thunderstorm" in conditions:
        tips.append(text["storm"])

    if rain_probability >= RAIN_THRESHOLD:
        tips.append(text["rain_now"])
    else:
        rainy = next((item for item in hourly if item.rain_probability >= RAIN_THRESHOLD), None)
        if rainy is not None:
            tips.append(text["rain_later"].format(time=rainy.time))

    if "Snow" in conditions:
        tips.append(text["snow"])

    if temperature <= -10:
        tips.append(text["frost"])
    elif temperature <= 5:
        tips.append(text["cold"])
    elif temperature <= 12:
        tips.append(text["cool"])
    elif temperature <= 18:
        tips.append(text["mild"])
    elif temperature >= 28:
        tips.append(text["hot"])

    coldest = min(hourly, key=lambda item: item.temperature, default=None)
    if coldest is not None and coldest.temperature <= temperature - 4:
        tips.append(text["cooling"].format(time=coldest.time, temperature=round(coldest.temperature)))

    if wind_speed >= 10:
        tips.append(text["strong_wind"])
    elif wind_speed >= 7:
        tips.append(text["wind"])

    if "Fog" in conditions:
        tips.append(text["fog"])

    return tips[:MAX_TIPS] or [text["nice"]]
