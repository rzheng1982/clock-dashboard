import type { AirQualityApiResponse, WeatherApiResponse } from './types'

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherApiResponse> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('current', 'time,temperature_2m,rain,wind_speed_10m,is_day,apparent_temperature,showers,relative_humidity_2m,precipitation,weather_code')
  url.searchParams.set('hourly', 'time,precipitation_probability,uv_index,temperature_2m')
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '5')
  url.searchParams.set('temperature_unit', 'celsius')
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('precipitation_unit', 'mm')
  url.searchParams.set('cell_selection', 'land')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`)
  }

  const data = await response.json() as WeatherApiResponse
  const currentTime = data.current?.time
  const hourlyTimes = data.hourly?.time || []

  let currentHourIndex = currentTime ? hourlyTimes.indexOf(currentTime) : -1
  if (currentHourIndex === -1 && currentTime) {
    const roundedHour = currentTime.slice(0, 13)
    currentHourIndex = hourlyTimes.findIndex(time => time.startsWith(roundedHour))
  }

  data.current_hour_index = currentHourIndex >= 0 ? currentHourIndex : 0

  return data
}

export async function fetchAirQualityData(lat: number, lon: number): Promise<AirQualityApiResponse> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Air Quality API error: ${response.statusText}`)
  }

  const data = await response.json() as AirQualityApiResponse
  return data
}
