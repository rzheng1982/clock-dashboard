import type {
  AirQualityApiResponse,
  QWeatherAirResponse,
  QWeatherDailyResponse,
  QWeatherHourlyResponse,
  QWeatherNowResponse,
  WeatherApiResponse,
} from './types'
import { assertQWeatherCode, buildQWeatherUrl } from './qweather'

function clampPercent(value: number): number {
  if (!Number.isFinite(value))
    return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function toNumber(value: string | number | undefined, fallback: number = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function mapQWeatherIconToWmo(icon: string): number {
  const code = Number.parseInt(icon, 10)
  if (!Number.isFinite(code))
    return -1

  if (code === 100 || code === 150)
    return 0
  if ([101, 102, 103, 151, 152, 153].includes(code))
    return 2
  if (code === 104 || code === 154)
    return 3

  if (code >= 300 && code <= 303)
    return 53
  if (code >= 304 && code <= 313)
    return 63
  if (code >= 314 && code <= 318)
    return 65
  if (code === 350 || code === 351 || code === 399)
    return 80

  if (code >= 400 && code <= 408)
    return 73
  if (code === 409 || code === 410)
    return 77
  if (code === 456 || code === 457 || code === 499)
    return 85

  if (code >= 500 && code <= 515)
    return 45

  if (code === 900 || code === 901 || code === 999)
    return 95

  return 3
}

function toHourKey(value: string): string {
  const time = value.trim()
  if (!time)
    return ''
  if (time.length >= 13)
    return time.slice(0, 13)
  return time
}

function findCurrentHourIndex(hourlyTimes: string[], currentTime: string): number {
  if (hourlyTimes.length === 0)
    return 0
  const currentHour = toHourKey(currentTime)
  const exactIndex = hourlyTimes.findIndex(time => toHourKey(time) === currentHour)
  if (exactIndex >= 0)
    return exactIndex

  const currentMs = Date.parse(currentTime)
  if (!Number.isFinite(currentMs))
    return 0

  let nearestIndex = 0
  let minGap = Number.POSITIVE_INFINITY
  hourlyTimes.forEach((time, index) => {
    const hourMs = Date.parse(time)
    if (!Number.isFinite(hourMs))
      return
    const gap = Math.abs(hourMs - currentMs)
    if (gap < minGap) {
      minGap = gap
      nearestIndex = index
    }
  })
  return nearestIndex
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherApiResponse> {
  const location = `${lon},${lat}`

  const nowUrl = buildQWeatherUrl('/v7/weather/now', { location })
  const hourlyUrl = buildQWeatherUrl('/v7/weather/24h', { location })
  const dailyUrl = buildQWeatherUrl('/v7/weather/7d', { location })

  const [nowRes, hourlyRes, dailyRes] = await Promise.all([
    fetch(nowUrl),
    fetch(hourlyUrl),
    fetch(dailyUrl),
  ])

  if (!nowRes.ok || !hourlyRes.ok || !dailyRes.ok) {
    throw new Error(`Weather API error: ${nowRes.status}/${hourlyRes.status}/${dailyRes.status}`)
  }

  const [nowData, hourlyData, dailyData] = await Promise.all([
    nowRes.json() as Promise<QWeatherNowResponse>,
    hourlyRes.json() as Promise<QWeatherHourlyResponse>,
    dailyRes.json() as Promise<QWeatherDailyResponse>,
  ])

  assertQWeatherCode(nowData, 'QWeather now')
  assertQWeatherCode(hourlyData, 'QWeather 24h')
  assertQWeatherCode(dailyData, 'QWeather 7d')

  if (!nowData.now) {
    throw new Error('QWeather now payload is empty')
  }

  const hourly = hourlyData.hourly || []
  const daily = (dailyData.daily || []).slice(0, 5)

  const hourlyTimes = hourly.map(item => item.fxTime)
  const currentTime = nowData.now.obsTime
  const currentHourIndex = findCurrentHourIndex(hourlyTimes, currentTime)

  const dailyPopByDate = new Map<string, number>()
  hourly.forEach((item) => {
    const dateKey = item.fxTime.slice(0, 10)
    const pop = clampPercent(toNumber(item.pop, 0))
    const previous = dailyPopByDate.get(dateKey) || 0
    if (pop > previous) {
      dailyPopByDate.set(dateKey, pop)
    }
  })

  return {
    current: {
      time: currentTime,
      temperature_2m: toNumber(nowData.now.temp),
      rain: toNumber(nowData.now.precip),
      wind_speed_10m: toNumber(nowData.now.windSpeed),
      is_day: nowData.now.isDay === '0' ? 0 : 1,
      apparent_temperature: toNumber(nowData.now.feelsLike),
      showers: toNumber(nowData.now.precip),
      relative_humidity_2m: clampPercent(toNumber(nowData.now.humidity)),
      precipitation: toNumber(nowData.now.precip),
      weather_code: mapQWeatherIconToWmo(nowData.now.icon),
    },
    hourly: {
      time: hourlyTimes,
      precipitation_probability: hourly.map(item => clampPercent(toNumber(item.pop, 0))),
      uv_index: hourly.map(item => toNumber(item.uvIndex, toNumber(daily[0]?.uvIndex, 0))),
      temperature_2m: hourly.map(item => toNumber(item.temp)),
    },
    daily: {
      time: daily.map(item => item.fxDate),
      weather_code: daily.map(item => mapQWeatherIconToWmo(item.iconDay)),
      temperature_2m_max: daily.map(item => toNumber(item.tempMax)),
      temperature_2m_min: daily.map(item => toNumber(item.tempMin)),
      precipitation_probability_max: daily.map((item) => {
        if (item.pop !== undefined) {
          return clampPercent(toNumber(item.pop))
        }
        return dailyPopByDate.get(item.fxDate) || 0
      }),
    },
    current_hour_index: currentHourIndex,
  }
}

export async function fetchAirQualityData(lat: number, lon: number): Promise<AirQualityApiResponse> {
  const url = buildQWeatherUrl('/v7/air/now', {
    location: `${lon},${lat}`,
  })

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Air Quality API error: ${response.statusText}`)
  }

  const data = await response.json() as QWeatherAirResponse
  assertQWeatherCode(data, 'QWeather air now')

  return {
    current: {
      us_aqi: toNumber(data.now?.aqi, 0),
    },
  }
}
